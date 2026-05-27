import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AcquisitionStatus, ScenarioProgressEvent } from '@/types/acquisition.types';
import {
  acquisitionRunEventsUrl,
  acquisitionsKeyFactory,
  startAcquisitionRun,
  toAbsoluteImageUrl,
} from '@/api/queries/acquisition.queries';

const jobStorageKey = (acquisitionId: number) => `acquisition-run-job:${acquisitionId}`;

export function useAcquisitionRun(acquisitionId: number, status?: AcquisitionStatus) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const completedRef = useRef(false);
  const [progress, setProgress] = useState<ScenarioProgressEvent | null>(null);
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
        const data = JSON.parse(event.data) as ScenarioProgressEvent;
        setProgress(data);
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
      });

      es.addEventListener('photo_ready', (event) => {
        const data = JSON.parse(event.data) as ScenarioProgressEvent;
        setProgress(data);
        if (data.imageUrl) setLastImageUrl(toAbsoluteImageUrl(data.imageUrl));
      });

      es.addEventListener('completed', () => {
        completedRef.current = true;
        clearStoredJob();
        closeEventSource();
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
      });

      es.addEventListener('failed', (event) => {
        const data = JSON.parse(event.data) as { message: string };
        setError(data.message);
        completedRef.current = true;
        clearStoredJob();
        closeEventSource();
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
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
    setProgress(null);

    try {
      const { jobId } = await startAcquisitionRun(acquisitionId);
      localStorage.setItem(jobStorageKey(acquisitionId), jobId);
      subscribeToJob(jobId);
    } catch {
      setError("Impossible de démarrer l'acquisition.");
    }
  }, [acquisitionId, closeEventSource, subscribeToJob]);

  return { start, progress, lastImageUrl, error };
}
