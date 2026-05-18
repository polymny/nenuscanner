import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Acquisition } from '@/types/acquisition.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const acquisitionsKeyFactory = {
  base: () => ['acquisition'] as const,
  byArtifact: (artifactId: number) => [...acquisitionsKeyFactory.base(), 'artifact', artifactId] as const,
};

const getAcquisitionsByArtifactId = async (artifactId: number) => {
  const response = await client.get<Array<Acquisition>>(`/artifact/${artifactId}/acquisitions`);
  return response.data;
};

export const useGetAcquisitionsByArtifactId = (
  artifactId: number,
): UseQueryResult<Array<Acquisition>> => {
  return useQuery({
    queryKey: acquisitionsKeyFactory.byArtifact(artifactId),
    queryFn: () => getAcquisitionsByArtifactId(artifactId),
    staleTime: QUERY_STALE_TIME,
    enabled: Number.isFinite(artifactId) && artifactId > 0,
  });
};
