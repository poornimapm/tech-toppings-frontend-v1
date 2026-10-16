import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Command as Cmdk } from 'cmdk';
import { useTranslation } from 'react-i18next';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { userKeys } from '@/core/auth/queries';
import { useModuleTiles } from '@/core/modules/queries';
import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { useSettled } from '@/core/utils/use-settled';
import { moduleHref } from '@/platform/welcome/module-style';

type SearchHit = components['schemas']['SearchHit'];

/** How long typing must pause before the palette searches. */
const PAUSE_MS = 250;

/** Each module's own things matching what is typed. The server decides what is too short. */
function useSearch(text: string) {
  const query = useSettled(text.trim(), PAUSE_MS);
  return useQuery({
    queryKey: [...userKeys.all, 'search', query] as const,
    queryFn: () => unwrap(api.GET('/v1/search', { params: { query: { q: query } } })),
    enabled: query !== '',
    placeholderData: keepPreviousData,
  });
}

/**
 * What the user's modules found for the words typed, a group per module under its name. Each
 * leads to its own place in the module (`path`); the module names the kind of thing it is.
 */
export function SearchResults({
  query,
  className,
  onOpen,
}: {
  query: string;
  className: string;
  onOpen: (href: string) => void;
}) {
  const { i18n } = useTranslation();
  const { tiles } = useModuleTiles();
  const found = useSearch(query);
  if (!query.trim()) return null;

  const detailOf = (hit: SearchHit, kinds: Record<string, string> | undefined) =>
    [
      kinds?.[hit.kind],
      hit.amount_minor != null &&
        hit.currency &&
        formatMoney(hit.amount_minor, hit.currency, i18n.language),
      hit.date &&
        new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
          displayDate(hit.date),
        ),
    ]
      .filter(Boolean)
      .join(' · ');

  return (found.data?.groups ?? []).map((group) => {
    const tile = tiles.find((candidate) => candidate.view.key === group.owner);
    if (!tile) return null;
    const Icon = tile.definition.icon;
    return (
      <Cmdk.Group key={group.owner} heading={tile.text.name} forceMount>
        {group.hits.map((hit) => {
          const detail = detailOf(hit, tile.text.search);
          return (
            <Cmdk.Item
              key={`${hit.kind}:${hit.id}`}
              value={`found ${group.owner} ${hit.kind} ${hit.id}`}
              forceMount
              onSelect={() => {
                onOpen(
                  hit.path.startsWith('?')
                    ? `${moduleHref(tile)}${hit.path}`
                    : moduleHref(tile, hit.path),
                );
              }}
              className={className}
            >
              <Icon aria-hidden="true" className="size-4 shrink-0 text-muted" />
              <span className="min-w-0 flex-1 truncate">{hit.title}</span>
              {detail && <span className="shrink-0 text-xs text-muted">{detail}</span>}
            </Cmdk.Item>
          );
        })}
      </Cmdk.Group>
    );
  });
}
