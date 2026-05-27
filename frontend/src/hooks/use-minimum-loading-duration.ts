import { useEffect, useRef, useState } from 'react';

interface UseMinimumLoadingDurationOptions {
  /** Durée minimale d'affichage du skeleton une fois le chargement démarré. */
  minDurationMs?: number;
}

export function useMinimumLoadingDuration(isLoading: boolean, options: UseMinimumLoadingDurationOptions = {}) {
  const { minDurationMs = 500 } = options;
  const [showLoading, setShowLoading] = useState(isLoading);
  const loadingStartedAtRef = useRef<number | null>(isLoading ? Date.now() : null);

  useEffect(() => {
    if (isLoading) {
      loadingStartedAtRef.current = Date.now();
      setShowLoading(true);
      return;
    }

    if (!showLoading) {
      return;
    }

    const startedAt = loadingStartedAtRef.current ?? Date.now();
    const remaining = Math.max(0, minDurationMs - (Date.now() - startedAt));

    const hideTimer = window.setTimeout(() => {
      setShowLoading(false);
      loadingStartedAtRef.current = null;
    }, remaining);

    return () => clearTimeout(hideTimer);
  }, [isLoading, minDurationMs, showLoading]);

  return showLoading;
}
