// Stripe webhook: records the booking even if the visitor closes the tab before the redirect.
// Subscribe it to `checkout.session.completed` in the Stripe dashboard.

import { confirmBooking, verifyStripeSignature } from './_booking.mjs';

export async function POST(request) {
  const raw = await request.text();
  if (!verifyStripeSignature(raw, request.headers.get('stripe-signature'))) {
    return new Response('Bad signature', { status: 400 });
  }
  const event = JSON.parse(raw);
  if (event.type === 'checkout.session.completed') await confirmBooking(event.data.object);
  return new Response('ok');
}
