import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';
import type { Profile } from '@/types/profile.types';
import { client } from '@/lib/client';
import { QUERY_STALE_TIME } from '@/lib/constants';

export const profilesKeyFactory = {
  base: () => ['profile'],
};

const getProfiles = async () => {
  const response = await client.get<Array<Profile>>('/profile');
  return response.data;
};

export const useGetProfiles = (): UseQueryResult<Array<Profile>> => {
  return useQuery({
    queryKey: profilesKeyFactory.base(),
    queryFn: getProfiles,
    staleTime: QUERY_STALE_TIME,
  });
};
