import { Minus, Pencil, Plus, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { cx } from '@/core/utils/cx';
import { displayDate, todayIn } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { Badge, Button, Meter, toast } from '@/design-system';
import { FOCUS_RING, focusId, useFocusTarget } from '@/modules/expenses/focus-target';
import { useDeleteGoal, useUndeleteGoal, type Goal } from '@/modules/expenses/goals-api';
import { NS } from '@/modules/expenses/i18n';

/** Adding money to a goal, or taking some out. */
export type MoneyMode = 'add' | 'out';

/** One goal: how much is saved, what it takes a month to get there, and money in or out. */
export function GoalCard({
  goal,
  focused,
  onEdit,
  onMoney,
}: {
  goal: Goal;
  /** A link picked this goal out (`?focus=`). */
  focused: boolean;
  onEdit: () => void;
  onMoney: (mode: MoneyMode) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const timezone = useSession((state) => state.user?.timezone);
  const remove = useDeleteGoal();
  const undelete = useUndeleteGoal();
  const ref = useFocusTarget<HTMLElement>(focused);
  const { name, currency, target_date: until } = goal;
  const money = (minor: number) => formatMoney(minor, currency, i18n.language);
  const day = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(displayDate(value));
  const byHand = goal.funding === 'manual';
  const figures = {
    pct: goal.pct,
    saved: money(goal.saved_minor),
    target: money(goal.target_minor),
  };
  const left = money(goal.left_minor);
  const plan = goal.reached
    ? null
    : goal.per_month_minor !== null && until
      ? t('goals.perMonth', { amount: money(goal.per_month_minor), date: day(until) })
      : until && until < todayIn(timezone)
        ? t('goals.late', { amount: left, date: day(until) })
        : t('goals.left', { amount: left });

  function onDelete() {
    remove.mutate(goal.id, {
      onSuccess: () => {
        toast(t('goals.deleted', { name }), {
          action: {
            label: tCommon('actions.undo'),
            onAction: () => {
              undelete.mutate(goal.id);
            },
          },
        });
      },
    });
  }

  return (
    <article
      ref={ref}
      id={focusId(goal.id)}
      aria-labelledby={`${focusId(goal.id)}-name`}
      className={cx(
        'space-y-3 rounded-3xl border border-border bg-glass p-5 shadow-sm backdrop-blur-xl',
        focused && FOCUS_RING,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`${focusId(goal.id)}-name`} className="font-semibold break-words">
            {name}
          </h3>
          <p className="text-sm text-muted">
            {byHand ? t('goals.byHand') : t('goals.since', { date: day(goal.since) })}
          </p>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {!byHand && <Badge>{t('goals.netSavings')}</Badge>}
          {goal.reached && <Badge tone="success">{t('goals.reached')}</Badge>}
        </div>
      </div>

      <Meter
        label={name}
        value={goal.saved_minor}
        max={goal.target_minor}
        valueText={t('goals.meter', figures)}
      />

      <div className="space-y-0.5">
        <p className="font-semibold tabular-nums">{t('goals.savedOf', figures)}</p>
        {plan && <p className="text-sm text-muted">{plan}</p>}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {byHand && (
          <>
            <Button
              variant="secondary"
              aria-label={t('goals.addLabel', { name })}
              onClick={() => {
                onMoney('add');
              }}
            >
              <Plus aria-hidden="true" className="size-4" />
              {t('goals.addMoney')}
            </Button>
            {goal.saved_minor > 0 && (
              <Button
                variant="ghost"
                aria-label={t('goals.takeOutLabel', { name })}
                onClick={() => {
                  onMoney('out');
                }}
              >
                <Minus aria-hidden="true" className="size-4" />
                {t('goals.takeOut')}
              </Button>
            )}
          </>
        )}
        <Button
          variant="ghost"
          className="ml-auto"
          aria-label={t('goals.editLabel', { name })}
          onClick={onEdit}
        >
          <Pencil aria-hidden="true" className="size-4" />
          {t('goals.edit')}
        </Button>
        <Button
          variant="ghost"
          aria-label={t('goals.deleteLabel', { name })}
          disabled={remove.isPending}
          onClick={onDelete}
        >
          <Trash2 aria-hidden="true" className="size-4" />
          {t('goals.delete')}
        </Button>
      </div>
    </article>
  );
}
