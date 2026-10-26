import { ArrowUpRight, BellRing, Star } from 'lucide-react';
import { m, useReducedMotion } from 'motion/react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { slugOf } from '@/core/modules/registry';
import type { ModuleTile as Tile } from '@/core/modules/types';
import { cx } from '@/core/utils/cx';
import { AnimatedNumber, usePointerTilt } from '@/design-system';
import { accentStyle, isOpenable } from '@/platform/welcome/module-style';
import { ModuleIcon, ModuleStatusBadge } from '@/platform/welcome/module-visuals';

const BURST_PARTICLES = 8;

/** Little star burst when something is favourited (skipped with reduced motion). */
function StarBurst({ burst }: { burst: number }) {
  if (burst === 0) return null;
  return (
    <span aria-hidden="true" className="pointer-events-none absolute inset-0">
      {Array.from({ length: BURST_PARTICLES }, (_, index) => {
        const angle = (index / BURST_PARTICLES) * Math.PI * 2;
        return (
          <m.span
            key={`${burst}-${index}`}
            className="absolute top-1/2 left-1/2 size-1.5 rounded-full bg-[var(--tt-accent-amber)]"
            initial={{ x: '-50%', y: '-50%', scale: 1, opacity: 1 }}
            animate={{
              x: `calc(-50% + ${Math.cos(angle) * 20}px)`,
              y: `calc(-50% + ${Math.sin(angle) * 20}px)`,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.55, ease: 'easeOut' }}
          />
        );
      })}
    </span>
  );
}

export interface ModuleTileProps {
  tile: Tile;
  index: number;
  onOpenDetails: (tile: Tile) => void;
  onTogglePin: (tile: Tile) => void;
}

export function ModuleTile({ tile, index, onOpenDetails, onTogglePin }: ModuleTileProps) {
  const { t, i18n } = useTranslation();
  const reduceMotion = useReducedMotion();
  const tilt = usePointerTilt();
  const nameId = useId();
  const [burst, setBurst] = useState(0);
  const { view, text, definition } = tile;
  const locked = !view.global_enabled;
  const stat = view.stat;
  const statLabel = stat
    ? (text.stats?.[stat.label] ?? definition.strings.en.stats?.[stat.label])
    : null;

  const coverAction =
    'text-left after:absolute after:inset-0 after:rounded-3xl after:content-[""] ' +
    'focus-visible:outline-none focus-visible:after:outline-2 focus-visible:after:outline-offset-2 ' +
    'focus-visible:after:outline-[var(--tt-focus)]';

  return (
    <m.li
      layout
      layoutId={`module-${view.key}`}
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 360, damping: 30, delay: Math.min(index, 8) * 0.04 }}
      className="list-none perspective-[900px]"
    >
      <m.article
        aria-labelledby={nameId}
        style={accentStyle(tile)}
        {...tilt.handlers}
        whileHover={reduceMotion ? undefined : { y: -4 }}
        whileTap={reduceMotion ? undefined : { scale: 0.985 }}
        className={cx(
          'group relative isolate flex h-full min-h-48 flex-col overflow-hidden rounded-3xl border border-border bg-glass p-5 shadow-sm backdrop-blur-xl',
          'transition-[rotate,box-shadow] duration-300 ease-out hover:shadow-xl hover:shadow-tile/15',
          locked && 'opacity-80 saturate-50',
        )}
      >
        {/* Spotlight that follows the pointer (see usePointerTilt). */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(420px_circle_at_var(--spot-x,50%)_var(--spot-y,0%),color-mix(in_oklab,var(--color-tile)_20%,transparent),transparent_65%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        />
        <div className="flex items-start justify-between gap-3">
          <span className="transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
            <ModuleIcon tile={tile} />
          </span>
          <m.button
            type="button"
            aria-pressed={view.pinned}
            aria-label={t(view.pinned ? 'welcome.tile.unpin' : 'welcome.tile.pin', {
              name: text.name,
            })}
            whileTap={reduceMotion ? undefined : { scale: 0.8 }}
            onClick={() => {
              if (!view.pinned && !reduceMotion) setBurst((count) => count + 1);
              onTogglePin(tile);
            }}
            className="relative z-10 grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-bg hover:text-[var(--tt-accent-amber)]"
          >
            <m.span
              key={view.pinned ? 'pinned' : 'unpinned'}
              initial={reduceMotion ? false : { scale: 0.4, rotate: -40 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 600, damping: 14 }}
              className="grid place-items-center"
            >
              <Star
                aria-hidden="true"
                className={cx(
                  'size-5',
                  view.pinned && 'fill-current text-[var(--tt-accent-amber)]',
                )}
              />
            </m.span>
            <StarBurst burst={burst} />
          </m.button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <h3 id={nameId} className="text-lg leading-tight font-semibold tracking-tight">
            {isOpenable(tile) ? (
              <Link to={`/m/${slugOf(view.key)}`} className={coverAction}>
                {text.name}
              </Link>
            ) : (
              <button
                type="button"
                aria-haspopup="dialog"
                className={coverAction}
                onClick={() => {
                  onOpenDetails(tile);
                }}
              >
                {text.name}
              </button>
            )}
          </h3>
          <ModuleStatusBadge tile={tile} />
        </div>
        {text.tagline && <p className="mt-1 line-clamp-2 text-sm text-muted">{text.tagline}</p>}

        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          {stat ? (
            <div>
              <AnimatedNumber
                value={stat.value}
                currency={stat.format === 'currency' ? stat.currency : null}
                locale={i18n.language}
                className="text-2xl font-bold tracking-tight text-tile"
              />
              {statLabel && <p className="text-xs text-muted">{statLabel}</p>}
            </div>
          ) : view.notify_requested ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-tile">
              <BellRing aria-hidden="true" className="size-3.5" />
              {t('welcome.tile.notifying')}
            </span>
          ) : locked ? (
            <span className="text-xs text-muted">{t('welcome.tile.lockedHint')}</span>
          ) : (
            <span />
          )}
          <ArrowUpRight
            aria-hidden="true"
            className="size-5 shrink-0 text-muted transition-all duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-tile"
          />
        </div>
      </m.article>
    </m.li>
  );
}
