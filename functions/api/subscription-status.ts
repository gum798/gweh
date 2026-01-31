interface Env {
  POLAR_SANDBOX_ACCESS_TOKEN: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SANDBOX: string;
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  try {
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return Response.json({ subscribed: false }, { status: 200 });
    }

    const accessToken = authHeader.slice(7);

    // Get user email from Supabase
    const userRes = await fetch(`${context.env.SUPABASE_URL}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
      },
    });

    if (!userRes.ok) {
      return Response.json({ subscribed: false }, { status: 200 });
    }

    const user = await userRes.json() as { email: string };

    // Check Polar subscriptions for this customer email
    const isSandbox = context.env.POLAR_SANDBOX === 'true';
    const polarToken = isSandbox
      ? context.env.POLAR_SANDBOX_ACCESS_TOKEN
      : context.env.POLAR_ACCESS_TOKEN;
    const apiBaseUrl = isSandbox
      ? 'https://sandbox-api.polar.sh'
      : 'https://api.polar.sh';

    // 1. Find customer by email
    const custRes = await fetch(
      `${apiBaseUrl}/v1/customers/?email=${encodeURIComponent(user.email)}&limit=1`,
      { headers: { 'Authorization': `Bearer ${polarToken}` } }
    );

    if (!custRes.ok) {
      console.error('Polar customer lookup error:', await custRes.text());
      return Response.json({ subscribed: false, trialing: false }, { status: 200 });
    }

    const custData = await custRes.json() as { items: any[] };
    const customer = custData.items?.[0];
    if (!customer) {
      return Response.json({ subscribed: false, trialing: false }, { status: 200 });
    }

    // 2. Fetch subscriptions by customer_id
    const subsRes = await fetch(
      `${apiBaseUrl}/v1/subscriptions/?customer_id=${customer.id}&limit=10`,
      { headers: { 'Authorization': `Bearer ${polarToken}` } }
    );

    if (!subsRes.ok) {
      console.error('Polar subscription check error:', await subsRes.text());
      return Response.json({ subscribed: false, trialing: false }, { status: 200 });
    }

    const subsData = await subsRes.json() as { items: any[] };
    const activeSub = subsData.items?.find(
      (s: any) => s.status === 'active' || s.status === 'trialing'
    );
    const isSubscribed = !!activeSub;
    const isTrialing = activeSub?.status === 'trialing';
    const trialEndsAt = activeSub?.trial_end || null;

    return Response.json({ subscribed: isSubscribed, trialing: isTrialing, trialEndsAt }, {
      headers: {
        'Access-Control-Allow-Origin': context.request.headers.get('origin') || '*',
      },
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return Response.json({ subscribed: false }, { status: 200 });
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
