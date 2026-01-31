interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

type PagesFunction<E = unknown> = (context: {
  request: Request;
  env: E;
  params: Record<string, string>;
}) => Response | Promise<Response>;

async function getUserId(env: Env, token: string): Promise<string | null> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: { Authorization: `Bearer ${token}`, apikey: env.SUPABASE_SERVICE_ROLE_KEY },
  });
  if (!res.ok) return null;
  const user = await res.json() as { id: string };
  return user.id;
}

// GET: 오늘 사용 여부 확인
export const onRequestGet: PagesFunction<Env> = async (context) => {
  const auth = context.request.headers.get('Authorization');
  if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const token = auth.replace('Bearer ', '');
  const userId = await getUserId(context.env, token);
  if (!userId) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const today = new Date().toISOString().split('T')[0];
  const res = await fetch(
    `${context.env.SUPABASE_URL}/rest/v1/fashion_usage?user_id=eq.${userId}&used_date=eq.${today}&select=id`,
    { headers: { apikey: context.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}` } }
  );
  const rows = await res.json() as any[];

  return new Response(JSON.stringify({ usedToday: rows?.length > 0 }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

// POST: 사용 기록
export const onRequestPost: PagesFunction<Env> = async (context) => {
  const auth = context.request.headers.get('Authorization');
  if (!auth) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const token = auth.replace('Bearer ', '');
  const userId = await getUserId(context.env, token);
  if (!userId) return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { 'Content-Type': 'application/json' } });

  const today = new Date().toISOString().split('T')[0];
  await fetch(`${context.env.SUPABASE_URL}/rest/v1/fashion_usage`, {
    method: 'POST',
    headers: {
      apikey: context.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=ignore-duplicates',
    },
    body: JSON.stringify({ user_id: userId, used_date: today }),
  });

  return new Response(JSON.stringify({ ok: true }), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
