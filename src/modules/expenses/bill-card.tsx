import { Check, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { cx } from '@/core/utils/cx';
import { todayIn } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { relativeDay } from '@/core/utils/relative-time';
import { Badge, Button, Switch, toast } from '@/design-system';
import { useDeleteRule, useSwitchRule, type Rule } from '@/modules/expenses/bills-api';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { CategoryIcon } from '@/modules/expenses/category-icon';
import { CONFIRM_TRIGGER, useConfirmFocus } from '@/modules/expenses/confirm-focus';
import { FOCUS_RING, focusId, useFocusTarget } from '@/modules/expenses/focus-target';
import { NS } from '@/modules/expenses/i18n';

/** One rule: what, how much, how often and when next; paying a bill, pausing, changing or
 *  deleting it. */
export function BillCard({
  rule,
  focused,
  onEdit,
  onPay,
}: {
  rule: Rule;
  /** A link picked this rule out (`?focus=`). */
  focused: boolean;
  onEdit: () => void;
  onPay: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const today = todayIn(useSession((state) => state.user?.timezone));
  const book = useCategoryBook();
  const switchRule = useSwitchRule();
  const remove = useDeleteRule();
  const [deleting, setDeleting] = useState(false);
  const ref = useFocusTarget<HTMLElement>(focused);
  const confirmRef = useConfirmFocus<HTMLDivElement>(deleting);
  const { template, cadence } = rule;
  const title = template.title;
  const bill = rule.mode === 'remind';
  const when = relativeDay(rule.next_run, today, i18n.language);
  const next = !rule.active
    ? t('bills.pausedHint')
    : bill
      ? t(rule.overdue ? 'bills.overdue' : 'bills.due', { when })
      : t('bills.adds', { when });
  const nameId = `${focusId(rule.id)}-name`;

  return (
    <article
      ref={ref}
      id={focusId(rule.id)}
      aria-labelledby={nameId}
      className={cx(
        'space-y-3 rounded-3xl border border-border bg-glass p-4 shadow-sm backdrop-blur-xl',
        focused && FOCUS_RING,
      )}
    >
      <div className="flex items-start gap-3">
        <CategoryIcon category={book.find(template.category_id)} />
        <div className="min-w-0 flex-1">
          <h4 id={nameId} className="font-semibold break-words">
            {title}
          </h4>
          <p className="text-sm text-muted">
            {t(`bills.every.${cadence.unit}`, { count: cadence.every })} ·{' '}
            <span className={cx(rule.overdue && rule.active && 'font-semibold text-text')}>
              {next}
            </span>
          </p>
        </div>
        <p className="shrink-0 font-semibold tabular-nums">
          {template.kind === 'income' ? '+' : '−'}
          {formatMoney(template.amount_minor, rule.currency, i18n.language)}
        </p>
      </div>

      <div ref={confirmRef}>
        {deleting ? (
          <div role="alert" className="flex flex-wrap items-center gap-2">
            <p className="flex-1 text-sm">
              {/* Deleting one set up from a suggestion says it isn't regular too. */}
              {t(rule.source === 'detected' ? 'bills.confirmDetected' : 'bills.confirm', { title })}
            </p>
            <Button
              variant="secondary"
              onClick={() => {
                setDeleting(false);
              }}
            >
              {t('bills.no')}
            </Button>
            <Button
              disabled={remove.isPending}
              onClick={() => {
                remove.mutate(rule.id, {
                  onSuccess: () => toast(t('bills.deleted', { title }), { tone: 'success' }),
                });
              }}
            >
              {t('bills.yes')}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={bill ? 'soon' : 'neutral'}>{t(`bills.mode.${rule.mode}`)}</Badge>
            {bill && rule.active && (
              <Button aria-label={t('bills.paidLabel', { title })} onClick={onPay}>
                <Check aria-hidden="true" className="size-4" />
                {t('bills.paid')}
              </Button>
            )}
            <div className="ml-auto">
              <Switch
                label={
                  <>
                    <span aria-hidden="true">{t('bills.active')}</span>
                    <span className="sr-only">{t('bills.activeLabel', { title })}</span>
                  </>
                }
                checked={rule.active}
                disabled={switchRule.isPending}
                onCheckedChange={(active) => {
                  switchRule.mutate(
                    { id: rule.id, active },
                    {
                      onSuccess: () =>
                        toast(t(active ? 'bills.resumed' : 'bills.paused', { title }), {
                          tone: 'success',
                        }),
                    },
                  );
                }}
              />
            </div>
            <Button variant="ghost" aria-label={t('bills.editLabel', { title })} onClick={onEdit}>
              <Pencil aria-hidden="true" className="size-4" />
              {t('bills.edit')}
            </Button>
            <Button
              variant="ghost"
              aria-label={t('bills.deleteLabel', { title })}
              {...CONFIRM_TRIGGER}
              onClick={() => {
                setDeleting(true);
              }}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {t('bills.delete')}
            </Button>
          </div>
        )}
      </div>
    </article>
  );
}
