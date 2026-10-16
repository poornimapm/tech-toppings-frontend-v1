import { Download, FileUp, ListChecks, Plus, Tags, Wallet, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useSearchParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
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
  failureCode,
  useUndeleteEntry,
  type Entry,
  type EntryFilters,
} from '@/modules/expenses/api';
import { BulkBar } from '@/modules/expenses/bulk-bar';
import { CapturePanel } from '@/modules/expenses/capture-panel';
import { CategoriesDialog } from '@/modules/expenses/categories-dialog';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { EntryForm } from '@/modules/expenses/entry-form';
import { EntryRow } from '@/modules/expenses/entry-row';
import { useSaveCsv } from '@/modules/expenses/export-csv';
import { NS } from '@/modules/expenses/i18n';
import { daysOf, PERIODS, toPeriod } from '@/modules/expenses/periods';
import { paths } from '@/modules/expenses/paths';
import { SavedViews } from '@/modules/expenses/saved-views';
import { SectionTabs } from '@/modules/expenses/section-tabs';
import { Totals } from '@/modules/expenses/totals';

/** What the list shows. The first is the default. */
const SHOWS = ['all', 'expense', 'income', 'deleted'] as const;
/** The period chip for days a chart chose (from/to in the URL). */
const CUSTOM = 'custom';
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
  const { t: tError } = useTranslation('errors');
  const user = useSession((state) => state.user);
  const saveCsv = useSaveCsv();
  const [params, setParams] = useSearchParams();
  const [adding, setAdding] = useState(false);
  const [managing, setManaging] = useState(false);
  // Choosing entries for one change to all of them; only those still on the list count.
  const [selecting, setSelecting] = useState(false);
  const [chosen, setChosen] = useState<string[]>([]);
  const book = useCategoryBook();
  const undelete = useUndeleteEntry();

  const show: Show = SHOWS.find((value) => value === params.get('show')) ?? SHOWS[0];
  const period = toPeriod(params.get('period'));
  const search = params.get('q') ?? '';
  const category = params.get('category') ?? '';
  // What a chart or a budget drills into: its own days, a tag, a person or a place (paths.list).
  const from = params.get('from') ?? '';
  const to = params.get('to') ?? '';
  const tag = params.get('tag') ?? '';
  const person = params.get('person') ?? '';
  const merchant = params.get('merchant') ?? '';
  const custom = from !== '' || to !== '';
  const today = todayIn(user?.timezone);
  const filters: EntryFilters = {
    ...(custom ? { ...(from ? { from } : {}), ...(to ? { to } : {}) } : daysOf(period, today)),
    ...(show === 'expense' || show === 'income' ? { kind: show } : {}),
    ...(show === 'deleted' ? { deleted: true } : {}),
    ...(search ? { q: search } : {}),
    ...(category ? { category_id: category } : {}),
    ...(tag ? { tag } : {}),
    ...(person ? { for_whom: person } : {}),
    ...(merchant ? { merchant } : {}),
  };
  const entries = useEntries(filters);
  const shown = entries.data ?? [];
  const picked = chosen.filter((id) => shown.some((entry) => entry.id === id));
  const filtered =
    show !== 'all' ||
    period !== PERIODS[0] ||
    [search, category, from, to, tag, person, merchant].some((value) => value !== '');

  function update(changes: Record<string, string>) {
    const next = new URLSearchParams(params);
    for (const [name, value] of Object.entries(changes)) {
      if (value) next.set(name, value);
      else next.delete(name);
    }
    // At once, not in a transition: the search box shows the URL's value while typing.
    setParams(next, { replace: true, flushSync: true });
  }

  const shortDay = (day: string) =>
    new Intl.DateTimeFormat(i18n.language, { day: 'numeric', month: 'short' }).format(
      displayDate(day),
    );
  // Only for days a chart chose: there is no label (or date) to format otherwise.
  const rangeLabel = !custom
    ? ''
    : from === to
      ? shortDay(from)
      : `${shortDay(from || to)} – ${shortDay(to || from)}`;
  const pills = [
    tag && { name: 'tag', label: t('filters.tagged', { tag }) },
    person && { name: 'person', label: t('filters.forPerson', { name: person }) },
    merchant && { name: 'merchant', label: t('filters.atPlace', { place: merchant }) },
  ].filter((pill): pill is { name: string; label: string } => typeof pill === 'object');

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
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            disabled={saveCsv.isPending}
            onClick={() => {
              saveCsv.mutate(filters, {
                onSuccess: (name) => toast(t('export.done', { name }), { tone: 'success' }),
                onError: (error) =>
                  toast(tError(errorKey(failureCode(error) ?? 'UNKNOWN')), {
                    tone: 'danger',
                  }),
              });
            }}
          >
            <Download aria-hidden="true" className="size-4" />
            {t('export.button')}
          </Button>
          <Link
            to={paths.import}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-text transition-colors hover:bg-bg"
          >
            <FileUp aria-hidden="true" className="size-4" />
            {t('import.open')}
          </Link>
          <Button
            variant="secondary"
            aria-pressed={selecting}
            onClick={() => {
              setSelecting(!selecting);
              setChosen([]);
            }}
          >
            <ListChecks aria-hidden="true" className="size-4" />
            {t('bulk.select')}
          </Button>
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
        <SavedViews
          params={params}
          filtered={filtered}
          onOpen={(query) => {
            setParams(query, { replace: true });
          }}
        />
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
              update({ show: value === SHOWS[0] ? '' : value });
            }}
          />
          <FilterChips
            label={t('filters.period')}
            value={custom ? CUSTOM : period}
            chips={[
              ...PERIODS.map((value) => ({ value, label: t(`filters.${value}`) })),
              ...(custom ? [{ value: CUSTOM, label: rangeLabel }] : []),
            ]}
            onChange={(value) => {
              if (value === CUSTOM) return;
              update({ period: value === PERIODS[0] ? '' : value, from: '', to: '' });
            }}
          />
        </div>
        {pills.length > 0 && (
          <ul role="list" className="flex flex-wrap gap-2">
            {pills.map((pill) => (
              <li key={pill.name}>
                <button
                  type="button"
                  aria-label={t('filters.clear', { filter: pill.label })}
                  onClick={() => {
                    update({ [pill.name]: '' });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 py-1 pr-2 pl-3 text-sm font-medium hover:bg-primary/15"
                >
                  {pill.label}
                  <X aria-hidden="true" className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="grid gap-3 sm:grid-cols-[1fr_14rem] sm:items-end">
          <SearchField
            label={t('filters.search')}
            placeholder={t('filters.searchPlaceholder')}
            value={search}
            onChange={(value) => {
              update({ q: value });
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
              update({ category: event.target.value });
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
                    selection={
                      selecting
                        ? {
                            selected: picked.includes(entry.id),
                            onToggle: () => {
                              setChosen(
                                picked.includes(entry.id)
                                  ? picked.filter((id) => id !== entry.id)
                                  : [...picked, entry.id],
                              );
                            },
                          }
                        : undefined
                    }
                    onUndelete={
                      !selecting && entry.deleted
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

      {selecting && (
        <BulkBar
          shown={shown}
          chosen={picked}
          deleted={show === 'deleted'}
          onChoose={setChosen}
          onClose={() => {
            setSelecting(false);
            setChosen([]);
          }}
        />
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
