import { useQuery } from '@tanstack/react-query';
import type { UseQueryOptions } from '@tanstack/react-query';
import { client } from '@/lib/client';

export type GetObject2FirstResponse =
  | {
      status: 'ok';
      object2: {
        id: number;
        name: string;
      };
    }
  | {
      status: 'error';
      error: string;
      message?: string;
      details?: string;
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
