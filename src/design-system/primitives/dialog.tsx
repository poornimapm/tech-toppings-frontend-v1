import * as RadixDialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { AnimatePresence, m } from 'motion/react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

export interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  /** Shown above the title (e.g. a large icon). */
  header?: ReactNode;
  children?: ReactNode;
}

/**
 * Modal dialog: focus is trapped and returned on close, Escape and the backdrop close it, the
 * page behind is inert (Radix). It springs in from below like a sheet on phones.
 */
export function Dialog({ open, onOpenChange, title, description, header, children }: DialogProps) {
  const { t } = useTranslation();
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <m.div
                className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            </RadixDialog.Overlay>
            <div className="fixed inset-0 z-40 flex items-end justify-center p-0 sm:items-center sm:p-4">
              <RadixDialog.Content asChild forceMount>
                <m.div
                  className="relative max-h-[90dvh] w-full overflow-y-auto rounded-t-3xl border border-border bg-surface p-6 shadow-2xl sm:max-w-md sm:rounded-3xl"
                  initial={{ opacity: 0, y: 48, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 32, scale: 0.98, transition: { duration: 0.15 } }}
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                >
                  {header}
                  <RadixDialog.Title className="text-xl font-semibold tracking-tight">
                    {title}
                  </RadixDialog.Title>
                  {description ? (
                    <RadixDialog.Description className="mt-2 text-muted">
                      {description}
                    </RadixDialog.Description>
                  ) : (
                    <RadixDialog.Description className="sr-only">{title}</RadixDialog.Description>
                  )}
                  {children && <div className="mt-5">{children}</div>}
                  <RadixDialog.Close
                    aria-label={t('actions.close')}
                    className="absolute top-4 right-4 rounded-full p-2 text-muted hover:bg-bg hover:text-text"
                  >
                    <X aria-hidden="true" className="size-5" />
                  </RadixDialog.Close>
                </m.div>
              </RadixDialog.Content>
            </div>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}
