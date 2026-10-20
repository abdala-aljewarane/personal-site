// Backend for the /admin page: list posts, add/edit/delete keyword rules, and backfill old comments.
// Every request needs `Authorization: Bearer <ADMIN_PASSWORD>`.

import crypto from 'node:crypto';
import { getRules, saveRules, recentPosts, backfill } from './_lib.mjs';

const json = (data, status = 200) => Response.json(data, { status });

function authorized(request) {
  const given = Buffer.from(request.headers.get('authorization')?.replace(/^Bearer /, '') ?? '');
  const expected = Buffer.from(process.env.ADMIN_PASSWORD ?? '');
  return expected.length > 0 && given.length === expected.length && crypto.timingSafeEqual(given, expected);
}

export async function GET(request) {
  if (!authorized(request)) return json({ error: 'Wrong password' }, 401);
  const [rules, posts] = await Promise.all([getRules(), recentPosts()]);
  return json({ rules, posts });
}

export async function POST(request) {
  if (!authorized(request)) return json({ error: 'Wrong password' }, 401);
  const { action, rule, id } = await request.json();
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

  return json({ error: 'Unknown action' }, 400);
}
