import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { RelativeShutterSpeedValueOption } from '@/types/relative-shutter-speed-value.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const relativeShutterSpeedValueKeyFactory = {
  base: () => ['relative-shutter-speed-value'],
};

const getRelativeShutterSpeedValues = async () => {
  const response = await client.get<Array<RelativeShutterSpeedValueOption>>('/relative-shutter-speed-value');
  return response.data;
};

export const useGetRelativeShutterSpeedValues = (): UseQueryResult<Array<RelativeShutterSpeedValueOption>> => {
  return useQuery({
    queryKey: relativeShutterSpeedValueKeyFactory.base(),
    queryFn: getRelativeShutterSpeedValues,
    staleTime: QUERY_STALE_TIME,
  });
};
