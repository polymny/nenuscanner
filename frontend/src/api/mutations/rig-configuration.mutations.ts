import { useMutation, useQueryClient } from '@tanstack/react-query';
import { rigConfigurationKeyFactory } from '../queries/rig-configuration.queries';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import type { RigConfiguration } from '@/types/rig-configuration.types';
import type { AxiosError } from 'axios';
import { client } from '@/lib/client';

const increaseRigConfiguration = async () => {
  const response = await client.post<RigConfiguration>('/rig-configuration/increase');
  return response.data;
};

export const useIncreaseRigConfiguration = (
  options?: UseMutationOtherOptions<RigConfiguration, AxiosError<ApiError>, void>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async () => {
      return await increaseRigConfiguration();
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: rigConfigurationKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};
