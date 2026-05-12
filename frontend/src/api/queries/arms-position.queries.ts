import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ArmsPosition } from '@/types/arms-position.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const armsPositionKeyFactory = {
  base: () => ['arms-position'],
  last: () => [...armsPositionKeyFactory.base(), 'last'],
};

const getLastArmsPosition = async () => {
  const response = await client.get<ArmsPosition>('/arms-position/last');
  return response.data;
};

export const useGetLastArmsPosition = (): UseQueryResult<ArmsPosition> => {
  return useQuery({
    queryKey: armsPositionKeyFactory.last(),
    queryFn: getLastArmsPosition,
    staleTime: QUERY_STALE_TIME,
    retry: false,
  });
};
