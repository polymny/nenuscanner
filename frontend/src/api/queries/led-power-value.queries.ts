import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { LedPowerValueOption } from '@/types/led-power-value.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const ledPowerValueKeyFactory = {
  base: () => ['led-power-value'],
};

const getLedPowerValues = async () => {
  const response = await client.get<Array<LedPowerValueOption>>('/led-power-value');
  return response.data;
};

export const useGetLedPowerValues = (): UseQueryResult<Array<LedPowerValueOption>> => {
  return useQuery({
    queryKey: ledPowerValueKeyFactory.base(),
    queryFn: getLedPowerValues,
    staleTime: QUERY_STALE_TIME,
  });
};
