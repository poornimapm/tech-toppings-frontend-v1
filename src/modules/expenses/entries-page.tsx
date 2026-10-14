import { Plus, Tags, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { displayDate, todayIn, addDays } from '@/core/utils/dates';
import {
  Button,
  EmptyState,
  FilterChips,
  LoadError,
  SearchField,
  SelectField,
  Skeleton,
  toast,
} from '@/design-system';
import {
  useEntries,
  useUndeleteEntry,
  type Entry,
  type EntryFilters,
} from '@/modules/expenses/api';
import { CapturePanel } from '@/modules/expenses/capture-panel';
import { CategoriesDialog } from '@/modules/expenses/categories-dialog';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { EntryForm } from '@/modules/expenses/entry-form';
import { EntryRow } from '@/modules/expenses/entry-row';
import { NS } from '@/modules/expenses/i18n';
import { daysOf, PERIODS, toPeriod } from '@/modules/expenses/periods';
import { SectionTabs } from '@/modules/expenses/section-tabs';
import { Totals } from '@/modules/expenses/totals';

/** What the list shows. The first is the default. */
const SHOWS = ['all', 'expense', 'income', 'deleted'] as const;
type Show = (typeof SHOWS)[number];

/** Entries arrive newest day first, so the days are already together. */
function byDay(entries: readonly Entry[]): [string, Entry[]][] {
  const days = new Map<string, Entry[]>();
  for (const entry of entries) days.set(entry.date, [...(days.get(entry.date) ?? []), entry]);
  return [...days];
}

/** The user's entries: totals for what is shown, filters kept in the URL, and adding one. */
export function EntriesPage() {
  const { t, i18n } = useTranslation(NS);
  const user = useSession((state) => state.user);
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  const book = useCategoryBook();
  const undelete = useUndeleteEntry();

  const show: Show = SHOWS.find((value) => value === params.get('show')) ?? SHOWS[0];
  const period = toPeriod(params.get('period'));
  const search = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  const today = todayIn(user?.timezone);
  const filters: EntryFilters = {
    ...daysOf(period, today),
    ...(show === 'expense' || show === 'income' ? { kind: show } : {}),
    ...(show === 'deleted' ? { deleted: true } : {}),
    ...(search ? { q: search } : {}),
    ...(category ? { category_id: category } : {}),
  };
  const entries = useEntries(filters);
  const filtered = show !== 'all' || period !== PERIODS[0] || search !== '' || category !== '';

  function update(name: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(name, value);
    else next.delete(name);
    // At once, not in a transition: the search box shows the URL's value while typing.
    setParams(next, { replace: true, flushSync: true });
  }

  function dayLabel(day: string): string {
    if (day === today) return t('list.today');
    if (day === addDays(today, -1)) return t('list.yesterday');
    return new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      ...(day.slice(0, 4) === today.slice(0, 4) ? {} : { year: 'numeric' }),
    }).format(displayDate(day));
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
          <p className="mt-1 text-muted">{t('subtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={() => {
              setManaging(true);
            }}
          >
            <Tags aria-hidden="true" className="size-4" />
            {t('categories.manage')}
          </Button>
          {/* On phones the same button floats above the navigation bar, within the thumb's reach. */}
          <Button
            onClick={() => {
              setAdding(true);
            }}
            className="fixed right-4 bottom-20 z-20 size-14 rounded-full shadow-xl shadow-primary/30 sm:static sm:size-auto sm:rounded-lg sm:shadow-none"
          >
            <Plus aria-hidden="true" className="size-6 sm:size-4" />
            <span className="sr-only sm:not-sr-only">{t('add')}</span>
          </Button>
        </div>
      </header>
      <SectionTabs />

      <CapturePanel />

      {show !== 'deleted' && user && <Totals filters={filters} currency={user.base_currency} />}

      {/* One block of filters above everything they scope. */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-x-6 gap-y-3">
          <FilterChips
            label={t('filters.show')}
            value={show}
            chips={SHOWS.map((value) => ({
              value,
              label:
                value === 'all' || value === 'deleted' ? t(`filters.${value}`) : t(`kind.${value}`),
            }))}
            onChange={(value) => {
              update('show', value === SHOWS[0] ? '' : value);
            }}
          />
          <FilterChips
            label={t('filters.period')}
            value={period}
            chips={PERIODS.map((value) => ({ value, label: t(`filters.${value}`) }))}
            onChange={(value) => {
              update('period', value === PERIODS[0] ? '' : value);
            }}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-[1fr_14rem] sm:items-end">
          <SearchField
            label={t('filters.search')}
            placeholder={t('filters.searchPlaceholder')}
            value={search}
            onChange={(value) => {
              update('q', value);
            }}
          />
          <SelectField
            label={t('filters.category')}
            placeholder={t('filters.anyCategory')}
            value={category}
            options={book.categories
              .filter((item) => !item.archived || item.id === category)
              .map((item) => ({ value: item.id, label: `${item.icon} ${book.nameOf(item)}` }))}
            onChange={(event) => {
              update('category', event.target.value);
            }}
          />
        </div>
      </div>

      {entries.isPending ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, index) => (
            <Skeleton key={index} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : entries.isError ? (
        <LoadError onRetry={() => void entries.refetch()}>{t('list.loadError')}</LoadError>
      ) : entries.data.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title={t(filtered ? 'list.filteredTitle' : 'list.emptyTitle')}
          body={t(filtered ? 'list.filteredBody' : 'list.emptyBody')}
        />
      ) : (
        <div className="space-y-5">
          {byDay(entries.data).map(([day, items]) => (
            <section key={day} aria-label={dayLabel(day)}>
              <h2 className="px-2 text-sm font-semibold tracking-wide text-muted uppercase">
                {dayLabel(day)}
              </h2>
              <ul role="list" className="mt-1">
                {items.map((entry) => (
                  <EntryRow
                    key={entry.id}
                    entry={entry}
                    category={book.find(entry.category_id)}
                    categoryName={book.nameOf(book.find(entry.category_id))}
                    onUndelete={
                      entry.deleted
                        ? () => {
                            undelete.mutate(entry.id, {
                              onSuccess: () =>
                                toast(t('toast.undeleted', { title: entry.title }), {
                                  tone: 'success',
                                }),
                            });
                          }
                        : undefined
                    }
                  />
                ))}
              </ul>
            </section>
          ))}
          {entries.hasNextPage && (
            <Button
              variant="secondary"
              disabled={entries.isFetchingNextPage}
              onClick={() => void entries.fetchNextPage()}
            >
              {t('list.more')}
            </Button>
          )}
        </div>
      )}

      {adding && (
        <EntryForm
          entry={null}
          onClose={() => {
            setAdding(false);
          }}
        />
      )}
      {managing && (
        <CategoriesDialog
          onClose={() => {
            setManaging(false);
          }}
        />
      )}
    </div>
  );
}
