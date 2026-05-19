import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Acquisition, AcquisitionDetail, AcquisitionRunStartResponse } from '@/types/acquisition.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';
import { API_URL } from '@/lib/environment';

export const acquisitionsKeyFactory = {
  base: () => ['acquisition'] as const,
  byArtifact: (artifactId: number) => [...acquisitionsKeyFactory.base(), 'artifact', artifactId] as const,
  byId: (acquisitionId: number) => [...acquisitionsKeyFactory.base(), acquisitionId] as const,
};

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

export const startAcquisitionRun = async (acquisitionId: number): Promise<AcquisitionRunStartResponse> => {
  const { data } = await client.post<AcquisitionRunStartResponse>(`/acquisition/${acquisitionId}/run/start`);
  return data;
};

export const acquisitionRunEventsUrl = (jobId: string) => `${API_URL}/acquisition/run/${jobId}/events`;

export const toAbsoluteImageUrl = (imageUrl: string) =>
  imageUrl.startsWith('http') ? imageUrl : `${API_URL}${imageUrl}`;
