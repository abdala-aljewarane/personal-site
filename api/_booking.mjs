// Shared helpers for paid 1:1 bookings: availability, Redis slot holds, and Stripe Checkout.

import crypto from 'node:crypto';
import { redis } from './_lib.mjs';

// --- Availability (edit these) ---

// Call length (minutes) → price (cents).
export const PRICES = { 30: 3000, 60: 5000 };
const STEP_MIN = 30; // slot grid; longer calls take several consecutive steps
const TZ = 'America/Los_Angeles';
const DAYS_AHEAD = 14;
const MIN_NOTICE_HOURS = 12;
// Weekday (0 = Sunday) → [start, end) windows in local 24h time.
const HOURS = {
  0: [['10:00', '16:00']],
  1: [['18:00', '21:00']],
  2: [['18:00', '21:00']],
  3: [['18:00', '21:00']],
  4: [['18:00', '21:00']],
  5: [['18:00', '21:00']],
  6: [['10:00', '16:00']],
};

const HOLD_SECONDS = 35 * 60; // Stripe Checkout sessions expire after 30 min; the hold outlives them.
const slotKey = (iso) => `book:slot:${iso}`;

// Offset (ms) of TZ from UTC at the given instant.
function tzOffset(ms) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-US', {
      timeZone: TZ, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
    }).formatToParts(ms).map((p) => [p.type, p.value]),
  );
  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second) - ms;
}

// A wall-clock time in TZ → UTC ms (handles DST).
function zoned(y, m, d, hh, mm) {
  const guess = Date.UTC(y, m, d, hh, mm);
  const first = guess - tzOffset(guess);
  return guess - tzOffset(first);
}

function candidateSlots(now = Date.now()) {
  const slots = [];
  const earliest = now + MIN_NOTICE_HOURS * 3600e3;
  for (let i = 0; i <= DAYS_AHEAD; i++) {
    const day = new Date(now + i * 86400e3 + tzOffset(now));
    const [y, m, d] = [day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()];
    for (const [from, to] of HOURS[day.getUTCDay()] ?? []) {
      const [fh, fm] = from.split(':').map(Number);
      const [th, tm] = to.split(':').map(Number);
      const end = zoned(y, m, d, th, tm);
      for (let t = zoned(y, m, d, fh, fm); t + STEP_MIN * 60e3 <= end; t += STEP_MIN * 60e3) {
        if (t >= earliest) slots.push(new Date(t).toISOString());
      }
    }
  }
  return slots;
}

// The grid steps a call starting at `iso` would occupy.
function steps(iso, minutes) {
  return Array.from({ length: minutes / STEP_MIN }, (_, k) => new Date(Date.parse(iso) + k * STEP_MIN * 60e3).toISOString());
}

// Start times that have every step of the call open (and inside one availability window).
function startsFor(open, minutes) {
  return [...open].filter((iso) => steps(iso, minutes).every((s) => open.has(s)));
}

// → { 30: [iso, ...], 60: [iso, ...] }
export async function openSlots() {
  const slots = candidateSlots();
  if (!slots.length) return Object.fromEntries(Object.keys(PRICES).map((m) => [m, []]));
  const taken = await redis('MGET', ...slots.map(slotKey));
  const open = new Set(slots.filter((_, i) => taken[i] === null));
  return Object.fromEntries(Object.keys(PRICES).map((m) => [m, startsFor(open, Number(m))]));
}

export const isBookable = (iso, minutes) =>
  Boolean(PRICES[minutes]) && startsFor(new Set(candidateSlots()), minutes).includes(iso);

// Reserves a call's steps while the visitor is on the Stripe page. Returns false if any is taken.
export async function holdSlot(iso, minutes, holder) {
  const held = [];
  for (const s of steps(iso, minutes)) {
    if ((await redis('SET', slotKey(s), `hold:${holder}`, 'NX', 'EX', HOLD_SECONDS)) !== 'OK') {
      if (held.length) await redis('DEL', ...held.map(slotKey));
      return false;
    }
    held.push(s);
  }
  return true;
}

export const releaseSlot = (iso, minutes) => redis('DEL', ...steps(iso, minutes).map(slotKey));

// --- Bookings ---

// Idempotent: called from both the success page and the Stripe webhook.
export async function confirmBooking(session) {
  if (session.payment_status !== 'paid') return null;
  const existing = await redis('HGET', 'book:all', session.id);
  if (existing) return JSON.parse(existing);
  const booking = {
    id: session.id,
    slot: session.metadata.slot,
    duration: Number(session.metadata.duration) || 30,
    name: session.metadata.name,
    email: session.customer_details?.email ?? session.customer_email,
    topic: session.metadata.topic,
    paidAt: new Date().toISOString(),
  };
  for (const s of steps(booking.slot, booking.duration)) await redis('SET', slotKey(s), `paid:${session.id}`);
  try {
    Object.assign(booking, await createCalendarEvent(booking));
  } catch (err) {
    console.error(`calendar event for ${session.id} failed:`, err.message);
  }
  await redis('HSET', 'book:all', session.id, JSON.stringify(booking));
  return booking;
}

export async function listBookings() {
  const all = (await redis('HVALS', 'book:all')).map((b) => JSON.parse(b));
  return all.sort((a, b) => a.slot.localeCompare(b.slot));
}

export async function cancelBooking(id) {
  const raw = await redis('HGET', 'book:all', id);
  if (!raw) return;
  const booking = JSON.parse(raw);
  await releaseSlot(booking.slot, booking.duration ?? 30);
  await redis('HDEL', 'book:all', id);
  if (booking.eventId) await deleteCalendarEvent(booking.eventId).catch((err) => console.error(err.message));
}

// --- Google Calendar (OAuth refresh token for the site owner; see scripts/google-auth.mjs) ---

const CALENDAR = `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(process.env.GOOGLE_CALENDAR_ID ?? 'primary')}/events`;

async function googleToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`google auth: ${data.error_description ?? data.error}`);
  return data.access_token;
}

async function gcal(path, { method = 'GET', body } = {}) {
  const res = await fetch(CALENDAR + path, {
    method,
    headers: { Authorization: `Bearer ${await googleToken()}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  if (res.status === 204) return null;
  const data = await res.json();
  if (!res.ok) throw Object.assign(new Error(`google calendar: ${data.error?.message}`), { status: res.status });
  return data;
}

// Puts the call on my calendar, invites the guest (Google emails them), and adds a Meet link.
// The event id is derived from the Stripe session so a duplicate confirm can't double-book.
async function createCalendarEvent(booking) {
  if (!process.env.GOOGLE_REFRESH_TOKEN) return {};
  const eventId = crypto.createHash('sha256').update(booking.id).digest('hex').slice(0, 32);
  const start = new Date(booking.slot);
  let event;
  try {
    event = await gcal('?conferenceDataVersion=1&sendUpdates=all', {
      method: 'POST',
      body: {
        id: eventId,
        summary: `1:1 with ${booking.name}`,
        description: booking.topic ? `topic: ${booking.topic}` : '',
        start: { dateTime: start.toISOString() },
        end: { dateTime: new Date(start.getTime() + booking.duration * 60e3).toISOString() },
        attendees: [{ email: booking.email, displayName: booking.name }],
        conferenceData: { createRequest: { requestId: eventId, conferenceSolutionKey: { type: 'hangoutsMeet' } } },
      },
    });
  } catch (err) {
    if (err.status !== 409) throw err;
    event = await gcal(`/${eventId}`);
  }
  return { eventId, meetUrl: event.hangoutLink ?? '' };
}

const deleteCalendarEvent = (eventId) => gcal(`/${eventId}?sendUpdates=all`, { method: 'DELETE' });

// --- Stripe (REST, no SDK) ---

function formEncode(obj, prefix = '', out = new URLSearchParams()) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}[${k}]` : k;
    if (v !== null && typeof v === 'object') formEncode(v, key, out);
    else if (v !== undefined) out.append(key, String(v));
  }
  return out;
}

export async function stripe(path, { method = 'GET', body } = {}) {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.STRIPE_SECRET_KEY}` },
    body: body && formEncode(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message ?? `Stripe HTTP ${res.status}`);
  return data;
}

export function verifyStripeSignature(rawBody, header) {
  const parts = Object.fromEntries((header ?? '').split(',').map((p) => p.split('=')));
  const secret = process.env.STRIPE_WEBHOOK_SECRET ?? '';
  if (!parts.t || !parts.v1 || !secret) return false;
  if (Math.abs(Date.now() / 1000 - Number(parts.t)) > 300) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${parts.t}.${rawBody}`).digest('hex');
  return expected.length === parts.v1.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1));
}
