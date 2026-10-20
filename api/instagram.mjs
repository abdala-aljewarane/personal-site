// ManyChat-style comment auto-responder for Instagram.
// Someone comments a keyword on a post -> they get a DM (private reply) + a public comment reply.
// Rules (post + keyword + messages) are managed at /admin and stored in Redis.
//
// Env vars (set in Vercel):
//   IG_VERIFY_TOKEN  - any string you choose; paste the same one in the Meta webhook setup
//   IG_APP_SECRET    - Instagram app secret (used to verify webhook signatures)
//   IG_ACCESS_TOKEN  - initial long-lived token; after that the refresh cron keeps it in Redis
//   KV_REST_API_URL / KV_REST_API_TOKEN - Upstash Redis (added by the Vercel integration)

import crypto from 'node:crypto';
import { getRules, matchRule, respond } from './_lib.mjs';

export function GET(request) {
  const params = new URL(request.url).searchParams;
  if (params.get('hub.mode') === 'subscribe' && params.get('hub.verify_token') === process.env.IG_VERIFY_TOKEN) {
    return new Response(params.get('hub.challenge'));
  }
  return new Response('Forbidden', { status: 403 });
}

export async function POST(request) {
  const raw = await request.text();
  if (!validSignature(raw, request.headers.get('x-hub-signature-256'))) {
    return new Response('Bad signature', { status: 401 });
  }

  const body = JSON.parse(raw);
  const rules = await getRules();
  const jobs = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'comments') continue;
      const comment = change.value;
      // Ignore our own replies so the bot never answers itself.
      if (comment.from?.id === entry.id) continue;
      const rule = matchRule(rules, comment);
      if (rule) {
        jobs.push(
          respond(entry.id, comment, rule).catch((err) =>
            console.error(`reply to @${comment.from?.username} failed:`, err.message),
          ),
        );
      }
    }
  }
  await Promise.all(jobs);
  // Always 200 so Meta doesn't retry.
  return new Response('ok');
}

function validSignature(raw, header) {
  if (!header || !process.env.IG_APP_SECRET) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', process.env.IG_APP_SECRET).update(raw).digest('hex');
  return header.length === expected.length && crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}
