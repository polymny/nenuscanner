import { useMutation, useQueryClient } from '@tanstack/react-query';
import { armsPositionKeyFactory } from '../queries/arms-position.queries';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import type { ArmsPosition } from '@/types/arms-position.types';
import type { AxiosError } from 'axios';
import { client } from '@/lib/client';

const increaseArmsPosition = async () => {
  const response = await client.post<ArmsPosition>('/arms-position/increase');
  return response.data;
};

export const useIncreaseArmsPosition = (
  options?: UseMutationOtherOptions<ArmsPosition, AxiosError<ApiError>, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async () => {
      return await increaseArmsPosition();
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: armsPositionKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};

