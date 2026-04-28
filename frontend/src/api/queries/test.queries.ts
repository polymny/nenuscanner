import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { client } from '@/lib/client';

export type GetTestResponse = {
  status: 'ok' | 'error';
  message: string;
};

const getTest = async () => {
  const response = await client.get<GetTestResponse>('/test');
  return response.data;
};

const getTestQueryKey = ['test'] as const;

export const useGetTestQuery = (
  options?: Omit<
    UseQueryOptions<
      GetTestResponse,
      Error,
      GetTestResponse,
      typeof getTestQueryKey
    >,
    'queryKey' | 'queryFn'
  >,
) => {
  return useQuery({
    queryKey: getTestQueryKey,
    queryFn: getTest,
    ...options,
  });
};
