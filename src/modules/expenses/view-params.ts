import type { components } from '@/core/api/schema';
import { PERIODS, type Period } from '@/modules/expenses/periods';
import type { SavedView } from '@/modules/expenses/saved-filters-api';

type ViewPeriod = components['schemas']['ViewPeriod'];

/** The list's period chips as a view names them. */
const PERIOD_OF: Record<Period, ViewPeriod> = {
  thisMonth: 'this_month',
  lastMonth: 'last_month',
  last90: 'last_90_days',
  allTime: 'all_time',
};
const SHOWS = ['all', 'expense', 'income', 'deleted'] as const;
/** Filters kept under the same name in the URL and the view: [URL name, view name]. */
const SAME = [
  ['q', 'q'],
  ['category', 'category_id'],
  ['tag', 'tag'],
  ['person', 'for_whom'],
  ['merchant', 'merchant'],
] as const;

/** The list's URL query as a view to save, written as the server keeps it. */
export function viewOf(params: URLSearchParams): SavedView {
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const period = PERIODS.find((value) => value === params.get('period')) ?? PERIODS[0];
  const view: SavedView = {
    show: SHOWS.find((value) => value === params.get('show')) ?? 'all',
    ...(from || to ? { from: from || null, to: to || null } : { period: PERIOD_OF[period] }),
  };
  for (const [name, field] of SAME) {
    const value = params.get(name)?.trim();
    if (value) view[field] = field === 'tag' ? value.toLowerCase() : value;
  }
  return view;
}

/** A view as the list's URL query; the list's defaults are left out, as the list leaves them. */
export function paramsOf(view: SavedView): URLSearchParams {
  const params = new URLSearchParams();
  if (view.show !== 'all') params.set('show', view.show);
  const period = PERIODS.find((value) => PERIOD_OF[value] === view.period);
  if (period && period !== PERIODS[0]) params.set('period', period);
  if (view.from) params.set('from', view.from);
  if (view.to) params.set('to', view.to);
  for (const [name, field] of SAME) {
    const value = view[field];
    if (value) params.set(name, value);
  }
  return params;
}

/** Whether the list shows this view now (whatever order the URL has its filters in). */
export function showsView(params: URLSearchParams, view: SavedView): boolean {
  return paramsOf(viewOf(params)).toString() === paramsOf(view).toString();
}
