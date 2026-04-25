import { getCurrentUser } from '@/lib/auth';
import { ensureAppSchema, hasDatabaseConfig } from '@/lib/db';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ONBOARDING_META_KEY = '__baltrackOnboarding';

export async function GET(request) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  const store = await getPlanStore();
  const plan = await store.load(auth.user.id);

  return jsonNoStore({
    ok: true,
    data: plan,
    storage: 'postgres',
    storageLabel: 'Cloud database',
  });
}

export async function PUT(request) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  const plan = await request.json().catch(() => null);
  if (!plan || typeof plan !== 'object' || Array.isArray(plan)) {
    return jsonNoStore({ error: 'Invalid plan payload.' }, { status: 400 });
  }

  const store = await getPlanStore();
  const savedAt = new Date().toISOString();
  if (isIncompleteOnboardingDraft(plan)) {
    const existingPlan = await store.load(auth.user.id);
    if (existingPlan && !isIncompleteOnboardingDraft(existingPlan)) {
      return jsonNoStore({
        ok: true,
        savedAt,
        storage: 'postgres',
        storageLabel: 'Cloud database',
      });
    }
  }

  await store.save(auth.user.id, plan, savedAt);

  return jsonNoStore({
    ok: true,
    savedAt,
    storage: 'postgres',
    storageLabel: 'Cloud database',
  });
}

export async function DELETE(request) {
  const auth = await requireUser(request);
  if (auth.response) return auth.response;

  const store = await getPlanStore();
  await store.reset(auth.user.id);

  return jsonNoStore({
    ok: true,
    storage: 'postgres',
    storageLabel: 'Cloud database',
  });
}

async function requireUser(request) {
  if (!hasDatabaseConfig()) {
    return {
      response: jsonNoStore({ error: 'Cloud database is not configured.' }, { status: 503 }),
    };
  }

  const user = await getCurrentUser(request);
  if (!user) {
    return {
      response: jsonNoStore({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user };
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

function isIncompleteOnboardingDraft(plan) {
  const meta = plan?.[ONBOARDING_META_KEY];
  return Boolean(meta && typeof meta === 'object' && !Array.isArray(meta) && meta.complete === false);
}

async function getPlanStore() {
  const sql = await ensureAppSchema();

  return {
    async load(userId) {
      const result = await sql`
        SELECT plan
        FROM baltrack_plans
        WHERE user_id = ${userId}
        LIMIT 1
      `;

      return result[0]?.plan ?? null;
    },
    async save(userId, plan, savedAt) {
      await sql`
        INSERT INTO baltrack_plans (user_id, plan, updated_at)
        VALUES (${userId}, ${JSON.stringify(plan)}::jsonb, ${savedAt})
        ON CONFLICT (user_id)
        DO UPDATE SET plan = EXCLUDED.plan, updated_at = EXCLUDED.updated_at
      `;
    },
    async reset(userId) {
      await sql`
        DELETE FROM baltrack_plans
        WHERE user_id = ${userId}
      `;
    },
  };
}
