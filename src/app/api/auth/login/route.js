import { NextResponse } from 'next/server';
import {
  authenticateUser,
  createSession,
  getSessionCookieName,
  getSessionCookieOptions,
} from '@/lib/auth';
import { checkRateLimit, rateLimitKey } from '@/lib/rate-limit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const limited = checkRateLimit(rateLimitKey(request, 'login'), { limit: 8 });
  if (!limited.ok) {
    return jsonNoStore(
      { error: 'Too many attempts. Try again soon.' },
      {
        status: 429,
        headers: { 'Retry-After': String(limited.retryAfterSeconds) },
      }
    );
  }

  const body = await request.json().catch(() => ({}));
  const result = await authenticateUser(body.email, body.password);
  if (!result.ok) {
    return jsonNoStore({ error: result.error }, { status: result.status || 401 });
  }

  const session = await createSession(result.user.id);
  const response = NextResponse.json({ user: publicUser(result.user) });
  response.cookies.set(getSessionCookieName(), session.token, getSessionCookieOptions(session.expiresAt));
  response.headers.set('Cache-Control', 'no-store');

  return response;
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
  };
}

function jsonNoStore(body, init = {}) {
  return Response.json(body, {
    ...init,
    headers: {
      ...init.headers,
      'Cache-Control': 'no-store',
    },
  });
}
