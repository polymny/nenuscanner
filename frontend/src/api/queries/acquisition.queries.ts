import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type {
  Acquisition,
  AcquisitionDetail,
  AcquisitionRunStartOrResumeResponse,
  AcquisitionStatus,
} from '@/types/acquisition.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';
import { API_URL } from '@/lib/environment';

export const acquisitionsKeyFactory = {
  base: () => ['acquisition'] as const,
  byArtifact: (artifactId: number) => [...acquisitionsKeyFactory.base(), 'artifact', artifactId] as const,
  calibrationsBase: () => [...acquisitionsKeyFactory.base(), 'calibrations'] as const,
  calibrations: (params?: GetCalibrationsParams) =>
    [...acquisitionsKeyFactory.base(), 'calibrations', params ?? {}] as const,
  byId: (acquisitionId: number) => [...acquisitionsKeyFactory.base(), acquisitionId] as const,
};

export interface GetCalibrationsParams {
  onlyCurrentArmsPosition?: boolean;
  scenarioId?: number;
  status?: AcquisitionStatus;
}

const getAcquisitionsByArtifactId = async (artifactId: number) => {
  const response = await client.get<Array<Acquisition>>('/acquisition/', {
    params: { artifactId },
  });
  return response.data;
};

export const useGetAcquisitionsByArtifactId = (artifactId: number): UseQueryResult<Array<Acquisition>> => {
  return useQuery({
    queryKey: acquisitionsKeyFactory.byArtifact(artifactId),
    queryFn: () => getAcquisitionsByArtifactId(artifactId),
    staleTime: QUERY_STALE_TIME,
    enabled: Number.isFinite(artifactId) && artifactId > 0,
  });
};

const getCalibrations = async (params?: GetCalibrationsParams) => {
  const response = await client.get<Array<Acquisition>>('/acquisition/calibrations', {
    params,
  });
  return response.data;
};

export const useGetCalibrations = (params?: GetCalibrationsParams): UseQueryResult<Array<Acquisition>> => {
  return useQuery({
    queryKey: acquisitionsKeyFactory.calibrations(params),
    queryFn: () => getCalibrations(params),
    staleTime: QUERY_STALE_TIME,
  });
};

const getAcquisitionById = async (acquisitionId: number) => {
  const response = await client.get<AcquisitionDetail>(`/acquisition/${acquisitionId}`);
  return response.data;
};

export const useGetAcquisitionById = (acquisitionId: number): UseQueryResult<AcquisitionDetail> => {
  return useQuery({
    queryKey: acquisitionsKeyFactory.byId(acquisitionId),
    queryFn: () => getAcquisitionById(acquisitionId),
    staleTime: QUERY_STALE_TIME,
    enabled: Number.isFinite(acquisitionId) && acquisitionId > 0,
  });
};

export const startOrResumeAcquisitionRun = async (
  acquisitionId: number
): Promise<AcquisitionRunStartOrResumeResponse> => {
  const { data } = await client.post<AcquisitionRunStartOrResumeResponse>(
    `/acquisition/${acquisitionId}/run/start-or-resume`
  );
  return data;
};

export const cancelAcquisitionRun = async (jobId: string): Promise<{ jobId: string }> => {
  const { data } = await client.post<{ jobId: string }>(`/acquisition/run/${jobId}/cancel`);
  return data;
};

export const acquisitionRunEventsUrl = (jobId: string) => `${API_URL}/acquisition/run/${jobId}/events`;

export const toAbsoluteImageUrl = (imageUrl: string) =>
  imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`;
