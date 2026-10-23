import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/design-system/primitives/button';

export interface PagerProps {
  page: number;
  hasNext: boolean;
  onPage: (page: number) => void;
}

/** Previous / next through a paged list; hidden while everything fits on one page. */
export function Pager({ page, hasNext, onPage }: PagerProps) {
  const { t } = useTranslation();
  if (page <= 1 && !hasNext) return null;
  return (
    <nav aria-label={t('actions.pages')} className="flex items-center justify-end gap-2">
      <Button
        variant="secondary"
        disabled={page <= 1}
        onClick={() => {
          onPage(page - 1);
        }}
      >
        <ChevronLeft aria-hidden="true" className="size-4" />
        {t('actions.previous')}
      </Button>
      <span className="text-sm text-muted">{t('actions.page', { page })}</span>
      <Button
        variant="secondary"
        disabled={!hasNext}
        onClick={() => {
          onPage(page + 1);
        }}
      >
        {t('actions.next')}
        <ChevronRight aria-hidden="true" className="size-4" />
      </Button>
    </nav>
  );
}
