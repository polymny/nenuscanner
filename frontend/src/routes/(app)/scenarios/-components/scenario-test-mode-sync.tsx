import { useEffect, useRef } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { parseLedValueFromTestModeTarget, useScenarioTestMode } from './scenario-test-mode-context';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import type { AxiosError } from 'axios';
import type { ApiError } from '@/lib/api-types';
import {
  leaveTestMode,
  sendLeaveTestModeOnPageExit,
  useLeaveTestMode,
  useSetTestModeLed,
  useSetTestModeShutterSpeed,
} from '@/api/mutations/test-mode.mutations';

const ScenarioTestModeSync = () => {
  const { activeTestMode, shutterSpeedPreviewValue, clearTestMode } = useScenarioTestMode();
  const { control } = useFormContext<UpsertScenarioPayload>();
  const leds = useWatch({ control, name: 'leds' });

  const handleTestModeError = (message: string) => (error: AxiosError<ApiError>) => {
    if (error.response?.status === 409) {
      toast.error('Mode test indisponible : une acquisition est en cours.');
    } else {
      toast.error(message);
    }
    clearTestMode();
  };

  const { mutate: setLedMutation } = useSetTestModeLed({
    onError: handleTestModeError('Impossible de contrôler les LEDs en mode test.'),
  });
  const { mutate: setShutterSpeedMutation } = useSetTestModeShutterSpeed({
    onError: handleTestModeError("Impossible d'appliquer le temps de pose en mode test."),
  });
  const { mutate: leaveMutation } = useLeaveTestMode();
  const prevActiveTestMode = useRef(activeTestMode);

  useEffect(() => {
    const ledValue = parseLedValueFromTestModeTarget(activeTestMode);
    if (ledValue) {
      const powerId = leds.find((led) => led.value === ledValue)?.powerId;
      if (powerId !== undefined) setLedMutation({ value: ledValue, powerId });
      return;
    }
    if (activeTestMode === 'shutter-speeds') {
      if (shutterSpeedPreviewValue !== null) {
        setShutterSpeedMutation({ value: shutterSpeedPreviewValue });
      }
    }
  }, [activeTestMode, leds, setLedMutation, setShutterSpeedMutation, shutterSpeedPreviewValue]);

  useEffect(() => {
    if (prevActiveTestMode.current !== null && activeTestMode === null) {
      leaveMutation();
    }
    prevActiveTestMode.current = activeTestMode;
  }, [activeTestMode, leaveMutation]);

  useEffect(() => {
    const handlePageHide = (event: PageTransitionEvent) => {
      if (event.persisted) return;
      sendLeaveTestModeOnPageExit();
    };

    window.addEventListener('pagehide', handlePageHide);

    return () => {
      window.removeEventListener('pagehide', handlePageHide);
      void leaveTestMode();
    };
  }, []);

  return null;
};

export default ScenarioTestModeSync;
