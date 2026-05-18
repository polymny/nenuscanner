import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acquisitionsKeyFactory } from '../queries/acquisition.queries';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import type { AxiosError } from 'axios';
import type { CreateAcquisitionPayload } from '@/schemas/acquisition.schemas';
import { client } from '@/lib/client';

const createAcquisition = async (payload: CreateAcquisitionPayload) => {
  return await client.post('/acquisition/', payload);
};

export const useCreateAcquisition = (
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, CreateAcquisitionPayload>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      await createAcquisition(payload);
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};

const deleteAcquisition = async (id: number) => {
  return await client.delete(`/acquisition/${id}`);
};

export const useDeleteAcquisition = (options?: UseMutationOtherOptions<void, AxiosError<ApiError>, number>) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (id) => {
      await deleteAcquisition(id);
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};
