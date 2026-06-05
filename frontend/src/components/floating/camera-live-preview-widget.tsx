import { Video, X } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

import DraggableWrapper from '@/components/floating/draggable-wrapper';
import { Button } from '@/components/ui/button';
import { MEDIAMTX_STREAM_URL } from '@/lib/environment';

const STORAGE_KEY = 'nenu-camera-live-preview';
const CLOSED_STORAGE_KEY = 'nenu-camera-live-preview-closed';

/** WebRTC player page served by MediaMTX (path `cam`). */
export function buildMediamtxPlayerUrl(baseUrl: string = MEDIAMTX_STREAM_URL): string {
  const url = new URL(baseUrl);
  url.searchParams.set('autoplay', 'true');
  url.searchParams.set('muted', 'true');
  url.searchParams.set('controls', 'false');
  return url.toString();
}

function readClosed(): boolean {
  try {
    return localStorage.getItem(CLOSED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeClosed(closed: boolean) {
  try {
    localStorage.setItem(CLOSED_STORAGE_KEY, closed ? '1' : '0');
  } catch {
    /* ignore */
  }
}

const CameraLivePreviewWidget = () => {
  const [isClosed, setIsClosed] = useState(readClosed);
  const playerUrl = useMemo(() => buildMediamtxPlayerUrl(), []);

  const handleClose = useCallback(() => {
    setIsClosed(true);
    writeClosed(true);
  }, []);

  const handleReopen = useCallback(() => {
    setIsClosed(false);
    writeClosed(false);
  }, []);

  if (isClosed) {
    return (
      <Button
        aria-label="Afficher le flux caméra live"
        className="fixed right-4 bottom-6 z-60 shadow-md"
        onClick={handleReopen}
        type="button"
        variant="outline"
      >
        <Video className="size-4" />
        Live caméra
      </Button>
    );
  }

  return (
    <DraggableWrapper
      className="bg-background w-full"
      defaultAnchor="bottom-right"
      headerActions={
        <Button
          aria-label="Fermer le flux live"
          onClick={handleClose}
          size="icon"
          type="button"
          variant="ghost"
          className="mr-0 pr-0"
        >
          <X className="size-4" />
        </Button>
      }
      height="280px"
      storageKey={STORAGE_KEY}
      title="Live caméra HDMI"
      width="w-full"
      maximizeButton={null}
      minimizeButton={null}
    >
      <iframe
        allow="autoplay; fullscreen"
        className="aspect-video w-full border-0"
        src={playerUrl}
        title="Flux live MediaMTX"
      />
    </DraggableWrapper>
  );
};

export default CameraLivePreviewWidget;
