import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cx } from '@/core/utils/cx';
import { useToasts, type Toast, type ToastTone } from '@/design-system/primitives/toast-store';

const icons: Record<ToastTone, typeof Info> = {
  info: Info,
  success: CircleCheck,
  danger: CircleAlert,
};

const iconTone: Record<ToastTone, string> = {
  info: 'text-primary',
  success: 'text-success',
  danger: 'text-danger',
};

function ToastItem({ toast }: { toast: Toast }) {
  const { t } = useTranslation();
  const dismiss = useToasts((state) => state.dismiss);
  const [paused, setPaused] = useState(false);
  const Icon = icons[toast.tone];

  useEffect(() => {
    if (paused) return undefined;
    const timer = setTimeout(() => {
      dismiss(toast.id);
    }, toast.durationMs);
    return () => {
      clearTimeout(timer);
    };
  }, [paused, dismiss, toast.id, toast.durationMs]);

  return (
    <m.li
      layout
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.96, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      onPointerEnter={() => {
        setPaused(true);
      }}
      onPointerLeave={() => {
        setPaused(false);
      }}
      onFocus={() => {
        setPaused(true);
      }}
      onBlur={() => {
        setPaused(false);
      }}
      className="pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-border bg-glass px-4 py-3 text-sm shadow-lg shadow-black/10 backdrop-blur-xl"
    >
      <Icon aria-hidden="true" className={cx('size-5 shrink-0', iconTone[toast.tone])} />
      <p className="min-w-0 flex-1">{toast.message}</p>
      {toast.action && (
        <button
          type="button"
          className="shrink-0 rounded-lg px-2 py-1 font-semibold text-primary hover:bg-bg"
          onClick={() => {
            toast.action?.onAction();
            dismiss(toast.id);
          }}
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        aria-label={t('actions.dismiss')}
        className="shrink-0 rounded-lg p-1 text-muted hover:bg-bg hover:text-text"
        onClick={() => {
          dismiss(toast.id);
        }}
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </m.li>
  );
}

/** Renders toasts in a polite live region, so screen readers announce them without stealing
 *  focus. Mounted once, near the app root. On phones they sit above the bottom navigation. */
export function Toaster() {
  const { t } = useTranslation();
  const toasts = useToasts((state) => state.toasts);
  return (
    <section
      aria-label={t('notifications')}
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-4"
    >
      <div role="status" aria-live="polite" className="w-full max-w-md">
        <ol className="flex flex-col gap-2">
          <AnimatePresence initial={false}>
            {toasts.map((item) => (
              <ToastItem key={item.id} toast={item} />
            ))}
          </AnimatePresence>
        </ol>
      </div>
    </section>
  );
}
