import { useEffect, useRef, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { parseLedValueFromInspectModeTarget, useScenarioInspectMode } from './scenario-inspect-mode-context';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/lib/api-types';
import {
  leaveInspectMode,
  sendLeaveInspectModeOnPageExit,
  useLeaveInspectMode,
  useSetInspectModeLed,
  useSetInspectModeShutterSpeed,
  useTurnInspectModePose,
} from '@/api/mutations/inspect-mode.mutations';
import InitializeCameraDialog, { isCameraNotInitialized } from '@/components/initialize-camera-dialog';

/** How long each pose stays still before the next turn in pose inspect mode. */
const POSE_DWELL_MS = 3000;

const ScenarioInspectModeSync = () => {
  const { activeInspectMode, shutterSpeedPreviewValue, clearInspectMode } = useScenarioInspectMode();
  const { control } = useFormContext<UpsertScenarioPayload>();
  const leds = useWatch({ control, name: 'leds' });
  const posesCount = useWatch({ control, name: 'posesCount' });
  const [showInitializeDialog, setShowInitializeDialog] = useState(false);

  const handleInspectModeError = (message: string) => (error: AxiosError<ApiError>) => {
    if (isCameraNotInitialized(error)) {
      setShowInitializeDialog(true);
      clearInspectMode();
      return;
    }
    if (error.response?.status === 409) {
      toast.error('Mode inspect indisponible : une acquisition est en cours.');
    } else {
      toast.error(message);
    }
    clearInspectMode();
  };

  const { mutate: setLedMutation } = useSetInspectModeLed({
    onError: handleInspectModeError('Impossible de contrôler les LEDs en mode inspect.'),
  });
  const { mutate: setShutterSpeedMutation } = useSetInspectModeShutterSpeed({
    onError: handleInspectModeError("Impossible d'appliquer le temps de pose en mode inspect."),
  });
  const { mutate: turnPoseMutation } = useTurnInspectModePose({
    onError: handleInspectModeError('Impossible de tourner le plateau en mode inspect.'),
  });
  const { mutate: leaveMutation } = useLeaveInspectMode();
  const prevActiveInspectMode = useRef(activeInspectMode);

  useEffect(() => {
    const ledValue = parseLedValueFromInspectModeTarget(activeInspectMode);
    if (ledValue) {
      const powerId = leds.find((led) => led.value === ledValue)?.powerId;
      if (powerId !== undefined) setLedMutation({ value: ledValue, powerId });
      return;
    }
    if (activeInspectMode === 'shutter-speeds') {
      if (shutterSpeedPreviewValue !== null) {
        setShutterSpeedMutation({ relative_value: shutterSpeedPreviewValue });
      }
    }
  }, [activeInspectMode, leds, setLedMutation, setShutterSpeedMutation, shutterSpeedPreviewValue]);

  useEffect(() => {
    if (activeInspectMode !== 'poses' || posesCount <= 1) return;

    // The request returns once the rotation is over: chain the turns so that each pose stays still for the same time,
    // whatever the plate speed, and requests never overlap.
    let cancelled = false;
    let timeoutId: number | undefined;
    const turn = () =>
      turnPoseMutation(
        { posesCount },
        {
          onSettled: () => {
            if (!cancelled) timeoutId = window.setTimeout(turn, POSE_DWELL_MS);
          },
        }
      );
    turn();
    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [activeInspectMode, posesCount, turnPoseMutation]);

  useEffect(() => {
    if (prevActiveInspectMode.current !== null && activeInspectMode === null) {
      leaveMutation();
    }
    prevActiveInspectMode.current = activeInspectMode;
  }, [activeInspectMode, leaveMutation]);

  useEffect(() => {
    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      sendLeaveInspectModeOnPageExit();
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      void leaveInspectMode();
    };
  }, []);

  return <InitializeCameraDialog open={showInitializeDialog} onInitialized={() => setShowInitializeDialog(false)} />;
};

export default ScenarioInspectModeSync;
