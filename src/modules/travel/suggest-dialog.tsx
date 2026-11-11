import { useTranslation } from 'react-i18next';

import { travelKeys } from '@/modules/travel/api';
import { suggest, type SuggestAsk } from '@/modules/travel/checklist-api';
import { NS } from '@/modules/travel/i18n';
import { PreviewDialog } from '@/modules/travel/preview-dialog';
import { useTripContext } from '@/modules/travel/trip-context';

/** Suggestions by rule, previewed first and labelled as suggestions rather than requirements. */
export function SuggestDialog({ asked, onClose }: { asked: SuggestAsk; onClose: () => void }) {
  const { t } = useTranslation(NS);
  const { trip } = useTripContext();
  return (
    <PreviewDialog
      title={t(asked.packing ? 'suggest.packing' : 'suggest.day')}
      intro={t('suggest.intro')}
      none={t('suggest.none')}
      add={(count) => t('suggest.add', { count })}
      failed={t('suggest.loadError')}
      previewKey={travelKeys.preview(trip.id, asked)}
      ask={(apply) => suggest(trip.id, asked, apply)}
      onClose={onClose}
    />
  );
}
