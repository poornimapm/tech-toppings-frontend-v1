import { Pencil, ReceiptText, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { cx } from '@/core/utils/cx';
import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { Badge, Button, Meter, toast, type BadgeTone } from '@/design-system';
import { useDeleteBudget, type Budget } from '@/modules/expenses/budgets-api';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { CONFIRM_TRIGGER, useConfirmFocus } from '@/modules/expenses/confirm-focus';
import { FOCUS_RING, focusId, useFocusTarget } from '@/modules/expenses/focus-target';
import { NS } from '@/modules/expenses/i18n';
import { paths } from '@/modules/expenses/paths';

type State = Budget['status']['state'];

const TONES: Record<State, BadgeTone> = {
  ok: 'success',
  near: 'soon',
  over: 'soon',
  upcoming: 'neutral',
  ended: 'neutral',
};

/** Under way: counting today's spending, so pace and what is left a day mean something. */
const running = (state: State) => state === 'ok' || state === 'near' || state === 'over';

/** One budget: how much of it is spent, at what pace, and the entries behind the figure. */
export function BudgetCard({
  budget,
  focused,
  onEdit,
}: {
  budget: Budget;
  /** A link picked this budget out (`?focus=`). */
  focused: boolean;
  onEdit: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const book = useCategoryBook();
  const remove = useDeleteBudget();
  const [deleting, setDeleting] = useState(false);
  const ref = useFocusTarget<HTMLElement>(focused);
  const confirmRef = useConfirmFocus<HTMLDivElement>(deleting);
  const { status, currency, name } = budget;
  const money = (minor: number) => formatMoney(minor, currency, i18n.language);
  const day = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
      displayDate(value),
    );
  const category = budget.category_id ? book.find(budget.category_id) : undefined;
  const counts =
    budget.scope === 'category'
      ? `${category?.icon ?? ''} ${book.nameOf(category)}`.trim()
      : budget.scope === 'tag'
        ? t('budgets.tag', { tag: budget.tag ?? '' })
        : t('budgets.overall');
  const figures = {
    pct: status.pct,
    spent: money(status.spent_minor),
    limit: money(budget.limit_minor),
  };
  const ahead = running(status.state) && status.spent_minor > status.pace_minor;
  const stateText = {
    ok: t('budgets.state.ok'),
    near: t('budgets.state.near'),
    over: t('budgets.state.over'),
    upcoming: t('budgets.state.upcoming', { date: day(status.start) }),
    ended: t('budgets.state.ended', { date: day(status.end) }),
  }[status.state];

  return (
    <article
      ref={ref}
      id={focusId(budget.id)}
      aria-labelledby={`${focusId(budget.id)}-name`}
      className={cx(
        'space-y-3 rounded-3xl border border-border bg-glass p-5 shadow-sm backdrop-blur-xl',
        focused && FOCUS_RING,
      )}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 id={`${focusId(budget.id)}-name`} className="font-semibold break-words">
            {name}
          </h3>
          <p className="text-sm text-muted">
            {counts} · {day(status.start)} – {day(status.end)}
          </p>
        </div>
        <Badge tone={TONES[status.state]}>{stateText}</Badge>
      </div>

      <Meter
        label={name}
        value={status.spent_minor}
        max={budget.limit_minor}
        tone={status.left_minor <= 0 ? 'over' : 'default'}
        marker={running(status.state) ? status.pace_minor : undefined}
        valueText={t(ahead ? 'budgets.meterAhead' : 'budgets.meter', figures)}
      />

      <div className="space-y-0.5">
        <p className="font-semibold tabular-nums">
          {t('budgets.spentOf', figures)}
          {status.left_minor < 0 && (
            <span className="font-normal">
              {' '}
              · {t('budgets.overBy', { amount: money(-status.left_minor) })}
            </span>
          )}
        </p>
        {running(status.state) && status.left_minor > 0 && (
          <p className="text-sm text-muted">
            {t('budgets.perDay', {
              amount: money(status.per_day_left_minor),
              count: status.days_left,
            })}
          </p>
        )}
        {ahead && (
          <p className="text-sm text-muted">
            {t('budgets.ahead', { amount: money(status.pace_minor) })}
          </p>
        )}
      </div>

      <div ref={confirmRef}>
        {deleting ? (
          <div role="alert" className="flex flex-wrap items-center gap-2">
            <p className="flex-1 text-sm">{t('budgets.confirm', { name })}</p>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleting(false);
              }}
            >
              {t('budgets.no')}
            </Button>
            <Button
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(budget.id, {
                  onSuccess: () => toast(t('budgets.deleted', { name }), { tone: 'success' }),
                });
              }}
            >
              {t('budgets.yes')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Link
              to={paths.list({
                show: 'expense',
                from: status.start,
                to: status.end,
                category: budget.category_id ?? undefined,
                tag: budget.tag ?? undefined,
              })}
              aria-label={t('budgets.entriesLabel', { name })}
              className="mr-auto inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
            >
              <ReceiptText aria-hidden="true" className="size-4" />
              {t('budgets.entries')}
            </Link>
            <Button variant="ghost" aria-label={t('budgets.editLabel', { name })} onClick={onEdit}>
              <Pencil aria-hidden="true" className="size-4" />
              {t('budgets.edit')}
            </Button>
            <Button
              variant="ghost"
              aria-label={t('budgets.deleteLabel', { name })}
              {...CONFIRM_TRIGGER}
              onClick={() => {
                setDeleting(true);
              }}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {t('budgets.delete')}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
