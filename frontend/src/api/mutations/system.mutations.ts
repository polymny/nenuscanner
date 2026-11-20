import { useMutation } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import { client } from '@/lib/client';

const shutdown = async () => {
  await client.post('/system/shutdown');
};

/** Powers the Pi off (refused while an acquisition is running). */
export const useShutdown = (options?: UseMutationOtherOptions<void, AxiosError<ApiError>, void>) => {
  return useMutation({
    ...options,
    mutationFn: shutdown,
  });
};
