import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cameraKeyFactory } from '../queries/camera.queries';
import type { AxiosError } from 'axios';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import type { CameraFocusAreaPayload } from '@/types/camera.types';
import type { UpdateCameraSettingPayload } from '@/schemas/camera.schemas';
import { client } from '@/lib/client';

const updateCameraSetting = async (payload: UpdateCameraSettingPayload) => {
  await client.patch('/camera/settings', payload);
};

export const useUpdateCameraSetting = (
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, UpdateCameraSettingPayload>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: updateCameraSetting,
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: cameraKeyFactory.settings() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};

const triggerCameraAutofocus = async () => {
  await client.post('/camera/autofocus');
};

export const useTriggerCameraAutofocus = (options?: UseMutationOtherOptions<void, AxiosError<ApiError>, void>) => {
  return useMutation({
    ...options,
    mutationFn: triggerCameraAutofocus,
  });
};

const setCameraFocusArea = async (payload: CameraFocusAreaPayload) => {
  await client.post('/camera/focus-area', payload);
};

export const useSetCameraFocusArea = (
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, CameraFocusAreaPayload>
) => {
  return useMutation({
    ...options,
    mutationFn: setCameraFocusArea,
  });
};

const changeCamera = async () => {
  await client.post('/camera/change');
};

export const useChangeCamera = (options?: UseMutationOtherOptions<void, AxiosError<ApiError>, void>) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: changeCamera,
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: cameraKeyFactory.settings() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};
