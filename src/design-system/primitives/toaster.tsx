import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cx } from '@/core/utils/cx';
import { useToasts, type Toast, type ToastTone } from '@/design-system/primitives/toast-store';
import { useLeaving } from '@/design-system/primitives/use-leaving';

/** How long a dismissed toast takes to fade out (the `duration-150` below). */
const LEAVE_MS = 150;

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

function ToastItem({ toast, leaving }: { toast: Toast; leaving: boolean }) {
  const { t } = useTranslation();
  const dismiss = useToasts((state) => state.dismiss);
  const [paused, setPaused] = useState(false);
  const Icon = icons[toast.tone];

  useEffect(() => {
    if (paused || leaving) return undefined;
    const timer = setTimeout(() => {
      dismiss(toast.id);
    }, toast.durationMs);
    return () => {
      clearTimeout(timer);
    };
  }, [paused, leaving, dismiss, toast.id, toast.durationMs]);

  // CSS only (no animation library on the first page): it rises in from its starting style
  // and fades out while leaving; the OS "reduce motion" setting stills both (tokens.css).
  return (
    // Pointer and focus inside only pause the auto-dismiss; the buttons are the interactions.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <li
      aria-hidden={leaving || undefined}
      inert={leaving}
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
      className={cx(
        'pointer-events-auto flex w-full items-center gap-3 rounded-2xl border border-border bg-glass px-4 py-3 text-sm shadow-lg shadow-black/10 backdrop-blur-xl',
        'transition-[opacity,translate,scale] starting:translate-y-6 starting:scale-96 starting:opacity-0',
        leaving
          ? 'translate-y-3 scale-96 opacity-0 duration-150 ease-in'
          : 'duration-300 ease-[cubic-bezier(0.22,1.2,0.36,1)]',
      )}
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
    </li>
  );
}

/** Renders toasts in a polite live region, so screen readers announce them without stealing
 *  focus. Mounted once, near the app root. On phones they sit above the bottom navigation. */
export function Toaster() {
  const { t } = useTranslation();
  const toasts = useLeaving(
    useToasts((state) => state.toasts),
    LEAVE_MS,
  );
  return (
    <section
      aria-label={t('notifications')}
      className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex justify-center px-4 sm:bottom-4"
    >
      <div role="status" aria-live="polite" className="w-full max-w-md">
        <ol className="flex flex-col gap-2">
          {toasts.map(({ item, leaving }) => (
            <ToastItem key={item.id} toast={item} leaving={leaving} />
          ))}
        </ol>
      </div>
    </section>
  );
}
