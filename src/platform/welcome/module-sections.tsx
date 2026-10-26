import { SearchX, Star } from 'lucide-react';
import { AnimatePresence, LayoutGroup, m } from 'motion/react';
import { useId, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import type { ModuleTile as Tile } from '@/core/modules/types';
import { Button, EmptyState } from '@/design-system';
import { TILE_GRID } from '@/platform/welcome/module-style';
import { ModuleTile } from '@/platform/welcome/module-tile';

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

interface TileActions {
  onOpenDetails: (tile: Tile) => void;
  onTogglePin: (tile: Tile) => void;
}

function TileGrid({ tiles, onOpenDetails, onTogglePin }: TileActions & { tiles: Tile[] }) {
  return (
    <ul role="list" className={TILE_GRID}>
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

export interface ModuleSectionsProps extends TileActions {
  /** The tiles the search and filter leave, in order. */
  tiles: Tile[];
  query: string;
  onClearQuery: () => void;
}

/**
 * The Welcome page's tiles: favourites first, then the rest, moving into place as they change
 * (or a friendly empty state). It shows once the modules have loaded, so the page loads it
 * (and the animation library its tiles use) beside that request, not before its first paint.
 */
export function ModuleSections({
  tiles,
  query,
  onClearQuery,
  onOpenDetails,
  onTogglePin,
}: ModuleSectionsProps) {
  const { t } = useTranslation();
  const favourites = tiles.filter((tile) => tile.view.pinned);
  const others = tiles.filter((tile) => !tile.view.pinned);

  if (tiles.length === 0) {
    return query ? (
      <EmptyState
        icon={SearchX}
        title={t('welcome.empty.title', { query })}
        body={t('welcome.empty.body')}
        action={
          <Button variant="secondary" onClick={onClearQuery}>
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
  }

  return (
    <LayoutGroup>
      <div className="space-y-8">
        {favourites.length > 0 && (
          <Section title={t('welcome.sections.favourites')}>
            <TileGrid tiles={favourites} onOpenDetails={onOpenDetails} onTogglePin={onTogglePin} />
          </Section>
        )}
        {others.length > 0 && (
          <Section title={t('welcome.sections.all')}>
            <TileGrid tiles={others} onOpenDetails={onOpenDetails} onTogglePin={onTogglePin} />
          </Section>
        )}
      </div>
    </LayoutGroup>
  );
}
