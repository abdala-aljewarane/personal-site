// Cron (see vercel.json, 3x a day): publishes the next reel in the queue unless posting is paused.

import { publishNext, isPaused } from './_queue.mjs';

export async function GET(request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  if (await isPaused()) return Response.json({ skipped: 'paused' });
  try {
    return Response.json(await publishNext());
  } catch (err) {
    console.error('post-reels failed:', err.message);
    return Response.json({ error: err.message }, { status: 500 });
  }
}
