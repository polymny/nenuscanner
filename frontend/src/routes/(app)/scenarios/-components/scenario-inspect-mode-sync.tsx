import { useEffect, useRef } from 'react';
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
  useTurnInspectModeRotation,
} from '@/api/mutations/inspect-mode.mutations';

const ScenarioInspectModeSync = () => {
  const { activeInspectMode, shutterSpeedPreviewValue, clearInspectMode } = useScenarioInspectMode();
  const { control } = useFormContext<UpsertScenarioPayload>();
  const leds = useWatch({ control, name: 'leds' });
  const rotationsCount = useWatch({ control, name: 'rotationsCount' });

  const handleInspectModeError = (message: string) => (error: AxiosError<ApiError>) => {
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
  const { mutate: turnRotationMutation } = useTurnInspectModeRotation({
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
        setShutterSpeedMutation({ value: shutterSpeedPreviewValue });
      }
    }
  }, [activeInspectMode, leds, setLedMutation, setShutterSpeedMutation, shutterSpeedPreviewValue]);

  useEffect(() => {
    if (activeInspectMode !== 'rotations' || rotationsCount < 1) return;

    const turn = () => turnRotationMutation({ rotationsCount });
    turn();
    const intervalId = window.setInterval(turn, 30_000);
    return () => window.clearInterval(intervalId);
  }, [activeInspectMode, rotationsCount, turnRotationMutation]);

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

  return null;
};

export default ScenarioInspectModeSync;
