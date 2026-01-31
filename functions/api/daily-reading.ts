interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user
    const userRes = await fetch(`${context.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${authHeader.slice(7)}`,
        'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });
    if (!userRes.ok) return Response.json({ error: 'Invalid token' }, { status: 401 });
    const user = await userRes.json() as { id: string };

    // Get user profile for timezone (longitude)
    const profileRes = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/user_profiles?user_id=eq.${user.id}&select=last_lon`,
      {
        headers: {
          'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const profiles = await profileRes.json() as { last_lon?: number }[];
    const lon = profiles?.[0]?.last_lon ?? 126.978; // 기본값: 서울

    // 사용자 위치 기반 로컬 날짜 계산
    const now = new Date();
    const offsetMs = Math.round(lon / 15) * 60 * 60 * 1000;
    const localDate = new Date(now.getTime() + offsetMs).toISOString().split('T')[0];

    const res = await fetch(
      `${context.env.SUPABASE_URL}/rest/v1/daily_readings?user_id=eq.${user.id}&reading_date=eq.${localDate}&select=*`,
      {
        headers: {
          'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${context.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );

    if (!res.ok) {
      return Response.json({ reading: null }, { status: 200 });
    }

    const data = await res.json() as any[];
    return Response.json({ reading: data?.[0] || null }, {
      headers: { 'Access-Control-Allow-Origin': context.request.headers.get('origin') || '*' },
    });
  } catch (error) {
    console.error('Daily reading error:', error);
    return Response.json({ reading: null }, { status: 200 });
  }
};

export const onRequestOptions: PagesFunction = async (context) => {
  const origin = context.request.headers.get('origin') || '*';
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
};
