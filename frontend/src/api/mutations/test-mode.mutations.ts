import { useMutation } from '@tanstack/react-query';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import type { LedValue } from '@/types/led.types';
import type { AxiosError } from 'axios';
import { client } from '@/lib/client';
import { API_URL } from '@/lib/environment';

export interface TestModeLedPayload {
  value: LedValue;
  powerId: number;
}

export const setTestModeLed = async (payload: TestModeLedPayload) => {
  await client.post('/test-mode/led', payload);
};

export const useSetTestModeLed = (
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, TestModeLedPayload>
) => {
  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      await setTestModeLed(payload);
    },
  });
};

export interface TestModeShutterSpeedPayload {
  value: number;
}

export const setTestModeShutterSpeed = async (payload: TestModeShutterSpeedPayload) => {
  await client.post('/test-mode/shutter-speed', payload);
};

export const useSetTestModeShutterSpeed = (
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, TestModeShutterSpeedPayload>
) => {
  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      await setTestModeShutterSpeed(payload);
    },
  });
};

export const leaveTestMode = async () => {
  await client.post('/test-mode/leave');
};

export const useLeaveTestMode = (options?: UseMutationOtherOptions<void, AxiosError<ApiError>, void>) => {
  return useMutation({
    ...options,
    mutationFn: async () => {
      await leaveTestMode();
    },
  });
};
export const sendLeaveTestModeOnPageExit = () => {
  const url = `${API_URL}/test-mode/leave`;

  if (typeof navigator.sendBeacon === 'function' && navigator.sendBeacon(url)) return;

  void fetch(url, {
    method: 'POST',
    keepalive: true,
  });
};
