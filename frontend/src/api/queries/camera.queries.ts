import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { CameraSettings } from '@/types/camera.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const cameraKeyFactory = {
  base: () => ['camera'] as const,
  settings: () => [...cameraKeyFactory.base(), 'settings'] as const,
};

const getCameraSettings = async () => {
  const response = await client.get<CameraSettings>('/camera/settings');
  return response.data;
};

export const useGetCameraSettings = (): UseQueryResult<CameraSettings> => {
  return useQuery({
    queryKey: cameraKeyFactory.settings(),
    queryFn: getCameraSettings,
    staleTime: QUERY_STALE_TIME,
    retry: false,
  });
};
