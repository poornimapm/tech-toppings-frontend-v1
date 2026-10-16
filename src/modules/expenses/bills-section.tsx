import { CalendarClock, Plus } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { addDays, todayIn } from '@/core/utils/dates';
import { Button, EmptyState, LoadError, Skeleton } from '@/design-system';
import { BillCard } from '@/modules/expenses/bill-card';
import { useRules, type Rule } from '@/modules/expenses/bills-api';
import { NS } from '@/modules/expenses/i18n';
import { MarkPaidDialog } from '@/modules/expenses/mark-paid-dialog';
import { RepeatSuggestions } from '@/modules/expenses/repeat-suggestions';
import { RuleForm, type RuleDraft } from '@/modules/expenses/rule-form';

/** The agenda's groups, in order. */
const GROUPS = ['overdue', 'today', 'week', 'later', 'paused'] as const;
type Group = (typeof GROUPS)[number];
const WEEK = 7;

/** Where a rule sits in the agenda. One that adds its own entries is never overdue: a run that
 *  has yet to add today's will. */
function groupOf(rule: Rule, today: string): Group {
  if (!rule.active) return 'paused';
  if (rule.overdue) return 'overdue';
  if (rule.next_run <= today) return 'today';
  return rule.next_run < addDays(today, WEEK) ? 'week' : 'later';
}

/** The Plan page's bills and what repeats: an agenda by when each is next due, suggestions from
 *  the user's own entries, and setting one up, changing it or paying a bill in a dialog. */
export function BillsSection({ focus }: { focus: string | null }) {
  const { t } = useTranslation(NS);
  const today = todayIn(useSession((state) => state.user?.timezone));
  const rules = useRules();
  // null: no dialog; else a new rule (from a suggestion or not), or the id of one to change.
  const [editing, setEditing] = useState<{ id: string | null; draft: RuleDraft } | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  // Looked up as the list now is, so an open dialog always works on the latest rule.
  const find = (id: string | null): Rule | undefined => rules.data?.find((rule) => rule.id === id);
  const edited = editing && (editing.id ? find(editing.id) : null);
  const paid = find(paying);
  const add = (
    <Button
      onClick={() => {
        setEditing({ id: null, draft: { mode: 'remind' } });
      }}
    >
      <Plus aria-hidden="true" className="size-4" />
      {t('bills.add')}
    </Button>
  );

  return (
    <section aria-labelledby="bills-title" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="bills-title" className="text-xl font-semibold">
          {t('bills.title')}
        </h2>
        {rules.data && rules.data.length > 0 && add}
      </div>
      <RepeatSuggestions
        onSetUp={(draft) => {
          setEditing({ id: null, draft });
        }}
      />
      {rules.isPending ? (
        <div className="grid gap-3 md:grid-cols-2">
          {Array.from({ length: 2 }, (_, index) => (
            <Skeleton key={index} className="h-36 rounded-3xl" />
          ))}
        </div>
      ) : rules.isError ? (
        <LoadError onRetry={() => void rules.refetch()}>{t('bills.loadError')}</LoadError>
      ) : rules.data.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title={t('bills.emptyTitle')}
          body={t('bills.emptyBody')}
          action={add}
        />
      ) : (
        <>
          {GROUPS.map((group) => {
            const items = rules.data.filter((rule) => groupOf(rule, today) === group);
            if (items.length === 0) return null;
            return (
              <section key={group} aria-labelledby={`bills-${group}`} className="space-y-2">
                <h3 id={`bills-${group}`} className="text-sm font-semibold text-muted">
                  {t(`bills.groups.${group}`)}
                </h3>
                <ul role="list" className="grid gap-3 md:grid-cols-2">
                  {items.map((rule) => (
                    <li key={rule.id} className="min-w-0">
                      <BillCard
                        rule={rule}
                        focused={focus === rule.id}
                        onEdit={() => {
                          setEditing({ id: rule.id, draft: { mode: rule.mode } });
                        }}
                        onPay={() => {
                          setPaying(rule.id);
                        }}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {rules.hasNextPage && (
            <Button
              variant="secondary"
              disabled={rules.isFetchingNextPage}
              onClick={() => void rules.fetchNextPage()}
            >
              {t('list.more')}
            </Button>
          )}
        </>
      )}
      {editing && edited !== undefined && (
        <RuleForm
          // A fresh form for each rule or suggestion opened.
          key={edited?.id ?? editing.draft.suggestion?.signature ?? 'new'}
          rule={edited}
          draft={editing.draft}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
      {paid && (
        <MarkPaidDialog
          // Not keyed by due date: paying moves the bill on while the dialog closes.
          key={paid.id}
          rule={paid}
          onClose={() => {
            setPaying(null);
          }}
        />
      )}
    </section>
  );
}
