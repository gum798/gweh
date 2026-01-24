// Polar Webhook Handler for Cloudflare Pages Functions

interface Env {
  POLAR_WEBHOOK_SECRET: string;
}

interface PolarWebhookEvent {
  type: string;
  data: {
    id: string;
    customer_email?: string;
    product_id?: string;
    amount?: number;
    currency?: string;
    metadata?: Record<string, string>;
  };
}

export const onRequestPost: PagesFunction<Env> = async (context) => {
  try {
    const webhookSecret = context.env.POLAR_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('POLAR_WEBHOOK_SECRET not configured');
      return new Response('Webhook secret not configured', { status: 500 });
    }

    // Get the webhook signature from headers
    const signature = context.request.headers.get('webhook-signature') ||
                     context.request.headers.get('x-polar-signature');

    if (!signature) {
      return new Response('Missing webhook signature', { status: 401 });
    }

    // Parse the webhook payload
    const payload = await context.request.text();

    // TODO: Verify webhook signature
    // For production, implement proper HMAC signature verification
    // const isValid = verifySignature(payload, signature, webhookSecret);
    // if (!isValid) {
    //   return new Response('Invalid signature', { status: 401 });
    // }

    const event: PolarWebhookEvent = JSON.parse(payload);

    console.log('Received Polar webhook:', event.type);

    // Handle different event types
    switch (event.type) {
      case 'order.paid':
        // Order has been successfully paid
        console.log('Order paid:', {
          orderId: event.data.id,
          email: event.data.customer_email,
          productId: event.data.product_id,
          amount: event.data.amount,
        });

        // Here you could:
        // - Store the purchase in a database (D1, KV, etc.)
        // - Send a confirmation email
        // - Grant access to premium features

        break;

      case 'order.refunded':
        // Order has been refunded
        console.log('Order refunded:', event.data.id);

        // Here you could:
        // - Revoke premium access
        // - Update database records

        break;

      case 'subscription.created':
        console.log('Subscription created:', event.data.id);
        break;

      case 'subscription.canceled':
        console.log('Subscription canceled:', event.data.id);
        break;

      default:
        console.log('Unhandled webhook event:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
