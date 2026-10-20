// Shared helpers for the Instagram bot. Files starting with _ aren't exposed as routes.

const GRAPH = 'https://graph.instagram.com/v23.0';
const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

// --- Redis (Upstash REST) ---

export async function redis(...command) {
  const url = process.env.KV_REST_API_URL ?? process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN ?? process.env.UPSTASH_REDIS_REST_TOKEN;
  const res = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify(command),
  });
  const body = await res.json();
  if (body.error) throw new Error(`redis: ${body.error}`);
  return body.result;
}

export async function getRules() {
  return JSON.parse((await redis('GET', 'ig:rules')) ?? '[]');
}

export async function saveRules(rules) {
  await redis('SET', 'ig:rules', JSON.stringify(rules));
}

// The token is kept in Redis so the cron can refresh it; the env var seeds it the first time.
export async function getToken() {
  return (await redis('GET', 'ig:token')) ?? process.env.IG_ACCESS_TOKEN;
}

// --- Instagram Graph API ---

export async function graph(path, { method = 'GET', body, params = {} } = {}) {
  const url = new URL(GRAPH + path);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method,
    headers: { Authorization: `Bearer ${await getToken()}`, 'Content-Type': 'application/json' },
    body: body && JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || data.error) throw new Error(data.error?.message ?? `HTTP ${res.status}`);
  return data;
}

async function graphAll(path, params) {
  const items = [];
  let page = await graph(path, { params: { limit: '50', ...params } });
  while (true) {
    items.push(...page.data);
    if (!page.paging?.next) return items;
    page = await (await fetch(page.paging.next, { headers: { Authorization: `Bearer ${await getToken()}` } })).json();
  }
}

export async function recentPosts() {
  const data = await graph('/me/media', {
    params: { fields: 'id,permalink,caption,thumbnail_url,media_url,media_type,timestamp,comments_count', limit: '30' },
  });
  return data.data;
}

// --- Rule matching + responding ---

export function matchRule(rules, comment) {
  const words = (comment.text ?? '').toLowerCase().match(/[a-z0-9]+/g) ?? [];
  return rules.find(
    (r) => r.enabled !== false && r.media === comment.media?.id && words.includes(r.keyword.toLowerCase()),
  );
}

// Sends the DM + public reply once per comment (dedupe survives webhook retries and backfills).
export async function respond(igUserId, comment, rule) {
  const fresh = await redis('SET', `ig:sent:${comment.id}`, '1', 'NX', 'EX', 60 * 60 * 24 * 8);
  if (!fresh) return { skipped: 'already sent' };

  try {
    await graph(`/${igUserId}/messages`, {
      method: 'POST',
      body: { recipient: { comment_id: comment.id }, message: { text: rule.dm } },
    });
  } catch (err) {
    await redis('DEL', `ig:sent:${comment.id}`);
    throw err;
  }

  const replies = (rule.publicReplies ?? []).filter(Boolean);
  if (replies.length) {
    const message = replies[Math.floor(Math.random() * replies.length)];
    await graph(`/${comment.id}/replies`, { method: 'POST', params: { message } }).catch((err) =>
      console.error(`public reply to ${comment.id} failed:`, err.message),
    );
  }
  return { sent: true };
}

// Answers existing keyword comments on a post that nobody has replied to yet and that are
// still inside Instagram's 7-day private-reply window.
export async function backfill(rule) {
  const me = await graph('/me', { params: { fields: 'user_id' } });
  const comments = await graphAll(`/${rule.media}/comments`, { fields: 'id,text,timestamp,from,replies{id}' });
  const results = [];
  const todo = [];
  for (const c of comments) {
    const user = c.from?.username ?? c.from?.id;
    if (c.from?.id === me.user_id) continue;
    if (!matchRule([rule], { ...c, media: { id: rule.media } })) continue;
    if (c.replies?.data?.length) continue;
    if (Date.now() - new Date(c.timestamp) > SEVEN_DAYS) {
      results.push({ user, status: 'too old (over 7 days)' });
      continue;
    }
    todo.push({ ...c, user });
  }

  // A few at a time: one-by-one was slow enough on big posts to hit the function timeout.
  for (let i = 0; i < todo.length; i += 5) {
    await Promise.all(
      todo.slice(i, i + 5).map(async (c) => {
        try {
          const r = await respond(me.user_id, { ...c, media: { id: rule.media } }, rule);
          results.push({ user: c.user, status: r.skipped ?? 'sent' });
        } catch (err) {
          results.push({ user: c.user, status: `failed: ${err.message}` });
        }
      }),
    );
  }
  return results;
}
