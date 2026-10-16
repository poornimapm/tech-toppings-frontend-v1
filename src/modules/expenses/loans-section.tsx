import { HandCoins, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { todayIn } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { relativeDay } from '@/core/utils/relative-time';
import { Badge, Button, EmptyState, LoadError, Skeleton } from '@/design-system';
import { NS } from '@/modules/expenses/i18n';
import { IouForm } from '@/modules/expenses/iou-form';
import { useIou, useIouSummary, type PersonBalance } from '@/modules/expenses/ious-api';
import { useLoanWords } from '@/modules/expenses/loan-words';
import { PersonSheet } from '@/modules/expenses/person-sheet';

/** The two tiles: what is owed to the user, and what they owe. */
const TILES = [
  ['owedToYou', 'owed_to_me_minor'],
  ['youOwe', 'i_owe_minor'],
] as const;

/**
 * The Plan page's loans: what is owed each way, then everyone the user has lent to or borrowed
 * from, each opening a sheet of the loans between them. A link's `?focus=<iou_id>` opens the
 * sheet of that loan's person.
 */
export function LoansSection({ focus }: { focus: string | null }) {
  const { t, i18n } = useTranslation(NS);
  const summary = useIouSummary();
  const linked = useIou(focus);
  // undefined: as the link says; null: no sheet; else the person shown (their name as compared).
  const [chosen, setChosen] = useState<string | null | undefined>(undefined);
  const [adding, setAdding] = useState(false);
  const person = chosen === undefined ? (linked.data?.counterparty_key ?? null) : chosen;
  const name =
    summary.data?.people.find((item) => item.key === person)?.name ?? linked.data?.counterparty;
  const add = (
    <Button
      onClick={() => {
        setAdding(true);
      }}
    >
      <Plus aria-hidden="true" className="size-4" />
      {t('loans.add')}
    </Button>
  );

  return (
    <section aria-labelledby="loans-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="loans-title" className="text-xl font-semibold">
          {t('loans.title')}
        </h2>
        {summary.data && summary.data.people.length > 0 && add}
      </div>
      {summary.isPending ? (
        <div className="grid grid-cols-2 gap-3">
          {TILES.map(([label]) => (
            <Skeleton key={label} className="h-24 rounded-3xl" />
          ))}
        </div>
      ) : summary.isError ? (
        <LoadError onRetry={() => void summary.refetch()}>{t('loans.loadError')}</LoadError>
      ) : summary.data.people.length === 0 ? (
        <EmptyState
          icon={HandCoins}
          title={t('loans.emptyTitle')}
          body={t('loans.emptyBody')}
          action={add}
        />
      ) : (
        <>
          <dl className="grid grid-cols-2 gap-3">
            {TILES.map(([label, field]) => (
              <div
                key={label}
                className="min-w-0 rounded-3xl border border-border bg-glass p-4 shadow-sm backdrop-blur-xl"
              >
                <dt className="text-sm font-medium text-muted">{t(`loans.${label}`)}</dt>
                <dd className="mt-1 text-xl font-semibold tracking-tight break-words tabular-nums sm:text-2xl">
                  {formatMoney(summary.data[field], summary.data.currency, i18n.language)}
                </dd>
              </div>
            ))}
          </dl>
          <section aria-labelledby="loans-people" className="space-y-2">
            <h3 id="loans-people" className="text-sm font-semibold text-muted">
              {t('loans.people')}
            </h3>
            <ul role="list" className="grid gap-3 md:grid-cols-2">
              {summary.data.people.map((balance) => (
                <li key={balance.key} className="min-w-0">
                  <PersonRow
                    balance={balance}
                    currency={summary.data.currency}
                    onOpen={() => {
                      setChosen(balance.key);
                    }}
                  />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
      {person && name && (
        <PersonSheet
          key={person}
          person={person}
          name={name}
          focus={focus}
          onClose={() => {
            setChosen(null);
          }}
        />
      )}
      {adding && (
        <IouForm
          iou={null}
          onClose={() => {
            setAdding(false);
          }}
        />
      )}
    </section>
  );
}

/** One person: where the user stands with them, how many loans are open, and the next due
 *  date (or how long ago it passed). Opens their sheet. */
function PersonRow({
  balance,
  currency,
  onOpen,
}: {
  balance: PersonBalance;
  currency: string;
  onOpen: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const today = todayIn(useSession((state) => state.user?.timezone));
  const words = useLoanWords();
  const id = useId();
  const due = balance.next_due_on && relativeDay(balance.next_due_on, today, i18n.language);
  const details =
    balance.open > 0
      ? [
          t('loans.open', { count: balance.open }),
          due && t(balance.overdue ? 'loans.wasDue' : 'loans.nextDue', { when: due }),
        ]
          .filter(Boolean)
          .join(' · ')
      : '';

  return (
    // Named by the person; where the user stands with them is its description.
    <button
      type="button"
      aria-haspopup="dialog"
      aria-labelledby={`${id}-name`}
      aria-describedby={details ? `${id}-net ${id}-details` : `${id}-net`}
      onClick={onOpen}
      className="flex w-full items-center gap-3 rounded-3xl border border-border bg-glass p-4 text-left shadow-sm backdrop-blur-xl transition-colors hover:bg-surface"
    >
      <span
        aria-hidden="true"
        style={{ background: 'var(--tt-accent-amber-soft)', color: 'var(--tt-accent-amber)' }}
        className="grid size-10 shrink-0 place-items-center rounded-2xl"
      >
        <HandCoins className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span id={`${id}-name`} className="font-semibold break-words">
            {balance.name}
          </span>
          {balance.overdue && <Badge tone="soon">{t('loans.overdue')}</Badge>}
        </span>
        <span id={`${id}-net`} className="block text-sm font-semibold tabular-nums">
          {words.net(balance, currency)}
        </span>
        {details && (
          <span id={`${id}-details`} className="block text-sm text-muted">
            {details}
          </span>
        )}
      </span>
    </button>
  );
}
