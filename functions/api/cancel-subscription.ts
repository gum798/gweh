
interface Env {
    POLAR_SANDBOX_ACCESS_TOKEN: string;
    POLAR_ACCESS_TOKEN: string;
    POLAR_SANDBOX: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
    try {
        const authHeader = context.request.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const accessToken = authHeader.slice(7);

        // 1. Verify user with Supabase
        const userRes = await fetch(`${context.env.SUPABASE_URL}/auth/v1/user`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'apikey': context.env.SUPABASE_SERVICE_ROLE_KEY,
            },
        });

        if (!userRes.ok) {
            return Response.json({ error: 'Invalid user token' }, { status: 401 });
        }

        const user = await userRes.json() as { email: string };

        // 2. Setup Polar API
        const isSandbox = context.env.POLAR_SANDBOX === 'true';
        const polarToken = isSandbox
            ? context.env.POLAR_SANDBOX_ACCESS_TOKEN
            : context.env.POLAR_ACCESS_TOKEN;
        const apiBaseUrl = isSandbox
            ? 'https://sandbox-api.polar.sh'
            : 'https://api.polar.sh';

        // 3. Find customer by email
        const custRes = await fetch(
            `${apiBaseUrl}/v1/customers/?email=${encodeURIComponent(user.email)}&limit=1`,
            { headers: { 'Authorization': `Bearer ${polarToken}` } }
        );

        if (!custRes.ok) {
            return Response.json({ error: 'Customer not found' }, { status: 404 });
        }

        const custData = await custRes.json() as { items: any[] };
        const customer = custData.items?.[0];

        if (!customer) {
            return Response.json({ error: 'Customer not found' }, { status: 404 });
        }

        // 4. Find active subscription
        const subsRes = await fetch(
            `${apiBaseUrl}/v1/subscriptions/?customer_id=${customer.id}&limit=10`,
            { headers: { 'Authorization': `Bearer ${polarToken}` } }
        );

        if (!subsRes.ok) {
            return Response.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
        }

        const subsData = await subsRes.json() as { items: any[] };
        const activeSub = subsData.items?.find(
            (s: any) => s.status === 'active' || s.status === 'trialing'
        );

        if (!activeSub) {
            return Response.json({ error: 'No active subscription found' }, { status: 404 });
        }

        // 5. Cancel subscription
        // Using DELETE /v1/subscriptions/{id} (Management API)
        const cancelRes = await fetch(
            `${apiBaseUrl}/v1/subscriptions/${activeSub.id}`,
            {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${polarToken}` }
            }
        );

        if (!cancelRes.ok) {
            const errorText = await cancelRes.text();
            console.error('Cancellation failed:', errorText);
            return Response.json({ error: 'Failed to cancel subscription', details: errorText }, { status: 500 });
        }

        const result = await cancelRes.json();
        return Response.json({ success: true, subscription: result });

    } catch (error) {
        console.error('Cancel subscription error:', error);
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
};

export const onRequestOptions: PagesFunction = async (context) => {
    const origin = context.request.headers.get('origin') || '*';
    return new Response(null, {
        status: 204,
        headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
};
