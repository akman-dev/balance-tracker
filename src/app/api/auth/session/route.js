import { getCurrentUser } from '@/lib/auth';
import { hasDatabaseConfig } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request) {
  if (!hasDatabaseConfig()) {
    return jsonNoStore(
      {
        authenticated: false,
        user: null,
        error: 'Cloud database is not configured.',
      },
      { status: 503 }
    );
  }

  const user = await getCurrentUser(request);
  return jsonNoStore({
    authenticated: Boolean(user),
    user: user ? publicUser(user) : null,
  });
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

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
  };
}
