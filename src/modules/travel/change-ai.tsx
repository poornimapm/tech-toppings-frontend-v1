import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Dialog } from '@/design-system';
import { useAiAction } from '@/modules/travel/ai-action';
import { AiSteps } from '@/modules/travel/ai-ask';
import { CHANGE_DRAFT, changeDraftOf } from '@/modules/travel/ai-drafts';
import { assistTrip } from '@/modules/travel/assist-api';
import { ChangeDialog } from '@/modules/travel/change-dialog';
import { NS } from '@/modules/travel/i18n';
import type { Activity } from '@/modules/travel/plan-api';
import { useTripContext } from '@/modules/travel/trip-context';

/**
 * Tell it what changed (Basic AI): the person says in their words what happened to one activity,
 * and the draft opens the usual change dialog filled in (done, skipped, replaced or rescheduled),
 * to check, preview and apply as ever, naming the run.
 */
export function ChangeAiDialog({
  activity,
  onClose,
  onReload,
}: {
  activity: Activity;
  onClose: () => void;
  onReload: () => void;
}) {
  const { t } = useTranslation(NS);
  const { trip, options } = useTripContext();
  const [said, setSaid] = useState('');
  const ai = useAiAction({
    tool: CHANGE_DRAFT,
    start: (locale) =>
      assistTrip(trip.id, { task: 'change', activity_id: activity.id, text: said.trim() }, locale),
    read: (action) => changeDraftOf(action, { trip, activity, kinds: options.activity_kinds }),
    tripId: trip.id,
  });

  if (ai.draft && ai.ended) {
    return (
      <ChangeDialog
        activity={activity}
        action={ai.draft.action}
        draft={{ values: ai.draft.values, runId: ai.ended.id }}
        onClose={onClose}
        onReload={onReload}
      />
    );
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('ai.change.title', { title: activity.title })}
    >
      <AiSteps
        ai={ai}
        about={t('ai.change.about')}
        words={{
          label: t('ai.change.words'),
          hint: t('ai.change.example'),
          value: said,
          onChange: setSaid,
        }}
        label={t('ai.change.start')}
        manual={t('ai.change.manual')}
        ready={null}
      />
    </Dialog>
  );
}
