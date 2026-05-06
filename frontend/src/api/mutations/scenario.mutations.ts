import { useMutation, useQueryClient } from '@tanstack/react-query';
import { scenariosKeyFactory } from '../queries/scenario.queries';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import type { UpsertScenarioPayload } from '@/schemas/scenario.schemas';
import type { AxiosError } from 'axios';
import { client } from '@/lib/client';

const upsertScenario = async (payload: UpsertScenarioPayload, mode: 'create' | 'update') => {
  return mode === 'create' ? await client.post('/scenario/', payload) : await client.patch('/scenario/', payload);
};

export const useUpsertScenario = (
  mode: 'create' | 'update',
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, UpsertScenarioPayload>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      await upsertScenario(payload, mode);
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: scenariosKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};

const deleteScenario = async (id: number) => {
  return await client.delete(`/scenario/${id}`);
};

export const useDeleteScenario = (options?: UseMutationOtherOptions<void, AxiosError<ApiError>, number>) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (id) => {
      await deleteScenario(id);
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: scenariosKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};

