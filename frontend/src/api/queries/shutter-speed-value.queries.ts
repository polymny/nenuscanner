import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { ShutterSpeedValueOption } from '@/types/shutter-speed-value.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const shutterSpeedValueKeyFactory = {
  base: () => ['shutter-speed-value'],
};

const getShutterSpeedValues = async () => {
  const response = await client.get<Array<ShutterSpeedValueOption>>('/shutter-speed-value');
  return response.data;
};

export const useGetShutterSpeedValues = (): UseQueryResult<Array<ShutterSpeedValueOption>> => {
  return useQuery({
    queryKey: shutterSpeedValueKeyFactory.base(),
    queryFn: getShutterSpeedValues,
    staleTime: QUERY_STALE_TIME,
  });
};
