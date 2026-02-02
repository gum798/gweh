// Polar Checkout Session API Handler for Cloudflare Pages Functions

interface Env {
  POLAR_SANDBOX_ACCESS_TOKEN: string;
  POLAR_ACCESS_TOKEN: string;
  POLAR_SANDBOX: string;
  POLAR_SANDBOX_PRODUCT_ID: string;
  POLAR_PRODUCT_ID: string;
}

interface CheckoutRequest {
  customerEmail?: string;
  metadata?: Record<string, string>;
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    // Sandbox or Production
    const isSandbox = context.env.POLAR_SANDBOX === 'true';

    const accessToken = isSandbox
      ? context.env.POLAR_SANDBOX_ACCESS_TOKEN
      : context.env.POLAR_ACCESS_TOKEN;

    if (!accessToken) {
      return new Response(
        JSON.stringify({ error: `POLAR_${isSandbox ? 'SANDBOX_' : ''}ACCESS_TOKEN not configured` }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const apiBaseUrl = isSandbox
      ? 'https://sandbox-api.polar.sh'
      : 'https://api.polar.sh';
    const productId = isSandbox
      ? context.env.POLAR_SANDBOX_PRODUCT_ID
      : context.env.POLAR_PRODUCT_ID;

    // Parse request body
    let body: CheckoutRequest = {};
    try {
      body = await context.request.json();
    } catch {
      // Empty body is OK
    }

    // Get origin for success/cancel URLs
    const origin = context.request.headers.get('origin') || 'https://gweh-3s2.pages.dev';
    const successUrl = `${origin}?checkout_success=true&checkout_id={CHECKOUT_ID}`;

    // Create Checkout Session via Polar API
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
        metadata: body.metadata || {},
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Polar API error:', errorData);
      return new Response(
        JSON.stringify({ error: 'Failed to create checkout session', details: errorData }),
        { status: response.status, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const checkoutSession = await response.json();

    return new Response(
      JSON.stringify({
        url: checkoutSession.url,
        id: checkoutSession.id,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': origin,
        },
      }
    );
  } catch (error) {
    console.error('Checkout error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};

// Handle CORS preflight
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
