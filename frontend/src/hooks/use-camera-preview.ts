import { useCallback, useEffect, useRef, useState } from 'react';
import { toAbsoluteImageUrl } from '@/api/queries/acquisition.queries';
import { API_URL } from '@/lib/environment';

const cameraPreviewEventsUrl = () => `${API_URL}/camera/preview`;

export function useCameraPreview() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageVersion, setImageVersion] = useState(0);
  const [isPreparingPreview, setIsPreparingPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const closeEventSource = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const capture = useCallback(() => {
    closeEventSource();
    setError(null);
    setIsPreparingPreview(true);

    const es = new EventSource(cameraPreviewEventsUrl());
    eventSourceRef.current = es;

    es.addEventListener('preview_ready', (event) => {
      const data = JSON.parse(event.data) as { path: string };
      setImageUrl(toAbsoluteImageUrl(data.path));
      setImageVersion((version) => version + 1);
      setIsPreparingPreview(false);
    });

    es.addEventListener('failed', (event) => {
      const data = JSON.parse(event.data) as { message: string };
      setError(data.message);
      closeEventSource();
      setIsPreparingPreview(false);
    });

    es.onerror = () => {
      if (eventSourceRef.current === es) {
        setError('Impossible de capturer la prévisualisation.');
        closeEventSource();
        setIsPreparingPreview(false);
      }
    };
  }, [closeEventSource]);

  useEffect(() => {
    capture();
    return () => closeEventSource();
  }, [capture, closeEventSource]);

  return { imageUrl, imageVersion, isPreparingPreview, error };
}
