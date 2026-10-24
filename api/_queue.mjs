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

// Publishes the next `count` reels (or just the one with `id`). Their containers are created up front
// so Instagram processes them in parallel, then each is published in queue order once it's ready.
// One still processing after ~4 min stays "processing" and is finished first by the next run.
export async function publishBatch({ count = 1, id } = {}) {
  const locked = await redis('SET', 'ig:queue:lock', '1', 'NX', 'EX', 330);
  if (!locked) return { skipped: 'another post is in progress' };
  try {
    const queue = await getQueue();
    const items = id
      ? queue.filter((q) => q.id === id && q.status !== 'posted')
      : [...queue.filter((q) => q.status === 'processing'), ...queue.filter((q) => q.status === 'queued')].slice(0, count);
    if (!items.length) return { skipped: id ? 'not found or already posted' : 'queue is empty' };
    const me = await graph('/me', { params: { fields: 'user_id' } });
    const results = [];

    for (const item of items.filter((q) => !q.container)) {
      try {
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
      } catch (err) {
        // Failed, not retried forever: the next run moves on to the next reel.
        Object.assign(item, { status: 'failed', error: err.message });
        results.push({ failed: item.title, error: err.message });
      }
      await saveItem(item);
    }

    const pending = items.filter((q) => q.status === 'processing');
    const deadline = Date.now() + 240e3;
    while (pending.length) {
      for (const item of [...pending]) {
        const status = await graph(`/${item.container}`, { params: { fields: 'status_code,status' } });
        if (status.status_code === 'IN_PROGRESS') continue;
        pending.splice(pending.indexOf(item), 1);
        if (status.status_code === 'FINISHED') {
          results.push(await publishOne(me.user_id, item));
        } else {
          Object.assign(item, { status: 'failed', error: status.status ?? status.status_code, container: undefined });
          await saveItem(item);
          results.push({ failed: item.title, error: item.error });
        }
      }
      if (!pending.length) break;
      if (Date.now() > deadline) {
        results.push(...pending.map((q) => ({ processing: q.title })));
        break;
      }
      await sleep(10e3);
    }
    return { results };
  } finally {
    await redis('DEL', 'ig:queue:lock');
  }
}

async function publishOne(igUserId, item) {
  try {
    const published = await graph(`/${igUserId}/media_publish`, { method: 'POST', body: { creation_id: item.container } });
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
    Object.assign(item, { status: 'failed', error: err.message, container: undefined });
    await saveItem(item);
    return { failed: item.title, error: err.message };
  }
}
