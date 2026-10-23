// Public backend for /book.
//   GET                    → open slots
//   GET ?session_id=cs_... → the confirmed booking after Stripe redirects back
//   POST {slot,name,email,topic} → holds the slot and returns a Stripe Checkout URL

import {
  PRICE_CENTS, DURATION_MIN, openSlots, isBookable, holdSlot, releaseSlot, confirmBooking, stripe,
} from './_booking.mjs';

const json = (data, status = 200) => Response.json(data, { status });

export async function GET(request) {
  const sessionId = new URL(request.url).searchParams.get('session_id');
  if (!sessionId) return json({ slots: await openSlots(), duration: DURATION_MIN, price: PRICE_CENTS });

  if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) return json({ error: 'Bad session' }, 400);
  const booking = await confirmBooking(await stripe(`/checkout/sessions/${sessionId}`));
  if (!booking) return json({ error: "Payment hasn't gone through yet" }, 402);
  return json({ booking, duration: DURATION_MIN, meetingUrl: booking.meetUrl || process.env.MEETING_URL || '', invited: Boolean(booking.eventId) });
}

export async function POST(request) {
  const { slot, name, email, topic } = await request.json().catch(() => ({}));
  const clean = {
    name: String(name ?? '').trim().slice(0, 100),
    email: String(email ?? '').trim().slice(0, 200),
    topic: String(topic ?? '').trim().slice(0, 450), // Stripe metadata values max out at 500 chars
  };
  if (!clean.name) return json({ error: 'Name is required' }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) return json({ error: 'Enter a valid email' }, 400);
  if (!isBookable(slot)) return json({ error: 'That time is no longer available' }, 400);

  const holder = crypto.randomUUID();
  if (!(await holdSlot(slot, holder))) return json({ error: 'Someone just grabbed that time, pick another' }, 409);

  const origin = new URL(request.url).origin;
  const when = new Date(slot).toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles', dateStyle: 'medium', timeStyle: 'short',
  });
  try {
    const session = await stripe('/checkout/sessions', {
      method: 'POST',
      body: {
        mode: 'payment',
        customer_email: clean.email,
        line_items: {
          0: {
            quantity: 1,
            price_data: {
              currency: 'usd',
              unit_amount: PRICE_CENTS,
              product_data: { name: `${DURATION_MIN}-min 1:1 with abdala`, description: `${when} PT` },
            },
          },
        },
        metadata: { slot, ...clean },
        expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
        success_url: `${origin}/book?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/book`,
      },
    });
    return json({ url: session.url });
  } catch (err) {
    await releaseSlot(slot);
    return json({ error: err.message }, 502);
  }
}
