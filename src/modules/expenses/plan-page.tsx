import type { ComponentType } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { FilterChips } from '@/design-system';
import { BillsSection } from '@/modules/expenses/bills-section';
import { BudgetsSection } from '@/modules/expenses/budgets-section';
import { GoalsSection } from '@/modules/expenses/goals-section';
import { NS } from '@/modules/expenses/i18n';
import { LoansSection } from '@/modules/expenses/loans-section';
import type { PlanSection } from '@/modules/expenses/paths';
import { SectionTabs } from '@/modules/expenses/section-tabs';

/** Each section of the page; the first is shown when the URL names none. */
const SECTIONS: Record<PlanSection, ComponentType<{ focus: string | null }>> = {
  budgets: BudgetsSection,
  bills: BillsSection,
  goals: GoalsSection,
  loans: LoansSection,
};
const NAMES = Object.keys(SECTIONS) as PlanSection[];

/**
 * What the user plans: budgets, bills, goals and loans. The section shown is kept in
 * `?show`; `?focus=<id>` (a notification's link) picks out one card, scrolled to and ringed.
 */
export function PlanPage() {
  const { t } = useTranslation(NS);
  const [params, setParams] = useSearchParams();
  const show = NAMES.find((name) => name === params.get('show')) ?? 'budgets';
  const Section = SECTIONS[show];

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('plan.title')}</h1>
          <p className="mt-1 text-muted">{t('plan.subtitle')}</p>
        </div>
        <SectionTabs />
        {NAMES.length > 1 && (
          <FilterChips
            label={t('plan.sections')}
            value={show}
            chips={NAMES.map((name) => ({ value: name, label: t(`plan.show.${name}`) }))}
            onChange={(name) => {
              setParams({ show: name }, { replace: true });
            }}
          />
        )}
      </header>
      <Section focus={params.get('focus')} />
    </div>
  );
}
