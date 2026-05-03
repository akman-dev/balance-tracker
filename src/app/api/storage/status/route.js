import { ensureAppSchema, hasDatabaseConfig } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  if (!hasDatabaseConfig()) {
    return jsonNoStore(
      {
        ok: false,
        configured: false,
        storage: 'postgres',
        storageLabel: 'Neon Postgres',
        error: 'DATABASE_URL or POSTGRES_URL is not configured.',
      },
      { status: 503 }
    );
  }

  try {
    const sql = await ensureAppSchema();
    await sql`SELECT 1`;

    return jsonNoStore({
      ok: true,
      configured: true,
      storage: 'postgres',
      storageLabel: 'Neon Postgres',
    });
  } catch (error) {
    console.error('Storage health check failed:', error);
    return jsonNoStore(
      {
        ok: false,
        configured: true,
        storage: 'postgres',
        storageLabel: 'Neon Postgres',
        error: 'Could not connect to the cloud database.',
      },
      { status: 500 }
    );
  }
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
