// ManyChat-style comment auto-responder for Instagram.
// Someone comments a keyword -> they get a DM (private reply) + a public comment reply.
//
// Env vars (set in Vercel):
//   IG_VERIFY_TOKEN  - any string you choose; paste the same one in the Meta webhook setup
//   IG_APP_SECRET    - Instagram app secret (used to verify webhook signatures)
//   IG_ACCESS_TOKEN  - long-lived Instagram user access token (instagram_business_manage_messages + _comments)

import crypto from 'node:crypto';

const GRAPH = 'https://graph.instagram.com/v23.0';

// Add more keywords here. `media` optionally limits a trigger to one post's media id.
const TRIGGERS = [
  {
    // instagram.com/p/Ded3Mq5m2gV
    keyword: 'guide',
    media: '18132626320832043',
    dm: () => `Hey! Here's the internship guide 👇\nhttps://drive.google.com/file/d/1YRAglykKmKTsveQ3coBQ_47IwmS2_bNu/view?usp=sharing`,
    publicReply: ['Sent you a DM! 📩', 'Check your DMs 🙌', 'Just sent it, check your inbox!'],
  },
];

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
  const jobs = [];
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'comments') continue;
      const comment = change.value;
      // Ignore our own replies so the bot never answers itself.
      if (comment.from?.id === entry.id) continue;
      const trigger = matchTrigger(comment);
      if (trigger) jobs.push(respond(entry.id, comment, trigger));
    }
  }
  await Promise.allSettled(jobs);
  // Always 200 so Meta doesn't retry and double-DM people.
  return new Response('ok');
}

function validSignature(raw, header) {
  if (!header || !process.env.IG_APP_SECRET) return false;
  const expected = 'sha256=' + crypto.createHmac('sha256', process.env.IG_APP_SECRET).update(raw).digest('hex');
  return header.length === expected.length && crypto.timingSafeEqual(Buffer.from(header), Buffer.from(expected));
}

function matchTrigger(comment) {
  const words = (comment.text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return TRIGGERS.find((t) => words.includes(t.keyword) && (!t.media || t.media === comment.media?.id));
}

async function respond(igUserId, comment, trigger) {
  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const results = await Promise.allSettled([
    graph(`/${igUserId}/messages`, { recipient: { comment_id: comment.id }, message: { text: trigger.dm() } }),
    graph(`/${comment.id}/replies`, { message: pick(trigger.publicReply) }),
  ]);
  for (const r of results) {
    if (r.status === 'rejected') console.error(`Reply to @${comment.from?.username} failed:`, r.reason);
  }
}

async function graph(path, payload) {
  const res = await fetch(GRAPH + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.IG_ACCESS_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json();
}
