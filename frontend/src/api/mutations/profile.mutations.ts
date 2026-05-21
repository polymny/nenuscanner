import { useMutation, useQueryClient } from '@tanstack/react-query';
import { profilesKeyFactory } from '../queries/profile.queries';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import type { Profile } from '@/types/profile.types';
import type { UpsertProfilePayload } from '@/schemas/profile.schemas';
import type { AxiosError } from 'axios';
import { client } from '@/lib/client';

const upsertProfile = async (payload: UpsertProfilePayload, mode: 'create' | 'update') => {
  return mode === 'create' ? await client.post('/profile/', payload) : await client.patch('/profile/', payload);
};

export const useUpsertProfile = (
  mode: 'create' | 'update',
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, UpsertProfilePayload>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      await upsertProfile(payload, mode);
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: profilesKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};

const selectProfile = async (id: number) => {
  const { data } = await client.post<Profile>(`/profile/${id}/select`);
  return data;
};

export const useSelectProfile = (options?: UseMutationOtherOptions<Profile, AxiosError<ApiError>, number>) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: selectProfile,
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: profilesKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};

const deleteProfile = async (id: number) => {
  return await client.delete(`/profile/${id}`);
};

export const useDeleteProfile = (options?: UseMutationOtherOptions<void, AxiosError<ApiError>, number>) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (id) => {
      await deleteProfile(id);
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: profilesKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};
