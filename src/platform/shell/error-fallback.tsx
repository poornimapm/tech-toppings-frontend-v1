import { useTranslation } from 'react-i18next';

import { Button } from '@/design-system';

/** Shown when rendering fails (route error or the app-level boundary). */
export function ErrorFallback() {
  const { t } = useTranslation();
  return (
    <div role="alert" className="mx-auto max-w-lg space-y-3 px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">{t('error.title')}</h1>
      <p className="text-muted">{t('error.body')}</p>
      <Button
        onClick={() => {
          window.location.reload();
        }}
      >
        {t('error.reload')}
      </Button>
    </div>
  );
}
