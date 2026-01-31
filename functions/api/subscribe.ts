interface Env {
  POLAR_SANDBOX_ACCESS_TOKEN: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SANDBOX: string;
  POLAR_SANDBOX_SUBSCRIPTION_PRODUCT_ID: string;
  POLAR_SUBSCRIPTION_PRODUCT_ID: string;
}

interface SubscribeRequest {
  customerEmail?: string;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const isSandbox = context.env.POLAR_SANDBOX === 'true';
    const accessToken = isSandbox
      ? context.env.POLAR_SANDBOX_ACCESS_TOKEN
      : context.env.POLAR_ACCESS_TOKEN;

    if (!accessToken) {
      return Response.json(
        { error: `POLAR_${isSandbox ? 'SANDBOX_' : ''}ACCESS_TOKEN not configured` },
        { status: 500 }
      );
    }

    const apiBaseUrl = isSandbox
      ? 'https://sandbox-api.polar.sh'
      : 'https://api.polar.sh';
    const productId = isSandbox
      ? context.env.POLAR_SANDBOX_SUBSCRIPTION_PRODUCT_ID
      : context.env.POLAR_SUBSCRIPTION_PRODUCT_ID;

    if (!productId) {
      return Response.json(
        { error: 'Subscription product ID not configured' },
        { status: 500 }
      );
    }

    let body: SubscribeRequest = {};
    try {
      body = await context.request.json();
    } catch {
      // Empty body OK
    }

    const origin = context.request.headers.get('origin') || 'https://gweh-3s2.pages.dev';
    const successUrl = `${origin}?subscription_success=true`;

    const response = await fetch(`${apiBaseUrl}/v1/checkouts/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        products: [productId],
        success_url: successUrl,
        customer_email: body.customerEmail,
        metadata: {},
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Polar subscribe error:', errorData);
      return Response.json(
        { error: 'Failed to create subscription checkout', details: errorData },
        { status: response.status }
      );
    }

    const session = await response.json();
    return Response.json({ url: session.url, id: session.id }, {
      headers: {
        'Access-Control-Allow-Origin': origin,
      },
    });
  } catch (error) {
    console.error('Subscribe error:', error);
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
