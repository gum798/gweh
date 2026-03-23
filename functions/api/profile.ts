interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

async function getUser(env: Env, accessToken: string): Promise<{ id: string; email: string } | null> {
  const res = await fetch(`${env.SUPABASE_URL}/auth/v1/user`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
    },
  });
  if (!res.ok) return null;
  return res.json() as Promise<{ id: string; email: string }>;
}

function supabaseRest(env: Env, path: string, options: RequestInit = {}) {
  return fetch(`${env.SUPABASE_URL}/rest/v1/${path}`, {
    ...options,
    headers: {
      'apikey': env.SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
      ...options.headers,
    },
  });
}

// GET /api/profile
export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(context.env, authHeader.slice(7));
    if (!user) return Response.json({ error: 'Invalid token' }, { status: 401 });

    const res = await supabaseRest(context.env, `user_profiles?user_id=eq.${user.id}&select=*`);
    const data = await res.json() as any[];
    const profile = data?.[0] || null;

    return Response.json({ profile }, {
      headers: { 'Access-Control-Allow-Origin': context.request.headers.get('origin') || '*' },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
};

// POST /api/profile
export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await getUser(context.env, authHeader.slice(7));
    if (!user) return Response.json({ error: 'Invalid token' }, { status: 401 });

    const body = await context.request.json() as {
      height?: number;
      weight?: number;
      photo_url?: string;
      last_lat?: number;
      last_lon?: number;
      birth_date?: string;
      birth_hour?: number;
      calendar_type?: string;
      theme?: string;
    };

    // Upsert profile
    const profileData: any = {
      user_id: user.id,
      updated_at: new Date().toISOString(),
    };
    if (body.height !== undefined) profileData.height = body.height;
    if (body.weight !== undefined) profileData.weight = body.weight;
    if (body.photo_url !== undefined) profileData.photo_url = body.photo_url;
    if (body.last_lat !== undefined) profileData.last_lat = body.last_lat;
    if (body.last_lon !== undefined) profileData.last_lon = body.last_lon;
    if (body.birth_date !== undefined) profileData.birth_date = body.birth_date;
    if (body.birth_hour !== undefined) profileData.birth_hour = body.birth_hour;
    if (body.calendar_type !== undefined && (body.calendar_type === 'solar' || body.calendar_type === 'lunar')) {
      profileData.calendar_type = body.calendar_type;
    }
    if (body.theme !== undefined) profileData.theme = body.theme;

    const res = await supabaseRest(
      context.env,
      'user_profiles?on_conflict=user_id',
      {
        method: 'POST',
        body: JSON.stringify(profileData),
        headers: {
          'Prefer': 'resolution=merge-duplicates,return=representation',
        },
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error('Upsert profile error:', err);
      return Response.json({ error: 'Failed to save profile', detail: err }, { status: 500 });
    }

    const result = await res.json();
    return Response.json({ profile: Array.isArray(result) ? result[0] : result }, {
      headers: { 'Access-Control-Allow-Origin': context.request.headers.get('origin') || '*' },
    });
  } catch (error) {
    console.error('Save profile error:', error);
    return Response.json({ error: 'Internal error' }, { status: 500 });
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  const origin = context.request.headers.get('origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
