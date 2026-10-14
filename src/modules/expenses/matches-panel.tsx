import { ArrowRight, Combine, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { errorKey } from '@/core/i18n';
import { Button, toast } from '@/design-system';
import {
  failureCode,
  useKeepApart,
  useMergeProduct,
  useUpdateProduct,
  type ProductSummary,
} from '@/modules/expenses/api';
import { NS } from '@/modules/expenses/i18n';
import type { Match } from '@/modules/expenses/matches';

/**
 * Suggestions to combine products (and titles not followed yet) that look like one thing.
 * Each is the user's call: combine it, say the things differ (not suggested again), or skip.
 */
export function MatchesPanel({
  matches,
  products,
  onDone,
}: {
  matches: readonly Match[];
  products: readonly ProductSummary[];
  /** Combined, kept apart or skipped: take the match off the panel. */
  onDone: (key: string) => void;
}) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const merge = useMergeProduct();
  const apart = useKeepApart();
  const update = useUpdateProduct();
  const [busy, setBusy] = useState<string | null>(null);
  if (matches.length === 0) return null;

  const byId = (id: string) => products.find((item) => item.id === id);
  const nameOf = (id: string) => byId(id)?.name ?? t('prices.matches.unknown');

  async function act(
    match: Match,
    work: () => Promise<unknown>,
    done: 'prices.matches.combined' | 'prices.matches.keptApart',
  ) {
    setBusy(match.key);
    try {
      await work();
      toast(t(done, { name: nameOf(match.product_id) }), { tone: 'success' });
      onDone(match.key);
    } catch (error) {
      toast(tError(errorKey(failureCode(error) ?? 'UNKNOWN')), { tone: 'danger' });
    } finally {
      setBusy(null);
    }
  }

  const combine = (match: Match) =>
    act(
      match,
      async () => {
        // Titles first: merging adds the other products' names on the server, which an edit
        // made from this (older) list would otherwise drop.
        const target = byId(match.product_id);
        if (match.titles.length && target) {
          const aliases = [...target.aliases, ...match.titles];
          await update.mutateAsync({ id: target.id, body: { aliases } });
        }
        for (const other of match.products) {
          await merge.mutateAsync({ id: match.product_id, other });
        }
      },
      'prices.matches.combined',
    );

  const keepApart = (match: Match) =>
    act(
      match,
      async () => {
        for (const other of match.products) {
          await apart.mutateAsync({ id: match.product_id, other });
        }
      },
      'prices.matches.keptApart',
    );

  return (
    <section
      aria-labelledby="matches-title"
      className="space-y-3 rounded-3xl border border-primary/40 bg-glass p-4 shadow-sm backdrop-blur-xl"
    >
      <div>
        <h2 id="matches-title" className="font-semibold">
          {t('prices.matches.title')}
        </h2>
        <p className="text-sm text-muted">{t('prices.matches.hint')}</p>
      </div>
      <ul role="list" className="divide-y divide-border">
        {matches.map((match) => {
          const others = [
            ...match.products.map(nameOf),
            ...match.titles.map((title) => `“${title}”`),
          ];
          const target = nameOf(match.product_id);
          return (
            <li key={match.key} className="flex flex-wrap items-center gap-3 py-3">
              <p className="flex min-w-48 flex-1 flex-wrap items-center gap-1.5">
                {others.map((other) => (
                  <span key={other} className="rounded-full bg-bg px-2.5 py-0.5 text-sm">
                    {other}
                  </span>
                ))}
                <ArrowRight aria-hidden="true" className="size-4 text-muted" />
                <span className="sr-only">{t('prices.matches.into')}</span>
                <span className="font-semibold">{target}</span>
              </p>
              <span className="flex shrink-0 gap-1 max-sm:w-full max-sm:justify-end">
                <Button
                  disabled={busy !== null}
                  aria-label={t('prices.matches.combineLabel', { name: target })}
                  onClick={() => void combine(match)}
                >
                  <Combine aria-hidden="true" className="size-4" />
                  {t('prices.matches.combine')}
                </Button>
                {match.products.length > 0 && (
                  <Button
                    variant="secondary"
                    disabled={busy !== null}
                    onClick={() => void keepApart(match)}
                  >
                    {t('prices.matches.apart')}
                  </Button>
                )}
                <Button
                  variant="ghost"
                  aria-label={t('prices.matches.skipLabel', { name: target })}
                  disabled={busy !== null}
                  onClick={() => {
                    onDone(match.key);
                  }}
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
