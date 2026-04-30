import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { client } from '@/lib/client';

export type GetObject2FirstResponse =
  | {
      id: number;
      name: string;
    }
  | {
      status: string;
      code: number;
      message?: string;
    };

const getTest = async () => {
  const response = await client.get<GetObject2FirstResponse>('/object2/first');
  return response.data;
};

const getTestQueryKey = ['test'] as const;

export const useGetTestQuery = (
  options?: Omit<
    UseQueryOptions<
      GetObject2FirstResponse,
      Error,
      GetObject2FirstResponse,
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
