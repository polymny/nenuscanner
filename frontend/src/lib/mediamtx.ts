import { MEDIAMTX_STREAM_URL } from '@/lib/environment';

/** WebRTC player page served by MediaMTX (path `cam`). */
export function buildMediamtxPlayerUrl({
  autoplay = true,
  muted = true,
  controls = false
} = {}): string {
  const url = new URL(MEDIAMTX_STREAM_URL);

  if (autoplay) url.searchParams.set('autoplay', 'true');
  if (muted) url.searchParams.set('muted', 'true');
  if (!controls) url.searchParams.set('controls', 'false');

  return url.toString();
}

