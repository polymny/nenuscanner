import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { RigConfiguration } from '@/types/rig-configuration.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const rigConfigurationKeyFactory = {
  base: () => ['rig-configuration'],
  last: () => [...rigConfigurationKeyFactory.base(), 'last'],
};

const getLastRigConfiguration = async () => {
  const response = await client.get<RigConfiguration>('/rig-configuration/last');
  return response.data;
};

export const useGetLastRigConfiguration = (): UseQueryResult<RigConfiguration> => {
  return useQuery({
    queryKey: rigConfigurationKeyFactory.last(),
    queryFn: getLastRigConfiguration,
    staleTime: QUERY_STALE_TIME,
    retry: false,
  });
};
