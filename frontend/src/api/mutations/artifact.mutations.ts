import { useMutation, useQueryClient } from '@tanstack/react-query';
import { artifactsKeyFactory } from '../queries/artifact.queries';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import type { UpsertArtifactPayload } from '@/schemas/artifact.schemas';
import type { AxiosError } from 'axios';
import { client } from '@/lib/client';

const upsertArtifact = async (payload: UpsertArtifactPayload, mode: 'create' | 'update') => {
  return mode === 'create' ? await client.post('/artifact/', payload) : await client.patch('/artifact/', payload);
};

export const useUpsertArtifact = (
  mode: 'create' | 'update',
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, UpsertArtifactPayload>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      await upsertArtifact(payload, mode);
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: artifactsKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};

const deleteArtifact = async (id: number) => {
  return await client.delete(`/artifact/${id}`);
};

export const useDeleteArtifact = (options?: UseMutationOtherOptions<void, AxiosError<ApiError>, number>) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (id) => {
      await deleteArtifact(id);
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: artifactsKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};
