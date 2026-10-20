// Weekly cron (see vercel.json): long-lived Instagram tokens last 60 days, refreshing resets that.

import { redis, getToken } from './_lib.mjs';

export async function GET(request) {
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  const url = new URL('https://graph.instagram.com/refresh_access_token');
  url.searchParams.set('grant_type', 'ig_refresh_token');
  url.searchParams.set('access_token', await getToken());
  const data = await (await fetch(url)).json();
  if (!data.access_token) {
    console.error('token refresh failed:', data.error?.message);
    return Response.json({ ok: false, error: data.error?.message }, { status: 500 });
  }
  await redis('SET', 'ig:token', data.access_token);
  await redis('SET', 'ig:token_refreshed_at', new Date().toISOString());
  return Response.json({ ok: true, expiresInDays: Math.round(data.expires_in / 86400) });
}
