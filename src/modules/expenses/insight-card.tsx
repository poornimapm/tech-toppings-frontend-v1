import { RefreshCw, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAiConsent, type AgentRun } from '@/core/agents/queries';
import { textFor } from '@/core/modules/module-text';
import { fill } from '@/core/utils/fill';
import { withMoney } from '@/core/utils/money-params';
import { Badge, Button, FilterChips, LoadError, Skeleton } from '@/design-system';
import {
  useInsight,
  useRefreshInsight,
  type Insight,
  type InsightPeriod,
} from '@/modules/expenses/analytics';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { NS } from '@/modules/expenses/i18n';
import manifest from '@/modules/expenses/manifest';

const PERIODS = ['month', 'week'] as const satisfies readonly InsightPeriod[];

/** The summary in words: the AI's own, or the skill's template filled in (money and the
 *  category's name in the user's language). */
function useSummaryText() {
  const { i18n } = useTranslation(NS);
  const book = useCategoryBook();
  return (insight: Insight): string => {
    if (insight.message) return insight.message;
    const template = insight.message_code
      ? textFor(manifest, i18n.language).replies?.[insight.message_code]
      : undefined;
    if (!template) return '';
    const params = { ...insight.message_params };
    const category = book.find(typeof params.category === 'string' ? params.category : '');
    if (category) params.category = book.nameOf(category);
    return fill(template, withMoney(params, i18n.language));
  };
}

/**
 * How the week or month went, in a few sentences. Written by the AI when the user allows it
 * (kept on the server while the figures don't change), else from the skill's templates; it
 * says which, and why when neither can.
 */
export function InsightCard({ date }: { date: string }) {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const [period, setPeriod] = useState<InsightPeriod>('month');
  const insight = useInsight(period, date);
  const refresh = useRefreshInsight(period, date);
  const consent = useAiConsent();
  const words = useSummaryText();
  const found = insight.data;

  return (
    <section
      aria-labelledby="insight-title"
      className="relative overflow-hidden rounded-3xl border border-primary/30 bg-glass p-5 shadow-sm backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="insight-title" className="flex items-center gap-2 text-lg font-semibold">
          <Sparkles aria-hidden="true" className="size-5 text-primary" />
          {t(`overview.insight.${period}`)}
        </h2>
        <FilterChips
          label={t('overview.insight.period')}
          value={period}
          chips={PERIODS.map((value) => ({ value, label: t(`overview.insight.${value}Chip`) }))}
          onChange={(value) => {
            setPeriod(value);
          }}
        />
      </div>
      <div className="mt-3 min-h-12" aria-live="polite">
        {insight.isPending ? (
          <Skeleton className="h-12 rounded-xl" />
        ) : insight.isError ? (
          <LoadError onRetry={() => void insight.refetch()}>
            {t('overview.insight.error')}
          </LoadError>
        ) : found?.status === 'unavailable' ? (
          <p className="flex flex-wrap items-center gap-2 text-muted">
            {tCommon('agents.unavailable')}{' '}
            {found.reason &&
              tCommon(`agents.reason.${found.reason as NonNullable<AgentRun['reason']>}`)}
            {found.reason === 'consent' && (
              <Button
                variant="secondary"
                disabled={consent.isPending}
                onClick={() => {
                  consent.mutate(undefined, { onSuccess: () => void insight.refetch() });
                }}
              >
                {tCommon('agents.enable')}
              </Button>
            )}
          </p>
        ) : (
          found && <p className="text-lg leading-relaxed text-balance">{words(found)}</p>
        )}
      </div>
      {found && found.status !== 'unavailable' && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-muted">
          <Badge tone={found.mode === 'agent' ? 'beta' : 'neutral'}>
            {t(found.mode === 'agent' ? 'overview.insight.byAi' : 'overview.insight.byRules')}
          </Badge>
          <Button
            variant="ghost"
            disabled={refresh.isPending}
            onClick={() => {
              refresh.mutate();
            }}
          >
            <RefreshCw aria-hidden="true" className="size-4" />
            {t('overview.insight.refresh')}
          </Button>
        </div>
      )}
    </section>
  );
}
