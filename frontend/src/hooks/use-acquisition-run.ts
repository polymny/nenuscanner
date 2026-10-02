import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { AcquisitionStatus, ScenarioProgressEvent } from '@/types/acquisition.types';
import {
  acquisitionRunEventsUrl,
  acquisitionsKeyFactory,
  cancelAcquisitionRun,
  startOrResumeAcquisitionRun,
  toAbsoluteImageUrl,
} from '@/api/queries/acquisition.queries';
import { scenariosKeyFactory } from '@/api/queries/scenario.queries';

const jobStorageKey = (acquisitionId: number) => `acquisition-run-job:${acquisitionId}`;

export function useAcquisitionRun(acquisitionId: number, status?: AcquisitionStatus) {
  const queryClient = useQueryClient();
  const eventSourceRef = useRef<EventSource | null>(null);
  const jobEndedRef = useRef(false);
  const [progress, setProgress] = useState<ScenarioProgressEvent | null>(null);
  const [lastImageUrl, setLastImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

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

      jobEndedRef.current = false;
      const es = new EventSource(acquisitionRunEventsUrl(jobId));
      eventSourceRef.current = es;

      es.addEventListener('started', (event) => {
        const data = JSON.parse(event.data) as ScenarioProgressEvent;
        setProgress(data);
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
        void queryClient.invalidateQueries({ queryKey: scenariosKeyFactory.base() });
      });

      es.addEventListener('image_ready', (event) => {
        const data = JSON.parse(event.data) as ScenarioProgressEvent;
        setProgress(data);
        if (data.imageUrl) setLastImageUrl(toAbsoluteImageUrl(data.imageUrl));
      });

      es.addEventListener('paused', () => {
        jobEndedRef.current = true;
        clearStoredJob();
        closeEventSource();
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
        void queryClient.invalidateQueries({ queryKey: scenariosKeyFactory.base() });
      });

      es.addEventListener('completed', () => {
        jobEndedRef.current = true;
        clearStoredJob();
        closeEventSource();
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
        void queryClient.invalidateQueries({ queryKey: scenariosKeyFactory.base() });
      });

      es.addEventListener('failed', (event) => {
        const data = JSON.parse(event.data) as { message: string };
        setError(data.message);
        jobEndedRef.current = true;
        setIsCancelling(false);
        clearStoredJob();
        closeEventSource();
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
        void queryClient.invalidateQueries({ queryKey: scenariosKeyFactory.base() });
      });

      es.addEventListener('cancelled', () => {
        jobEndedRef.current = true;
        setIsCancelling(false);
        setProgress(null);
        setLastImageUrl(null);
        clearStoredJob();
        closeEventSource();
        void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
        void queryClient.invalidateQueries({ queryKey: scenariosKeyFactory.base() });
      });

      es.onerror = () => {
        if (eventSourceRef.current === es && !jobEndedRef.current) {
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

  const startOrResume = useCallback(async () => {
    closeEventSource();
    setError(null);
    setIsCancelling(false);
    setLastImageUrl(null);
    setProgress(null);

    try {
      const { jobId } = await startOrResumeAcquisitionRun(acquisitionId);
      localStorage.setItem(jobStorageKey(acquisitionId), jobId);
      subscribeToJob(jobId);
    } catch {
      setError("Impossible de démarrer ou de reprendre l'acquisition.");
    }
  }, [acquisitionId, closeEventSource, subscribeToJob]);

  const cancel = useCallback(async () => {
    const jobId = localStorage.getItem(jobStorageKey(acquisitionId));
    if (!jobId) {
      setError("Impossible d'annuler l'acquisition.");
      return;
    }

    setIsCancelling(true);
    try {
      await cancelAcquisitionRun(jobId);
    } catch {
      setIsCancelling(false);
      setError("Impossible d'annuler l'acquisition.");
    }
  }, [acquisitionId]);

  return { startOrResume, cancel, progress, lastImageUrl, error, isCancelling };
}
