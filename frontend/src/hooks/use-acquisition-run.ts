import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AcquisitionStatus } from '@/types/acquisition.types';
import {
  acquisitionRunEventsUrl,
  acquisitionsKeyFactory,
  startAcquisitionRun,
  toAbsoluteImageUrl,
} from '@/api/queries/acquisition.queries';

interface PhotoReadyEvent {
  step: number;
  total: number;
  imageUrl: string;
}

interface CompletedEvent {
  images: Array<string>;
  total: number;
}

const jobStorageKey = (acquisitionId: number) => `acquisition-run-job:${acquisitionId}`;

export function useAcquisitionRun(acquisitionId: number, status?: AcquisitionStatus) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const completedRef = useRef(false);
  const [progress, setProgress] = useState({ step: 0, total: 10 });
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clearStoredJob = useCallback(() => {
    localStorage.removeItem(jobStorageKey(acquisitionId));
  }, [acquisitionId]);

  const closeEventSource = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
  }, []);

  const subscribeToJob = useCallback(
    (jobId: string) => {
      if (eventSourceRef.current) return;

      completedRef.current = false;
      const es = new EventSource(acquisitionRunEventsUrl(jobId));
      eventSourceRef.current = es;

      es.addEventListener('started', (event) => {
        const data = JSON.parse(event.data) as { total: number };
        setProgress((prev) => ({ step: prev.step, total: data.total }));
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.byId(acquisitionId) });
      });

      es.addEventListener('photo_ready', (event) => {
        const data = JSON.parse(event.data) as PhotoReadyEvent;
        setProgress({ step: data.step, total: data.total });
        setLastImageUrl(toAbsoluteImageUrl(data.imageUrl));
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.byId(acquisitionId) });
      });

      es.addEventListener('completed', (event) => {
        const data = JSON.parse(event.data) as CompletedEvent;
        if (data.images.length > 0) {
          setLastImageUrl(toAbsoluteImageUrl(data.images[data.images.length - 1]));
        }
        completedRef.current = true;
        clearStoredJob();
        closeEventSource();
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.byId(acquisitionId) });
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
      });

      es.addEventListener('failed', (event) => {
        const data = JSON.parse(event.data) as { message: string };
        setError(data.message);
        completedRef.current = true;
        clearStoredJob();
        closeEventSource();
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.byId(acquisitionId) });
      });

      es.onerror = () => {
        if (eventSourceRef.current === es && !completedRef.current) {
          setError('Connexion SSE interrompue.');
          closeEventSource();
        }
      };
    },
    [acquisitionId, clearStoredJob, closeEventSource, queryClient]
  );

  useEffect(() => {
    if (status !== 'RUNNING') return;
    const jobId = localStorage.getItem(jobStorageKey(acquisitionId));
    if (jobId) subscribeToJob(jobId);
  }, [acquisitionId, status, subscribeToJob]);

  useEffect(() => () => closeEventSource(), [closeEventSource]);

  const start = useCallback(async () => {
    closeEventSource();
    setError(null);
    setLastImageUrl(null);
    setProgress({ step: 0, total: 10 });

    try {
      const { jobId } = await startAcquisitionRun(acquisitionId);
      localStorage.setItem(jobStorageKey(acquisitionId), jobId);
      subscribeToJob(jobId);
    } catch {
      setError("Impossible de démarrer l'acquisition.");
    }
  }, [acquisitionId, closeEventSource, subscribeToJob]);

  return {
    start,
    progress,
    lastImageUrl,
    error,
  };
}
