import { ArrowUpRight } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { slugOf } from '@/core/modules/registry';
import type { ModuleTile } from '@/core/modules/types';
import { Alert, Dialog, Switch } from '@/design-system';
import { accentStyle, isOpenable } from '@/platform/welcome/module-style';
import { ModuleIcon, ModuleStatusBadge } from '@/platform/welcome/module-visuals';

export interface ModuleDetailsDialogProps {
  /** Kept while closing, so the exit animation still shows the module. */
  tile: ModuleTile | null;
  open: boolean;
  onClose: () => void;
  onPin: (tile: ModuleTile, pinned: boolean) => void;
  onVisible: (tile: ModuleTile, enabled: boolean) => void;
  onNotify: (tile: ModuleTile, wanted: boolean) => void;
}

/** Everything about one module: what it does, its state, and the user's switches for it. */
export function ModuleDetailsDialog({
  tile,
  open,
  onClose,
  onPin,
  onVisible,
  onNotify,
}: ModuleDetailsDialogProps) {
  const { t } = useTranslation();
  if (!tile) return null;
  const { view, text } = tile;

  const header = (
    <div style={accentStyle(tile)} className="relative mb-5 flex items-center gap-4">
      <m.div
        aria-hidden="true"
        className="absolute -top-6 -left-6 size-32 rounded-full bg-tile/25 blur-2xl"
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
      />
      <m.div
        initial={{ scale: 0.7, rotate: -8 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 16 }}
      >
        <ModuleIcon tile={tile} size="lg" />
      </m.div>
      <ModuleStatusBadge tile={tile} />
    </div>
  );

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={text.name}
      description={text.tagline || undefined}
      header={header}
    >
      <div className="space-y-4">
        {text.description && <p>{text.description}</p>}
        {view.status === 'beta' && (
          <p className="text-sm text-muted">{t('welcome.dialog.betaBody')}</p>
        )}
        {!view.global_enabled && <Alert>{t('welcome.dialog.lockedBody')}</Alert>}
        <div className="space-y-4 rounded-2xl border border-border bg-bg/60 p-4">
          {view.status === 'coming_soon' && view.global_enabled && (
            <Switch
              label={t('welcome.dialog.notify')}
              description={t('welcome.dialog.notifyHint')}
              checked={view.notify_requested}
              onCheckedChange={(wanted) => {
                onNotify(tile, wanted);
              }}
            />
          )}
          <Switch
            label={t('welcome.dialog.pin')}
            description={t('welcome.dialog.pinHint')}
            checked={view.pinned}
            onCheckedChange={(pinned) => {
              onPin(tile, pinned);
            }}
          />
          <Switch
            label={t('welcome.dialog.visible')}
            description={t('welcome.dialog.visibleHint')}
            checked={view.enabled}
            onCheckedChange={(enabled) => {
              onVisible(tile, enabled);
            }}
          />
        </div>
        {isOpenable(tile) && (
          <Link
            to={`/m/${slugOf(view.key)}`}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 font-semibold text-primary-contrast hover:opacity-90"
          >
            {t('welcome.dialog.open', { name: text.name })}
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
    </Dialog>
  );
}
