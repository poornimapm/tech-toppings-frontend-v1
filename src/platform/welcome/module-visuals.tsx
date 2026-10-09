import { Lock, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ModuleTile } from '@/core/modules/types';
import { cx } from '@/core/utils/cx';
import { Badge } from '@/design-system';

export function ModuleIcon({ tile, size = 'md' }: { tile: ModuleTile; size?: 'md' | 'lg' }) {
  const Icon = tile.definition.icon;
  return (
    <span
      aria-hidden="true"
      className={cx(
        'grid shrink-0 place-items-center bg-tile-soft text-tile shadow-inner ring-1 ring-tile/20 ring-inset',
        size === 'lg' ? 'size-16 rounded-3xl' : 'size-12 rounded-2xl',
      )}
    >
      <Icon className={size === 'lg' ? 'size-8' : 'size-6'} />
    </span>
  );
}

/** Live modules need no badge; everything else says what state it is in. */
export function ModuleStatusBadge({ tile }: { tile: ModuleTile }) {
  const { t } = useTranslation();
  const { view } = tile;
  if (!view.global_enabled) {
    return (
      <Badge tone="locked" icon={<Lock aria-hidden="true" className="size-3" />}>
        {t('welcome.badge.locked')}
      </Badge>
    );
  }
  if (view.status === 'coming_soon') {
    return (
      <Badge tone="soon" icon={<Sparkles aria-hidden="true" className="size-3" />}>
        {t('welcome.badge.soon')}
      </Badge>
    );
  }
  if (view.status === 'beta') return <Badge tone="beta">{t('welcome.badge.beta')}</Badge>;
  return null;
}
