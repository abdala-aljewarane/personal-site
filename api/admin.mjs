// Backend for the /admin page: list posts, add/edit/delete keyword rules, backfill old comments,
// view/cancel paid 1:1 bookings, and manage the reels posting queue.
// Every request needs `Authorization: Bearer <ADMIN_PASSWORD>`.

import crypto from 'node:crypto';
import { getRules, saveRules, recentPosts, backfill } from './_lib.mjs';
import { listBookings, cancelBooking } from './_booking.mjs';
import { getQueue, saveQueue, isPaused, setPaused, publishBatch } from './_queue.mjs';

const json = (data, status = 200) => Response.json(data, { status });

function authorized(request) {
  const given = Buffer.from(request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '');
  const expected = Buffer.from(process.env.ADMIN_PASSWORD ?? '');
  return expected.length > 0 && given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export async function GET(request) {
  if (!authorized(request)) return json({ error: 'Wrong password' }, 401);
  const [rules, posts, bookings, queue, paused] = await Promise.all([
    getRules(), recentPosts(), listBookings(), getQueue(), isPaused(),
  ]);
  return json({ rules, posts, bookings, queue, paused });
}

export async function POST(request) {
  if (!authorized(request)) return json({ error: 'Wrong password' }, 401);
  const { action, rule, id, caption, paused, dir, count } = await request.json();

  if (action === 'queuePause') {
    await setPaused(Boolean(paused));
    return json({ paused: Boolean(paused) });
  }
  if (action === 'queuePostNow') {
    return json(id ? await publishBatch({ id }) : await publishBatch({ count: Math.min(Number(count) || 1, 5) }));
  }
  if (['queueCaption', 'queueRemove', 'queueMove', 'queueRetry'].includes(action)) {
    const queue = await getQueue();
    const i = queue.findIndex((q) => q.id === id);
    if (i < 0) return json({ error: 'Not in the queue' }, 404);
    if (action === 'queueCaption') queue[i].caption = String(caption ?? '');
    if (action === 'queueRemove') queue.splice(i, 1);
    if (action === 'queueRetry') Object.assign(queue[i], { status: 'queued', error: undefined, container: undefined });
    if (action === 'queueMove') {
      const j = i + (dir === 'up' ? -1 : 1);
      if (j >= 0 && j < queue.length) [queue[i], queue[j]] = [queue[j], queue[i]];
    }
    await saveQueue(queue);
    return json({ queue });
  }

  const rules = await getRules();

  if (action === 'save') {
    const keyword = String(rule.keyword ?? '').trim().toLowerCase();
    if (!/^[a-z0-9]+$/.test(keyword)) return json({ error: 'Keyword must be a single word (letters/numbers)' }, 400);
    if (!rule.media) return json({ error: 'Pick a post' }, 400);
    if (!String(rule.dm ?? '').trim()) return json({ error: 'DM message is required' }, 400);
    const clean = {
      id: rule.id || crypto.randomUUID(),
      media: String(rule.media),
      permalink: rule.permalink ?? '',
      keyword,
      dm: String(rule.dm).trim(),
      publicReplies: (rule.publicReplies ?? []).map((s) => String(s).trim()).filter(Boolean),
      enabled: rule.enabled !== false,
    };
    const clash = rules.find((r) => r.id !== clean.id && r.media === clean.media && r.keyword === clean.keyword);
    if (clash) return json({ error: `"${keyword}" already has a rule on that post` }, 400);
    const i = rules.findIndex((r) => r.id === clean.id);
    if (i >= 0) rules[i] = clean;
    else rules.push(clean);
    await saveRules(rules);
    return json({ rule: clean });
  }

  if (action === 'delete') {
    await saveRules(rules.filter((r) => r.id !== id));
    return json({ ok: true });
  }

  if (action === 'backfill') {
    const target = rules.find((r) => r.id === id);
    if (!target) return json({ error: 'Rule not found' }, 404);
    return json({ results: await backfill(target) });
  }

  if (action === 'cancelBooking') {
    await cancelBooking(id);
    return json({ ok: true });
  }

  return json({ error: 'Unknown action' }, 400);
}
