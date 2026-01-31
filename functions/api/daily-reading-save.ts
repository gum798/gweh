interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const accessToken = authHeader.slice(7);
    const userRes = await fetch(`${context.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    if (!userRes.ok) {
      return Response.json({ error: 'Invalid token' }, { status: 401, headers: corsHeaders });
    }
    const user = await userRes.json() as { id: string };

    const { omen_message, energy_score } = await context.request.json() as {
      omen_message?: string;
      energy_score?: number;
    };

    if (!omen_message && energy_score == null) {
      return Response.json({ error: 'Nothing to save' }, { status: 400, headers: corsHeaders });
    }

    // 로컬 날짜 계산
    const profileRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${user.id}&select=last_lon`,
      { headers: { 'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY, 'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}` } }
    );
    const profiles = await profileRes.json() as { last_lon?: number }[];
    const lon = profiles?.[0]?.last_lon ?? 126.978;
    const now = new Date();
    const offsetMs = Math.round(lon / 15) * 60 * 60 * 1000;
    const localDate = new Date(now.getTime() + offsetMs).toISOString().split('T')[0];

    const data: any = {
      user_id: user.id,
      reading_date: localDate,
    };
    if (omen_message) data.omen_message = omen_message;
    if (energy_score != null) data.energy_score = energy_score;

    const res = await fetch(`${context.env.SUPABASE_URL}/rest/v1/daily_readings`, {
      method: 'POST',
      headers: {
        'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('Daily reading save error:', err);
      return Response.json({ error: 'Save failed' }, { status: 500, headers: corsHeaders });
    }

    return Response.json({ success: true }, { headers: corsHeaders });
  } catch (error) {
    console.error('Daily reading save error:', error);
    return Response.json({ error: 'Server error' }, { status: 500, headers: corsHeaders });
  }
};

export const onRequestOptions: PagesFunction = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
