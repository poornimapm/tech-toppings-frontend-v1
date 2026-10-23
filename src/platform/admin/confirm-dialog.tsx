import { useTranslation } from 'react-i18next';

import { Alert, Button, Dialog } from '@/design-system';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  pending: boolean;
  /** Why the change was refused: shown in the dialog, which would hide it on the page. */
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

/** "Are you sure?" before a change that affects someone else's account. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  pending,
  error,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title={title}
      description={body}
    >
      {error && (
        <div className="mt-4">
          <Alert tone="danger">{error}</Alert>
        </div>
      )}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={pending} onClick={onConfirm}>
          {confirmLabel}
        </Button>
        <Button variant="ghost" onClick={onClose}>
          {t('actions.cancel')}
        </Button>
      </div>
    </Dialog>
  );
}
