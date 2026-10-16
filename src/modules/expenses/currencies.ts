import { useQuery } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import { userKeys } from '@/core/auth/queries';

const RATES_FRESH_MS = 6 * 60 * 60 * 1000; // rates change once a day

/**
 * The currencies an entry can be in: the base currency first, then each one there is a rate
 * for, by code. Without rates (the provider away), only the base currency.
 */
export function useCurrencies(base: string | undefined): string[] {
  const rates = useQuery({
    queryKey: [...userKeys.all, 'fx', 'rates', base] as const,
    queryFn: () => unwrap(api.GET('/v1/fx/rates')),
    enabled: Boolean(base),
    staleTime: RATES_FRESH_MS,
  });
  if (!base) return [];
  const others = Object.keys(rates.data?.rates ?? {}).filter((code) => code !== base);
  return [base, ...others.sort()];
}
