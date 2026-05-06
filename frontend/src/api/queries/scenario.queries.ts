import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Scenario } from '@/types/scenario.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const scenariosKeyFactory = {
  base: () => ['scenario'],
};

const getScenarios = async () => {
  const response = await client.get<Array<Scenario>>('/scenario');
  return response.data;
};

export const useGetScenarios = (): UseQueryResult<Array<Scenario>> => {
  return useQuery({
    queryKey: scenariosKeyFactory.base(),
    queryFn: getScenarios,
    staleTime: QUERY_STALE_TIME,
  });
};

