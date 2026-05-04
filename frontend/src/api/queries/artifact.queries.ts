import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Artifact } from '@/types/artifact.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const artifactsKeyFactory = {
  base: () => ['artifact'],
};

const getArtifacts = async () => {
  const response = await client.get<Array<Artifact>>('/artifact');
  return response.data;
};

export const useGetArtifacts = (): UseQueryResult<Array<Artifact>> => {
  return useQuery({
    queryKey: artifactsKeyFactory.base(),
    queryFn: getArtifacts,
    staleTime: QUERY_STALE_TIME,
  });
};
