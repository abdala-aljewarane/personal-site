// Cron (see vercel.json, every 12 hours): publishes the next batch of reels unless posting is paused.

import { publishBatch, isPaused } from './_queue.mjs';

const BATCH_SIZE = 3;

export async function GET(request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (await isPaused()) return Response.json({ skipped: 'paused' });
  try {
    return Response.json(await publishBatch({ count: BATCH_SIZE }));
  } catch (err) {
    console.error('post-reels failed:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
