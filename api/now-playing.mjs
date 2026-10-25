// Public backend for the "now playing" card on the home page.
//   GET → { name, artist, url, art, playing, startedAt, duration, preview }  (times in ms; null when unknown)
// preview is Apple's 30-second clip of the song, when Apple has it.
// Last.fm doesn't know the playback position, so startedAt is estimated: scrobble timestamps mark when a
// track started, so the current one started when the previous one ended (its start + its length).

const USER = 'abd4la';
const API = 'https://ws.audioscrobbler.com/2.0/';
const key = () => process.env.LASTFM_API_KEY ?? process.env.VITE_LASTFM_API_KEY;

async function lastfm(params) {
  const url = new URL(API);
  for (const [k, v] of Object.entries({ ...params, api_key: key(), format: 'json' })) url.searchParams.set(k, v);
  const data = await (await fetch(url)).json();
  if (data.error) throw new Error(data.message);
  return data;
}

// Apple's iTunes search (free, no key): song length and a 30-second preview clip. Only trusted when the
// title matches, so a wrong top result never plays.
const simple = (s) => s.toLowerCase().replace(/\(.*?\)|\[.*?\]/g, '').replace(/[^a-z0-9]/g, '');
async function itunes(artist, name) {
  try {
    const url = `https://itunes.apple.com/search?entity=song&limit=5&term=${encodeURIComponent(`${artist} ${name}`)}`;
    const results = (await (await fetch(url)).json()).results ?? [];
    return results.find((r) => simple(r.trackName) === simple(name)) ?? null;
  } catch {
    return null;
  }
}

// Track length in ms: Last.fm first, then iTunes.
async function duration(artist, name, apple) {
  try {
    const ms = Number((await lastfm({ method: 'track.getInfo', artist, track: name })).track?.duration);
    if (ms > 0) return ms;
  } catch {}
  const ms = Number((apple ?? (await itunes(artist, name)))?.trackTimeMillis);
  return ms > 0 ? ms : null;
}

export async function GET() {
  const tracks = [].concat((await lastfm({ method: 'user.getrecenttracks', user: USER, limit: '2' })).recenttracks.track ?? []);
  const [current, previous] = tracks;
  if (!current) return Response.json({});

  const artist = current.artist['#text'];
  const playing = current['@attr']?.nowplaying === 'true';
  const art = current.image?.find((i) => i.size === 'extralarge')?.['#text'] || null;
  const apple = await itunes(artist, current.name);
  const body = {
    name: current.name, artist, url: current.url, art, playing, startedAt: null, duration: null,
    preview: apple?.previewUrl ?? null,
  };

  if (playing) {
    const [length, prevLength] = await Promise.all([
      duration(artist, current.name, apple),
      previous?.date ? duration(previous.artist['#text'], previous.name) : null,
    ]);
    body.duration = length;
    const start = previous?.date && prevLength ? Number(previous.date.uts) * 1000 + prevLength : null;
    // Only trust the estimate if it lands inside this track; after a pause or skip it won't.
    if (start && length && start <= Date.now() && Date.now() - start < length) body.startedAt = start;
  }

  return Response.json(body, { headers: { 'Cache-Control': 's-maxage=15, stale-while-revalidate=30' } });
}
