import { useInfiniteQuery, type QueryKey } from '@tanstack/react-query';

interface PageOf<T> {
  items: T[];
  page: number;
  has_next: boolean;
}

/**
 * A paged list that grows with "show more": `data` is every item loaded so far, in order.
 * Always refetched when a page opens, because feeds change behind the user's back.
 */
export function usePages<T>(queryKey: QueryKey, fetchPage: (page: number) => Promise<PageOf<T>>) {
  return useInfiniteQuery({
    queryKey,
    queryFn: ({ pageParam }) => fetchPage(pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.has_next ? last.page + 1 : undefined),
    select: (data) => data.pages.flatMap((page) => page.items),
    staleTime: 0,
  });
}
