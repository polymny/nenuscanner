import { useEffect, useMemo, useState } from 'react';
import { MEDIAMTX_STREAM_URL } from '@/lib/environment';

const STREAM_RESTARTED_EVENT = 'mediamtx-stream-restarted';
// The ffmpeg publisher starts about a second after MediaMTX answers HTTP again.
const PUBLISHER_STARTUP_MS = 2000;

/** WebRTC player page served by MediaMTX (path `cam`). */
export function buildMediamtxPlayerUrl({ autoplay = true, muted = true, controls = false } = {}): string {
  const url = new URL(MEDIAMTX_STREAM_URL);

  if (autoplay) url.searchParams.set('autoplay', 'true');
  if (muted) url.searchParams.set('muted', 'true');
  if (!controls) url.searchParams.set('controls', 'false');

  return url.toString();
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Waits for MediaMTX to be back after a restart, then reloads the players: MediaMTX's reader only retries once
 * connected, so a player that loaded while the stream was down stays broken.
 */
export async function reloadPlayersWhenStreamIsBack(timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      // Cross-origin: the response is opaque, but the request only resolves once the server answers.
      await fetch(MEDIAMTX_STREAM_URL, { mode: 'no-cors', cache: 'no-store' });
      break;
    } catch {
      await sleep(500);
    }
  }
  await sleep(PUBLISHER_STARTUP_MS);
  window.dispatchEvent(new Event(STREAM_RESTARTED_EVENT));
}

/** Player URL that changes after each stream restart, so that iframes using it reload. */
export function useMediamtxPlayerUrl(): string {
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    const onRestart = () => setReloads((count) => count + 1);
    window.addEventListener(STREAM_RESTARTED_EVENT, onRestart);
    return () => window.removeEventListener(STREAM_RESTARTED_EVENT, onRestart);
  }, []);

  return useMemo(() => {
    const url = new URL(buildMediamtxPlayerUrl());
    if (reloads > 0) url.searchParams.set('reload', String(reloads));
    return url.toString();
  }, [reloads]);
}
