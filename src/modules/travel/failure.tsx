import { useTranslation } from 'react-i18next';

import { Alert, Button } from '@/design-system';
import { failureCode } from '@/modules/travel/api';
import { failureText } from '@/modules/travel/failure-text';
import { NS } from '@/modules/travel/i18n';

/**
 * Why a save was refused, kept mounted so what comes later is announced. Changed elsewhere
 * since it was opened (409), it offers the latest instead: then the change can be made again
 * on what is really there.
 */
export function Failure({ error, onReload }: { error: unknown; onReload?: () => void }) {
  const { t } = useTranslation(NS);
  if (!error) return <Alert tone="danger">{null}</Alert>;
  if (failureCode(error) === 'VERSION_CONFLICT' && onReload) {
    return (
      <Alert tone="danger">
        <span className="flex flex-wrap items-center justify-between gap-3">
          {t('conflict')}
          <Button variant="secondary" className="min-h-11" onClick={onReload}>
            {t('reload')}
          </Button>
        </span>
      </Alert>
    );
  }
  return <Alert tone="danger">{failureText(error)}</Alert>;
}
