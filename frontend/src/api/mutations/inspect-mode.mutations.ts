import { useMutation } from '@tanstack/react-query';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import type { LedValue } from '@/types/led.types';
import type { AxiosError } from 'axios';
import { client } from '@/lib/client';
import { API_URL } from '@/lib/environment';

export interface InspectModeLedPayload {
  value: LedValue;
  powerId: number;
}

export const setInspectModeLed = async (payload: InspectModeLedPayload) => {
  await client.post('/inspect-mode/led', payload);
};

export const useSetInspectModeLed = (
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, InspectModeLedPayload>
) => {
  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      await setInspectModeLed(payload);
    },
  });
};

export interface InspectModeShutterSpeedPayload {
  value: number;
}

export const setInspectModeShutterSpeed = async (payload: InspectModeShutterSpeedPayload) => {
  await client.post('/inspect-mode/shutter-speed', payload);
};

export const useSetInspectModeShutterSpeed = (
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, InspectModeShutterSpeedPayload>
) => {
  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      await setInspectModeShutterSpeed(payload);
    },
  });
};

export const leaveInspectMode = async () => {
  await client.post('/inspect-mode/leave');
};

export interface InspectModeRotationPayload {
  rotationsCount: number;
}

export const turnInspectModeRotation = async (payload: InspectModeRotationPayload) => {
  await client.post('/inspect-mode/rotation', payload);
};

export const useTurnInspectModeRotation = (
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, InspectModeRotationPayload>
) => {
  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      await turnInspectModeRotation(payload);
    },
  });
};

export const useLeaveInspectMode = (options?: UseMutationOtherOptions<void, AxiosError<ApiError>, void>) => {
  return useMutation({
    ...options,
    mutationFn: async () => {
      await leaveInspectMode();
    },
  });
};
export const sendLeaveInspectModeOnPageExit = () => {
  const url = `${API_URL}/inspect-mode/leave`;

  if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url)) return;

  void fetch(url, {
    method: 'POST',
    keepalive: true,
  });
};
