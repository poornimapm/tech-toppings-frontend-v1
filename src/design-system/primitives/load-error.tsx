import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert } from '@/design-system/primitives/alert';
import { Button } from '@/design-system/primitives/button';

/** "We couldn't load this", with a way to try again. */
export function LoadError({ children, onRetry }: { children: ReactNode; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <Alert tone="danger">
      <span className="flex flex-wrap items-center justify-between gap-3">
        {children}
        <Button variant="secondary" onClick={onRetry}>
          {t('actions.retry')}
        </Button>
      </span>
    </Alert>
  );
}
