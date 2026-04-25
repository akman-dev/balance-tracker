import {
  createHash,
  randomBytes,
  randomUUID,
  scrypt as scryptCallback,
  timingSafeEqual,
} from 'node:crypto';
import { promisify } from 'node:util';
import { ensureAppSchema, hasDatabaseConfig } from './db';

const scrypt = promisify(scryptCallback);

const SESSION_DAYS = 30;
export const SESSION_MAX_AGE_SECONDS = SESSION_DAYS * 24 * 60 * 60;
export const PASSWORD_MIN_LENGTH = 12;

export function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function validatePassword(password) {
  if (String(password || '').length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  return '';
}

export function getSessionCookieName() {
  return process.env.NODE_ENV === 'production' ? '__Host-baltrack-session' : 'baltrack-session';
}

export function getSessionCookieOptions(expiresAt = sessionExpiry()) {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  };
}

export function getExpiredSessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(0),
    maxAge: 0,
  };
}

export async function createUserAccount(email, password) {
  if (!hasDatabaseConfig()) {
    return { ok: false, status: 503, error: 'Cloud database is not configured.' };
  }

  const normalizedEmail = normalizeEmail(email);
  if (!isValidEmail(normalizedEmail)) {
    return { ok: false, status: 400, error: 'Enter a valid email address.' };
  }

  const passwordError = validatePassword(password);
  if (passwordError) {
    return { ok: false, status: 400, error: passwordError };
  }

  const sql = await ensureAppSchema();

  const now = new Date().toISOString();
  const user = {
    id: randomUUID(),
    email: normalizedEmail,
  };

  try {
    await sql`
      INSERT INTO baltrack_users (id, email, password_hash, created_at, updated_at)
      VALUES (${user.id}, ${user.email}, ${await hashPassword(password)}, ${now}, ${now})
    `;
  } catch (error) {
    if (error?.code === '23505') {
      return { ok: false, status: 409, error: 'An account with that email already exists.' };
    }

    throw error;
  }

  return { ok: true, user };
}

export async function authenticateUser(email, password) {
  if (!hasDatabaseConfig()) {
    return { ok: false, status: 503, error: 'Cloud database is not configured.' };
  }

  const normalizedEmail = normalizeEmail(email);
  const sql = await ensureAppSchema();
  const result = await sql`
    SELECT id, email, password_hash
    FROM baltrack_users
    WHERE email = ${normalizedEmail}
    LIMIT 1
  `;
  const row = result[0];

  if (!row || !(await verifyPassword(password, row.password_hash))) {
    return { ok: false, status: 401, error: 'Invalid email or password.' };
  }

  return {
    ok: true,
    user: {
      id: row.id,
      email: row.email,
    },
  };
}

export async function createSession(userId) {
  const sql = await ensureAppSchema();
  const token = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(token);
  const now = new Date().toISOString();
  const expiresAt = sessionExpiry();

  await sql`
    DELETE FROM baltrack_sessions
    WHERE expires_at <= NOW()
  `;

  await sql`
    INSERT INTO baltrack_sessions (token_hash, user_id, expires_at, created_at)
    VALUES (${tokenHash}, ${userId}, ${expiresAt.toISOString()}, ${now})
  `;

  return { token, expiresAt };
}

export async function getCurrentUser(request) {
  if (!hasDatabaseConfig()) return null;

  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return null;

  const sql = await ensureAppSchema();
  const tokenHash = hashToken(token);
  const result = await sql`
    SELECT u.id, u.email
    FROM baltrack_sessions s
    INNER JOIN baltrack_users u ON u.id = s.user_id
    WHERE s.token_hash = ${tokenHash}
      AND s.expires_at > NOW()
    LIMIT 1
  `;

  return result[0] || null;
}

export async function deleteSession(request) {
  if (!hasDatabaseConfig()) return;

  const token = request.cookies.get(getSessionCookieName())?.value;
  if (!token) return;

  const sql = await ensureAppSchema();
  await sql`
    DELETE FROM baltrack_sessions
    WHERE token_hash = ${hashToken(token)}
  `;
}

async function hashPassword(password) {
  const salt = randomBytes(16).toString('base64url');
  const derivedKey = await scrypt(String(password), salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });

  return `scrypt:v1:${salt}:${Buffer.from(derivedKey).toString('base64url')}`;
}

async function verifyPassword(password, storedHash) {
  const [algorithm, version, salt, key] = String(storedHash || '').split(':');
  if (algorithm !== 'scrypt' || version !== 'v1' || !salt || !key) return false;

  const derivedKey = await scrypt(String(password || ''), salt, 64, {
    N: 16384,
    r: 8,
    p: 1,
    maxmem: 64 * 1024 * 1024,
  });
  const storedKey = Buffer.from(key, 'base64url');

  if (storedKey.length !== derivedKey.length) return false;
  return timingSafeEqual(storedKey, derivedKey);
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('base64url');
}

function sessionExpiry() {
  return new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000);
}
