let sqlClient;
let schemaReady = false;

export function hasDatabaseConfig() {
  return Boolean(getConnectionString());
}

export async function getSql() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error('DATABASE_URL or POSTGRES_URL is required.');
  }

  if (!sqlClient) {
    const { neon } = await import('@neondatabase/serverless');
    sqlClient = neon(connectionString);
  }

  return sqlClient;
}

export async function ensureAppSchema() {
  const sql = await getSql();
  if (schemaReady) return sql;

  await sql`
    CREATE TABLE IF NOT EXISTS baltrack_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS baltrack_sessions (
      token_hash TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES baltrack_users(id) ON DELETE CASCADE,
      expires_at TIMESTAMPTZ NOT NULL,
      created_at TIMESTAMPTZ NOT NULL
    )
  `;

  await sql`
    CREATE INDEX IF NOT EXISTS baltrack_sessions_user_id_idx
    ON baltrack_sessions (user_id)
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS baltrack_plans (
      user_id TEXT PRIMARY KEY REFERENCES baltrack_users(id) ON DELETE CASCADE,
      plan JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL
    )
  `;

  schemaReady = true;
  return sql;
}

function getConnectionString() {
  return process.env.DATABASE_URL || process.env.POSTGRES_URL || '';
}
