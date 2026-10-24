// Reels posting queue: videos (public Blob URLs) waiting to be published, one per cron run.
// Each published reel also gets a comment-bot rule (keyword -> DM) so the caption's CTA works.

import crypto from 'node:crypto';
import { redis, graph, getRules, saveRules } from './_lib.mjs';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function getQueue() {
  return JSON.parse((await redis('GET', 'ig:queue')) ?? '[]');
}

export async function saveQueue(queue) {
  await redis('SET', 'ig:queue', JSON.stringify(queue));
}

export async function isPaused() {
  return (await redis('GET', 'ig:queue:paused')) === '1';
}

export async function setPaused(paused) {
  await redis('SET', 'ig:queue:paused', paused ? '1' : '0');
}

// Re-read before writing so an admin edit made while a reel was processing isn't lost.
async function saveItem(item) {
  const queue = await getQueue();
  const i = queue.findIndex((q) => q.id === item.id);
  if (i >= 0) queue[i] = item;
  await saveQueue(queue);
}

// Publishes the next reel (or the one with `id`). A container still processing after ~4 min is
// left as "processing" and finished by the next run. One run at a time.
export async function publishNext({ id } = {}) {
  const locked = await redis('SET', 'ig:queue:lock', '1', 'NX', 'EX', 330);
  if (!locked) return { skipped: 'another post is in progress' };
  let item;
  try {
    const queue = await getQueue();
    item = id
      ? queue.find((q) => q.id === id && q.status !== 'posted')
      : queue.find((q) => q.status === 'processing') ?? queue.find((q) => q.status === 'queued');
    if (!item) return { skipped: id ? 'not found or already posted' : 'queue is empty' };
    const me = await graph('/me', { params: { fields: 'user_id' } });

    if (!item.container) {
      const container = await graph(`/${me.user_id}/media`, {
        method: 'POST',
        body: {
          media_type: 'REELS',
          video_url: item.file,
          caption: item.caption,
          share_to_feed: true,
          ...(item.trial ? { trial_params: { graduation_strategy: 'MANUAL' } } : {}),
        },
      });
      Object.assign(item, { container: container.id, status: 'processing', error: undefined });
      await saveItem(item);
    }

    const deadline = Date.now() + 240e3;
    let status;
    while (true) {
      status = await graph(`/${item.container}`, { params: { fields: 'status_code,status' } });
      if (status.status_code !== 'IN_PROGRESS') break;
      if (Date.now() > deadline) return { processing: item.title };
      await sleep(15e3);
    }
    if (status.status_code === 'ERROR' || status.status_code === 'EXPIRED') {
      Object.assign(item, { status: 'failed', error: status.status ?? status.status_code, container: undefined });
      await saveItem(item);
      return { failed: item.title, error: item.error };
    }

    const published = await graph(`/${me.user_id}/media_publish`, { method: 'POST', body: { creation_id: item.container } });
    const media = await graph(`/${published.id}`, { params: { fields: 'permalink' } });
    Object.assign(item, { status: 'posted', mediaId: published.id, permalink: media.permalink, postedAt: new Date().toISOString() });
    await saveItem(item);

    if (item.keyword && item.dm) {
      const rules = await getRules();
      rules.push({
        id: crypto.randomUUID(),
        media: published.id,
        permalink: media.permalink,
        keyword: item.keyword,
        dm: item.dm,
        publicReplies: item.publicReplies ?? [],
        enabled: true,
      });
      await saveRules(rules);
    }
    return { posted: item.title, permalink: media.permalink };
  } catch (err) {
    // Mark it failed so the next run moves on instead of retrying the same reel forever.
    if (item) {
      Object.assign(item, { status: 'failed', error: err.message, container: undefined });
      await saveItem(item);
    }
    throw err;
  } finally {
    await redis('DEL', 'ig:queue:lock');
  }
}
