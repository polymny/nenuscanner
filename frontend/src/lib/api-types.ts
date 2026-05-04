import type { UseMutationOptions } from '@tanstack/react-query';

export interface ApiError {
  code: number;
  message: string;
  status: string;
  errors?: Record<string, string>;
}

export type UseMutationOtherOptions<TData = unknown, TError = Error, TVariables = void, TContext = unknown> = Omit<
  UseMutationOptions<TData, TError, TVariables, TContext>,
  'mutationFn'
>;
