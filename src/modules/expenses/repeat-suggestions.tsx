import { BellRing, Repeat, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { displayDate } from '@/core/utils/dates';
import { formatMoney } from '@/core/utils/money';
import { Button, toast } from '@/design-system';
import { useDismissSuggestion, useSuggestions } from '@/modules/expenses/bills-api';
import { NS } from '@/modules/expenses/i18n';
import type { RuleDraft } from '@/modules/expenses/rule-form';

/**
 * "Looks like it repeats": what the user's own entries repeat at a steady pace. Each is the
 * user's call: be reminded of it, have it added by itself (both open the form, filled in), or
 * say it isn't regular (not suggested again). Out of the way while there is nothing to say.
 */
export function RepeatSuggestions({ onSetUp }: { onSetUp: (draft: RuleDraft) => void }) {
  const { t, i18n } = useTranslation(NS);
  const suggestions = useSuggestions();
  const dismiss = useDismissSuggestion();
  if (!suggestions.data?.length) return null;
  const day = (value: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
      displayDate(value),
    );

  return (
    <section
      aria-labelledby="repeats-title"
      className="space-y-3 rounded-3xl border border-primary/40 bg-glass p-4 shadow-sm backdrop-blur-xl"
    >
      <div>
        <h3 id="repeats-title" className="font-semibold">
          {t('bills.suggestions.title')}
        </h3>
        <p className="text-sm text-muted">{t('bills.suggestions.hint')}</p>
      </div>
      <ul role="list" className="divide-y divide-border">
        {suggestions.data.map((item) => {
          const title = item.template.title;
          return (
            <li key={item.signature} className="flex flex-wrap items-center gap-3 py-3">
              <div className="min-w-48 flex-1">
                <p className="font-semibold break-words">
                  {title} · {formatMoney(item.template.amount_minor, item.currency, i18n.language)}
                </p>
                <p className="text-sm text-muted">
                  {t(`bills.every.${item.cadence.unit}`, { count: item.cadence.every })} ·{' '}
                  {t('bills.suggestions.seen', { count: item.count, date: day(item.last_on) })}
                </p>
              </div>
              <span className="flex shrink-0 flex-wrap gap-1 max-sm:w-full max-sm:justify-end">
                <Button
                  aria-label={t('bills.suggestions.remindLabel', { title })}
                  onClick={() => {
                    onSetUp({ suggestion: item, mode: 'remind' });
                  }}
                >
                  <BellRing aria-hidden="true" className="size-4" />
                  {t('bills.suggestions.remind')}
                </Button>
                <Button
                  variant="secondary"
                  aria-label={t('bills.suggestions.autoLabel', { title })}
                  onClick={() => {
                    onSetUp({ suggestion: item, mode: 'auto_create' });
                  }}
                >
                  <Repeat aria-hidden="true" className="size-4" />
                  {t('bills.suggestions.auto')}
                </Button>
                <Button
                  variant="ghost"
                  aria-label={t('bills.suggestions.dismissLabel', { title })}
                  disabled={dismiss.isPending}
                  onClick={() => {
                    dismiss.mutate(item.signature, {
                      onSuccess: () =>
                        toast(t('bills.suggestions.dismissed', { title }), { tone: 'success' }),
                    });
                  }}
                >
                  <X aria-hidden="true" className="size-4" />
                  {t('bills.suggestions.dismiss')}
                </Button>
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
