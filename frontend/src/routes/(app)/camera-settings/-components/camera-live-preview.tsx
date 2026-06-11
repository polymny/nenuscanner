import { memo, useCallback } from 'react';
import { toast } from 'sonner';
import type { MouseEvent } from 'react';
import { useSetCameraFocusArea } from '@/api/mutations/camera.mutations';
import { FOCUS_AREA_CROP_X, FOCUS_AREA_NORM_HEIGHT, FOCUS_AREA_NORM_WIDTH } from '@/types/camera.types';

interface CameraLivePreviewProps {
  playerUrl: string;
}

const CameraLivePreview = memo(function CameraLivePreview({ playerUrl }: CameraLivePreviewProps) {
  const { mutate: setFocusAreaMutation, isPending: isSettingFocus } = useSetCameraFocusArea({
    onSuccess: () => {
      toast.success('Zone de mise au point appliquée.');
    },
    onError: () => {
      toast.error('Impossible de définir la zone de mise au point.');
    },
  });

  const handleOverlayClick = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      if (isSettingFocus) {
        return;
      }

      const rect = event.currentTarget.getBoundingClientRect();
      const relativeX = (event.clientX - rect.left) / rect.width;
      const relativeY = (event.clientY - rect.top) / rect.height;
      const rawX = relativeX * FOCUS_AREA_NORM_WIDTH;
      const clampedX = Math.min(FOCUS_AREA_NORM_WIDTH - FOCUS_AREA_CROP_X, Math.max(FOCUS_AREA_CROP_X, rawX));
      const x = Math.round(clampedX - FOCUS_AREA_CROP_X);
      const y = Math.round(Math.min(1, Math.max(0, relativeY)) * FOCUS_AREA_NORM_HEIGHT);

      setFocusAreaMutation({ x, y });
    },
    [isSettingFocus, setFocusAreaMutation]
  );

  return (
    <div className="flex w-full flex-col gap-2">
      <p className="text-sm text-gray-600">Cliquez sur l&apos;aperçu pour choisir le point de mise au point.</p>
      <div className="relative aspect-video w-full overflow-hidden rounded-md bg-gray-100">
        <iframe
          allow="autoplay; fullscreen"
          className="pointer-events-none absolute inset-0 h-full w-full border-0"
          src={playerUrl}
          title="Flux live MediaMTX"
        />
        {isSettingFocus ? (
          <div aria-busy className="absolute inset-0 flex cursor-wait items-center justify-center bg-gray-900/45">
            <span className="rounded-md bg-gray-950/70 px-3 py-1.5 text-sm text-white">Mise au point en cours…</span>
          </div>
        ) : (
          <button
            aria-label="Choisir le point de mise au point"
            className="absolute inset-0 cursor-crosshair bg-transparent"
            onClick={handleOverlayClick}
            type="button"
          />
        )}
      </div>
    </div>
  );
});

export default CameraLivePreview;
