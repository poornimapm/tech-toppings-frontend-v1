import { Copy, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { offerDownload } from '@/core/api/save-file';
import { Alert, Button, toast } from '@/design-system';

const FILE_NAME = 'recovery-codes.txt';

/** Recovery codes, shown this once: copy them, save them, then confirm. */
export function RecoveryCodes({ codes, onDone }: { codes: string[]; onDone: () => void }) {
  const { t } = useTranslation();
  const text = codes.join('\n');

  return (
    <div className="space-y-4">
      <Alert tone="info">{t('security.twoFactor.codesOnce')}</Alert>
      <ul
        aria-label={t('security.twoFactor.codesLabel')}
        className="grid grid-cols-2 gap-2 rounded-lg border border-border bg-bg p-3 font-mono text-sm"
      >
        {codes.map((code) => (
          <li key={code}>{code}</li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            // No clipboard (an http page) or no permission: say so, the codes are shown once.
            void Promise.resolve()
              .then(() => navigator.clipboard.writeText(text))
              .then(
                () => {
                  toast(t('security.twoFactor.copied'), { tone: 'success' });
                },
                () => {
                  toast(t('security.twoFactor.copyFailed'), { tone: 'danger' });
                },
              );
          }}
        >
          <Copy aria-hidden="true" className="size-4" />
          {t('security.twoFactor.copy')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            offerDownload(new Blob([`${text}\n`], { type: 'text/plain' }), FILE_NAME);
          }}
        >
          <Download aria-hidden="true" className="size-4" />
          {t('security.twoFactor.download')}
        </Button>
        <Button onClick={onDone}>{t('security.twoFactor.saved')}</Button>
      </div>
    </div>
  );
}
