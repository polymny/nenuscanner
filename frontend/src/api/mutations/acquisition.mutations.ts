import { useMutation, useQueryClient } from '@tanstack/react-query';
import { acquisitionsKeyFactory } from '../queries/acquisition.queries';
import { scenariosKeyFactory } from '../queries/scenario.queries';
import type { ApiError, UseMutationOtherOptions } from '@/lib/api-types';
import type { AxiosError } from 'axios';
import type { CreateAcquisitionPayload, CreateCalibrationPayload } from '@/schemas/acquisition.schemas';
import type { Acquisition } from '@/types/acquisition.types';
import { client } from '@/lib/client';
import { downloadBlobResponse } from '@/lib/download-blob';

const createAcquisition = async (payload: CreateAcquisitionPayload) => {
  const { data } = await client.post<Acquisition>('/acquisition/', payload);
  return data;
};

export const useCreateAcquisition = (
  options?: UseMutationOtherOptions<Acquisition, AxiosError<ApiError>, CreateAcquisitionPayload>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      return await createAcquisition(payload);
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.byArtifact(vars.artifactId) });
      void queryClient.invalidateQueries({ queryKey: scenariosKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};

const createCalibration = async (payload: CreateCalibrationPayload) => {
  const { data } = await client.post<Acquisition>('/acquisition/calibrations', payload);
  return data;
};

export const useCreateCalibration = (
  options?: UseMutationOtherOptions<Acquisition, AxiosError<ApiError>, CreateCalibrationPayload>
) => {
  const queryClient = useQueryClient();

  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      return await createCalibration(payload);
    },
    onSuccess: (data, vars, result, ctx) => {
      void queryClient.invalidateQueries({ queryKey: acquisitionsKeyFactory.calibrationsBase() });
      void queryClient.invalidateQueries({ queryKey: scenariosKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};

const deleteAcquisition = async (id: number) => {
  return await client.delete(`/acquisition/${id}`);
};

export type DownloadAcquisitionsPayload = {
  acquisitionIds: Array<number>;
};

const downloadAcquisitions = async (payload: DownloadAcquisitionsPayload) => {
  const response = await client.post<Blob>('/acquisition/download', payload, { responseType: 'blob' });
  downloadBlobResponse(response);
};

export const useDownloadAcquisitions = (
  options?: UseMutationOtherOptions<void, AxiosError<ApiError>, DownloadAcquisitionsPayload>
) => {
  return useMutation({
    ...options,
    mutationFn: async (payload) => {
      await downloadAcquisitions(payload);
    },
  });
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
      void queryClient.invalidateQueries({ queryKey: scenariosKeyFactory.base() });
      options?.onSuccess?.(data, vars, result, ctx);
    },
  });
};
