import { useGetMeQuery } from './parfumApi';

type GetMeOptions = NonNullable<Parameters<typeof useGetMeQuery>[1]>;

/** Subscribes to `/users/me` with balance-friendly refetch defaults for the mini app. */
export function useParfumMeQuery(options?: GetMeOptions) {
  return useGetMeQuery(undefined, {
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 10_000,
    skipPollingIfUnfocused: true,
    ...options,
  });
}
