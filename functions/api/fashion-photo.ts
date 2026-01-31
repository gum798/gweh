interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

const R2_BASE = 'https://pub-f912e0aa955046d390bf74abcc03725b.r2.dev';

async function getUserId(env: Env, accessToken: string): Promise<string | null> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!res.ok) return null;
  const user = await res.json() as { id: string };
  return user.id;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response('Unauthorized', { status: 401 });
    }

    const userId = await getUserId(context.env, authHeader.slice(7));
    if (!userId) {
      return new Response('Invalid token', { status: 401 });
    }

    const r2Url = `${R2_BASE}/profiles/${userId}/fashion.jpg`;
    const r2Res = await fetch(r2Url);

    if (!r2Res.ok) {
      return Response.json({ exists: false }, { status: 404 });
    }

    const origin = context.request.headers.get('origin') || '*';
    return new Response(r2Res.body, {
      headers: {
        'Content-Type': r2Res.headers.get('Content-Type') || 'image/jpeg',
        'Access-Control-Allow-Origin': origin,
        'Cache-Control': 'no-cache',
      },
    });
  } catch {
    return new Response('Error', { status: 500 });
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  const origin = context.request.headers.get('origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Authorization',
    },
  });
};
