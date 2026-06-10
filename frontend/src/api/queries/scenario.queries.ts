import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Scenario } from '@/types/scenario.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const scenariosKeyFactory = {
  base: () => ['scenario'],
  compatible: (scenarioId: number) => [...scenariosKeyFactory.base(), 'compatible', scenarioId] as const,
};

const getScenarios = async () => {
  const response = await client.get<Array<Scenario>>('/scenario');
  return response.data;
};

export const useGetScenarios = (options?: { enabled?: boolean }): UseQueryResult<Array<Scenario>> => {
  return useQuery({
    queryKey: scenariosKeyFactory.base(),
    queryFn: getScenarios,
    staleTime: QUERY_STALE_TIME,
    enabled: options?.enabled ?? true,
  });
};

const getCompatibleScenarioIds = async (scenarioId: number) => {
  const response = await client.get<{ ids: Array<number> }>(`/scenario/${scenarioId}/compatible`);
  return response.data.ids;
};

export const useGetCompatibleScenarioIds = (scenarioId: number, enabled = true) => {
  return useQuery({
    queryKey: scenariosKeyFactory.compatible(scenarioId),
    queryFn: () => getCompatibleScenarioIds(scenarioId),
    staleTime: QUERY_STALE_TIME,
    enabled,
  });
};

