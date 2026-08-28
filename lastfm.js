const LASTFM_USER = "abd4la";
const LASTFM_POLL_MS = 30000;
const LASTFM_TRACK_URL =
  "https://lastfm-last-played.biancarosa.com.br/" + LASTFM_USER + "/latest-song";

function trackList(payload) {
  const track = payload && payload.track;
  if (!track) {
    return [];
  }
  return Array.isArray(track) ? track : [track];
}

function renderTrack(el, track) {
  const name = track.name;
  const artist = track.artist && (track.artist["#text"] || track.artist.name);
  if (!name || !artist) {
    el.textContent = "";
    return;
  }
  const playing = track["@attr"] && track["@attr"].nowplaying === "true";
  const label = playing ? "now playing" : "last played";
  el.replaceChildren();
  el.append(label + ": ");
  const song = document.createElement("a");
  song.href = track.url || "https://www.last.fm/user/" + LASTFM_USER;
  song.textContent = name;
  el.append(song);
  el.append(" by " + artist);
}

async function refreshLastfm() {
  const el = document.getElementById("now-playing");
  if (!el) {
    return;
  }
  try {
    const res = await fetch(LASTFM_TRACK_URL);
    if (!res.ok) {
      throw new Error(String(res.status));
    }
    const data = await res.json();
    const tracks = trackList(data);
    if (tracks.length === 0) {
      el.textContent = "";
      return;
    }
    renderTrack(el, tracks[0]);
  } catch (err) {
    el.innerHTML =
      '<a href="https://www.last.fm/user/' + LASTFM_USER + '">last.fm</a>';
  }
}

refreshLastfm();
setInterval(refreshLastfm, LASTFM_POLL_MS);
