const LASTFM_USER = "abd4la";
const LASTFM_POLL_MS = 30000;
const NOW_PLAYING_URL = "/api/now-playing";

let current = null; // the track being shown, with startedAt/duration in ms
let tick = null;
const audio = new Audio(); // Apple's 30s preview; silent until a visitor taps the speaker
audio.volume = 0.5;

const SPEAKER_OFF =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="m22 9-6 6M16 9l6 6"/></svg>';
const SPEAKER_ON =
  '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 5 6 9H2v6h4l5 4z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14"/></svg>';

function setSound(on) {
  const button = document.querySelector(".np-sound");
  if (button) {
    button.innerHTML = on ? SPEAKER_ON : SPEAKER_OFF;
    button.setAttribute("aria-label", on ? "mute preview" : "play a 30 second preview");
    button.setAttribute("aria-pressed", String(on));
  }
  const volume = document.querySelector(".np-volume");
  if (volume) volume.hidden = !on;
}

function soundControls(track) {
  const wrap = el("div", "np-controls");
  const button = el("button", "np-sound");
  button.type = "button";
  button.title = "30 second preview";
  button.addEventListener("click", () => {
    if (audio.paused) {
      if (audio.src !== track.preview) audio.src = track.preview;
      audio.play().catch(() => setSound(false));
      setSound(true);
    } else {
      audio.pause();
      setSound(false);
    }
  });
  const volume = el("input", "np-volume");
  Object.assign(volume, { type: "range", min: "0", max: "1", step: "0.05", value: String(audio.volume) });
  volume.setAttribute("aria-label", "volume");
  volume.addEventListener("input", () => (audio.volume = Number(volume.value)));
  wrap.append(volume, button);
  return wrap;
}

audio.addEventListener("ended", () => setSound(false));

function fmt(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0");
}

function el(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
}

function renderTrack(box, track) {
  box.replaceChildren();
  box.classList.toggle("has-art", Boolean(track.art || track.preview));

  if (track.art) {
    const art = el("img", "np-art");
    art.src = track.art;
    art.alt = "";
    box.append(art);
  }

  const info = el("div", "np-info");
  info.append(el("span", "np-label", track.playing ? "now playing" : "last played"));
  const song = el("a", "np-title", track.name);
  song.href = track.url || "https://www.last.fm/user/" + LASTFM_USER;
  info.append(song);
  info.append(el("span", "np-artist", track.artist));

  if (track.playing && track.duration) {
    const progress = el("div", "np-progress");
    progress.append(el("span", "np-elapsed"), el("div", "np-bar"), el("span", "", fmt(track.duration)));
    progress.querySelector(".np-bar").append(el("div", "np-fill"));
    info.append(progress);
  }
  box.append(info);

  // A new song replaces the preview; keep playing only if it's the same clip.
  if (audio.src && audio.src !== track.preview) audio.pause();
  if (track.preview) {
    box.append(soundControls(track));
    setSound(!audio.paused);
  }
}

// Moves the bar locally every second; Last.fm is only polled every 30s.
function updateProgress() {
  const fill = document.querySelector(".np-fill");
  if (!fill || !current) return;
  const elapsed = Math.min(Date.now() - current.startedAt, current.duration);
  fill.style.width = (elapsed / current.duration) * 100 + "%";
  document.querySelector(".np-elapsed").textContent = fmt(elapsed);
  if (elapsed >= current.duration) {
    // Song over: give Last.fm a few seconds to notice the next one.
    clearInterval(tick);
    setTimeout(refreshLastfm, 5000);
  }
}

async function refreshLastfm() {
  const box = document.getElementById("now-playing");
  if (!box) {
    return;
  }
  try {
    const res = await fetch(NOW_PLAYING_URL);
    if (!res.ok) {
      throw new Error(String(res.status));
    }
    const track = await res.json();
    if (!track.name) {
      box.textContent = "";
      return;
    }
    const same = current && current.name === track.name && current.artist === track.artist;
    // Unknown start (page opened mid-song after a pause or skip): count from when we first saw it.
    track.startedAt = track.startedAt || (same ? current.startedAt : Date.now());
    if (!same || current.playing !== track.playing || current.duration !== track.duration) {
      renderTrack(box, track);
    }
    current = track;
    clearInterval(tick);
    if (track.playing && track.duration) {
      updateProgress();
      tick = setInterval(updateProgress, 1000);
    }
  } catch (err) {
    box.innerHTML =
      '<a href="https://www.last.fm/user/' + LASTFM_USER + '">last.fm</a>';
  }
}

refreshLastfm();
setInterval(refreshLastfm, LASTFM_POLL_MS);
