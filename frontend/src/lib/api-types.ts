import type { UseMutationOptions } from '@tanstack/react-query';

export interface ApiError {
  data?: unknown;
  error: string;
}

export type UseMutationOtherOptions<TData = unknown, TError = Error, TVariables = void, TContext = unknown> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationFn'
>;
