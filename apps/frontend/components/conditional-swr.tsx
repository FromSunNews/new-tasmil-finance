"use client";

import useSWR, { type SWRConfiguration, type Key, type Fetcher } from 'swr';

interface ConditionalSWRProps<T> {
  key: string | null;
  fetcher?: Fetcher<T, string>;
  config?: SWRConfiguration<T>;
  condition?: boolean;
  fallbackData?: T;
}

/**
 * Conditional SWR hook that only makes requests when condition is true
 * Helps prevent unnecessary API calls that cause 404s
 */
export function useConditionalSWR<T>({
  key,
  fetcher,
  config,
  condition = true,
  fallbackData
}: ConditionalSWRProps<T>) {
  const shouldFetch = condition && key !== null;
  
  return useSWR<T>(
    shouldFetch ? key : null,
    fetcher ?? null,
    {
      ...config,
      fallbackData,
      // Don't revalidate if condition becomes false
      revalidateOnFocus: shouldFetch ? config?.revalidateOnFocus : false,
      revalidateOnReconnect: shouldFetch ? config?.revalidateOnReconnect : false,
    }
  );
}

/**
 * Hook for artifact-related SWR calls that commonly return 404
 * Returns null data instead of making requests for non-existent artifacts
 */
export function useArtifactSWR<T>(key: string | null, hasArtifact: boolean = false) {
  return useConditionalSWR<T>({
    key,
    condition: hasArtifact,
    fallbackData: null as T,
    config: {
      errorRetryCount: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
    }
  });
}

/**
 * Hook for authenticated SWR calls
 * Only makes requests when user is authenticated
 */
export function useAuthenticatedSWR<T>(
  key: string | null, 
  isAuthenticated: boolean = false,
  config?: SWRConfiguration<T>
) {
  return useConditionalSWR<T>({
    key,
    condition: isAuthenticated,
    config: {
      errorRetryCount: 0,
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      ...config,
    }
  });
}