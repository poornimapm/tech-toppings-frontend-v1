import { Check, SearchX, SlidersHorizontal, Star } from 'lucide-react';
import { AnimatePresence, LayoutGroup, m } from 'motion/react';
import { useId, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { matchesSearch } from '@/core/modules/module-text';
import { useModuleTiles } from '@/core/modules/queries';
import type { ModuleTile as Tile } from '@/core/modules/types';
import { Button, EmptyState, FilterChips, LoadError, SearchField, Skeleton } from '@/design-system';
import { ArrangeBoard } from '@/platform/welcome/arrange-board';
import { AuroraBackground } from '@/platform/welcome/aurora-background';
import { formatToday, partOfDay } from '@/platform/welcome/greeting';
import { ModuleDetailsDialog } from '@/platform/welcome/module-details-dialog';
import { accentStyle } from '@/platform/welcome/module-style';
import { ModuleTile } from '@/platform/welcome/module-tile';
import { ModuleIcon } from '@/platform/welcome/module-visuals';
import { SystemStatusPill } from '@/platform/welcome/system-status-pill';
import { useModuleActions } from '@/platform/welcome/use-module-actions';

const FILTERS = ['all', 'favourites', 'available', 'soon'] as const;
type Filter = (typeof FILTERS)[number];

const MATCHES: Record<Filter, (tile: Tile) => boolean> = {
  all: () => true,
  favourites: (tile) => tile.view.pinned,
  available: (tile) => tile.view.available,
  soon: (tile) => tile.view.status === 'coming_soon',
};

function toFilter(value: string | null): Filter {
  return FILTERS.find((filter) => filter === value) ?? 'all';
}

const GRID = 'grid gap-4 sm:grid-cols-2 lg:grid-cols-3';

function Section({ title, children }: { title: string; children: ReactNode }) {
  const headingId = useId();
  return (
    <m.section layout="position" aria-labelledby={headingId} className="space-y-3">
      <h2 id={headingId} className="text-sm font-semibold tracking-wide text-muted uppercase">
        {title}
      </h2>
      {children}
    </m.section>
  );
}

function TileGrid({
  tiles,
  onOpenDetails,
  onTogglePin,
}: {
  tiles: Tile[];
  onOpenDetails: (tile: Tile) => void;
  onTogglePin: (tile: Tile) => void;
}) {
  return (
    <ul role="list" className={GRID}>
      <AnimatePresence mode="popLayout" initial={false}>
        {tiles.map((tile, index) => (
          <ModuleTile
            key={tile.view.key}
            tile={tile}
            index={index}
            onOpenDetails={onOpenDetails}
            onTogglePin={onTogglePin}
          />
        ))}
      </AnimatePresence>
    </ul>
  );
}

function LoadingTiles() {
  return (
    <div className={GRID}>
      {Array.from({ length: 6 }, (_, index) => (
        <Skeleton key={index} className="h-48 rounded-3xl" />
      ))}
    </div>
  );
}

export function WelcomePage() {
  const { t, i18n } = useTranslation();
  const user = useSession((state) => state.user);
  const { tiles, isPending, isError, refetch } = useModuleTiles();
  const actions = useModuleActions();
  const [params, setParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [arranging, setArranging] = useState(false);

  // Search, filter and the open module live in the URL: shareable, and Back closes details.
  const query = params.get('q') ?? '';
  const filter = toFilter(params.get('show'));
  const detailsKey = params.get('module');
  const [shownKey, setShownKey] = useState(detailsKey);
  if (detailsKey && detailsKey !== shownKey) setShownKey(detailsKey); // kept while closing
  function updateParams(changes: Record<string, string>, push = false) {
    const next = new URLSearchParams(params);
    for (const [name, value] of Object.entries(changes)) {
      if (value && value !== 'all') next.set(name, value);
      else next.delete(name);
    }
    // Replacements (typing, filters) apply at once: the search box shows the URL's value, and
    // a keystroke that waited for a transition would be overwritten by the next one.
    setParams(next, push ? { state: { openedHere: true } } : { replace: true, flushSync: true });
  }

  const now = new Date();
  const greeting = t(`welcome.greeting.${partOfDay(now, user?.timezone)}`, {
    name: user?.name ?? '',
  });
  const today = formatToday(now, i18n.language, user?.timezone);

  const visible = tiles.filter((tile) => tile.view.enabled);
  const hidden = tiles.filter((tile) => !tile.view.enabled);
  const searched = visible.filter((tile) => matchesSearch(tile, query));
  const shown = searched.filter(MATCHES[filter]);
  const favourites = shown.filter((tile) => tile.view.pinned);
  const others = shown.filter((tile) => !tile.view.pinned);
  const chips = FILTERS.map((value) => ({
    value,
    label: t(`welcome.filters.${value}`),
    count: searched.filter(MATCHES[value]).length,
  }));
  const selected = tiles.find((tile) => tile.view.key === shownKey) ?? null;

  const openDetails = (tile: Tile) => {
    updateParams({ module: tile.view.key }, true);
  };
  const togglePin = (tile: Tile) => {
    actions.setPinned(tile, !tile.view.pinned);
  };

  let content: ReactNode;
  if (isPending) {
    content = <LoadingTiles />;
  } else if (isError) {
    content = <LoadError onRetry={() => void refetch()}>{t('welcome.loadError')}</LoadError>;
  } else if (arranging) {
    content = (
      <div className="space-y-3">
        <p className="text-sm text-muted">{t('welcome.arrangeHint')}</p>
        <ArrangeBoard
          tiles={tiles}
          onArrange={actions.arrange}
          onToggleVisible={(tile) => {
            actions.setVisible(tile, !tile.view.enabled);
          }}
        />
      </div>
    );
  } else if (shown.length === 0) {
    content = query ? (
      <EmptyState
        icon={SearchX}
        title={t('welcome.empty.title', { query })}
        body={t('welcome.empty.body')}
        action={
          <Button
            variant="secondary"
            onClick={() => {
              updateParams({ q: '' });
            }}
          >
            {t('welcome.empty.clear')}
          </Button>
        }
      />
    ) : (
      <EmptyState
        icon={Star}
        title={t('welcome.empty.favouritesTitle')}
        body={t('welcome.empty.favouritesBody')}
      />
    );
  } else {
    content = (
      <LayoutGroup>
        <div className="space-y-8">
          {favourites.length > 0 && (
            <Section title={t('welcome.sections.favourites')}>
              <TileGrid tiles={favourites} onOpenDetails={openDetails} onTogglePin={togglePin} />
            </Section>
          )}
          {others.length > 0 && (
            <Section title={t('welcome.sections.all')}>
              <TileGrid tiles={others} onOpenDetails={openDetails} onTogglePin={togglePin} />
            </Section>
          )}
        </div>
      </LayoutGroup>
    );
  }

  return (
    <div className="relative isolate space-y-8">
      <AuroraBackground />
      <header className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-muted">{today}</p>
          <m.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 26 }}
            className="mt-1 animate-[tt-shimmer_8s_linear_infinite] bg-[linear-gradient(110deg,var(--tt-text)_35%,var(--tt-primary)_50%,var(--tt-text)_65%)] bg-[length:250%_100%] bg-clip-text text-3xl font-bold tracking-tight text-transparent sm:text-4xl forced-colors:bg-none forced-colors:text-[CanvasText]"
          >
            {greeting}
          </m.h1>
          {!isPending && !isError && (
            <p className="mt-2 text-muted">
              {t('welcome.modulesCount', { count: visible.length })}
              {' · '}
              {t('welcome.favouritesCount', {
                count: visible.filter((tile) => tile.view.pinned).length,
              })}
            </p>
          )}
        </div>
        <SystemStatusPill />
      </header>

      <div className="space-y-4">
        <div className="flex gap-3">
          {!arranging && (
            <SearchField
              label={t('welcome.search')}
              placeholder={t('welcome.searchPlaceholder')}
              value={query}
              onChange={(value) => {
                updateParams({ q: value });
              }}
            />
          )}
          <Button
            variant={arranging ? 'primary' : 'secondary'}
            className="ml-auto shrink-0 rounded-2xl px-4"
            aria-pressed={arranging}
            disabled={isPending || isError}
            onClick={() => {
              setArranging((value) => !value);
            }}
          >
            {arranging ? (
              <Check aria-hidden="true" className="size-4" />
            ) : (
              <SlidersHorizontal aria-hidden="true" className="size-4" />
            )}
            {arranging ? (
              t('welcome.done')
            ) : (
              // Icon-only on phones so the search box keeps its room; still named for AT.
              <span className="sr-only sm:not-sr-only">{t('welcome.customize')}</span>
            )}
          </Button>
        </div>
        {!arranging && (
          <FilterChips
            label={t('welcome.filters.label')}
            chips={chips}
            value={filter}
            onChange={(value) => {
              updateParams({ show: value });
            }}
          />
        )}
      </div>

      {content}

      {!arranging && hidden.length > 0 && (
        <details className="group rounded-3xl border border-border bg-surface/60 p-4 backdrop-blur">
          <summary className="cursor-pointer font-semibold">
            {t('welcome.sections.hidden')} ({hidden.length})
          </summary>
          <p className="mt-1 text-sm text-muted">{t('welcome.sections.hiddenHint')}</p>
          <ul role="list" className="mt-3 flex flex-wrap gap-2">
            {hidden.map((tile) => (
              <li
                key={tile.view.key}
                style={accentStyle(tile)}
                className="flex items-center gap-2 rounded-2xl border border-border bg-surface py-1.5 pr-1.5 pl-2"
              >
                <ModuleIcon tile={tile} />
                <span className="font-medium">{tile.text.name}</span>
                <Button
                  variant="ghost"
                  onClick={() => {
                    actions.setVisible(tile, true);
                  }}
                >
                  {t('welcome.show', { name: tile.text.name })}
                </Button>
              </li>
            ))}
          </ul>
        </details>
      )}

      <ModuleDetailsDialog
        tile={selected}
        open={detailsKey !== null && selected !== null}
        onClose={() => {
          // Opened from this page: step back, so Back doesn't reopen it. Deep link: just close.
          const openedHere = (location.state as { openedHere?: boolean } | null)?.openedHere;
          if (openedHere) void navigate(-1);
          else updateParams({ module: '' });
        }}
        onPin={(tile, pinned) => {
          actions.setPinned(tile, pinned);
        }}
        onVisible={(tile, enabled) => {
          actions.setVisible(tile, enabled);
        }}
        onNotify={(tile, wanted) => {
          actions.setNotify(tile, wanted);
        }}
      />
    </div>
  );
}
