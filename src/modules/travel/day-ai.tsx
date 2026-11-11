import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useAiAction } from '@/modules/travel/ai-action';
import { AiSteps } from '@/modules/travel/ai-ask';
import { DAY_DRAFT, dayDraftOf } from '@/modules/travel/ai-drafts';
import { travelKeys } from '@/modules/travel/api';
import { assistTrip, draftDay } from '@/modules/travel/assist-api';
import { NS } from '@/modules/travel/i18n';
import { PreviewDialog } from '@/modules/travel/preview-dialog';
import { useTripContext } from '@/modules/travel/trip-context';
import { weekdayOf } from '@/modules/travel/trip-words';

/**
 * Draft this day (Basic AI): activities drafted for one day, with the person's wish for it if
 * they give one, shown in the usual preview after the day's own. Added only when they say so, as
 * one change that names the run (so History says AI drafted it) and takes them all back.
 */
export function DayAiDialog({ day, onClose }: { day: string; onClose: () => void }) {
  const { t, i18n } = useTranslation(NS);
  const { trip } = useTripContext();
  const [wish, setWish] = useState('');
  const ai = useAiAction({
    tool: DAY_DRAFT,
    start: (locale) => assistTrip(trip.id, { task: 'day', day, text: wish.trim() || null }, locale),
    read: (action) => dayDraftOf(action, trip, day),
    tripId: trip.id,
  });
  const { draft } = ai;
  const runId = ai.ended?.id ?? '';

  return (
    <PreviewDialog
      title={t('ai.day.title', { day: weekdayOf(day, i18n.language) })}
      intro={t('ai.day.intro')}
      none={t('ai.nothing')}
      add={(count) => t('ai.day.add', { count })}
      failed={t('ai.previewError')}
      previewKey={travelKeys.preview(trip.id, { run: runId })}
      ask={
        draft && ((apply) => draftDay(trip.id, { day, activities: draft, apply, ai_run_id: runId }))
      }
      onClose={onClose}
    >
      <AiSteps
        ai={ai}
        about={t('ai.day.about')}
        words={{
          label: t('ai.day.words'),
          hint: t('ai.day.example'),
          value: wish,
          onChange: setWish,
          optional: true,
        }}
        label={t('ai.day.start')}
        manual={t('ai.day.manual')}
        ready={draft && t('ai.ready')}
      />
    </PreviewDialog>
  );
}
