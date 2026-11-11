import { useTranslation } from 'react-i18next';

import type { AgentRun } from '@/core/agents/queries';
import { useAiAction } from '@/modules/travel/ai-action';
import { AiSteps } from '@/modules/travel/ai-ask';
import { ITEMS_DRAFT, itemsDraftOf } from '@/modules/travel/ai-drafts';
import { travelKeys } from '@/modules/travel/api';
import { assistItems, assistTrip } from '@/modules/travel/assist-api';
import { suggest } from '@/modules/travel/checklist-api';
import { NS } from '@/modules/travel/i18n';
import type { Activity } from '@/modules/travel/plan-api';
import { PreviewDialog, type AskAddition } from '@/modules/travel/preview-dialog';
import { useTripContext } from '@/modules/travel/trip-context';

// activity-checklist's answers without AI (its static script): the activity's kind has rule
// suggestions, or none.
const RULES = 'activity-checklist.rules';
const NO_RULES = 'activity-checklist.no_rules';

/**
 * Prepare with AI (Basic AI): checklist and packing items drafted for one activity, shown in the
 * usual preview as the assistant's suggestions and added only when the person says so, naming the
 * run. When AI can't run, it says why and offers the app's own rule suggestions for the activity
 * instead, labelled as such (or says there are none).
 */
export function ItemsAiDialog({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const { trip } = useTripContext();
  const ai = useAiAction({
    tool: ITEMS_DRAFT,
    start: (locale) => assistTrip(trip.id, { task: 'activity', activity_id: activity.id }, locale),
    read: (action) => itemsDraftOf(action, trip.id, activity.id),
    tripId: trip.id,
  });
  const { draft, ended } = ai;
  const rules = draft === null && ended?.message_code === RULES;
  const byRule = { activity_id: activity.id, packing: false };
  let ask: AskAddition | null = null;
  if (draft && ended) {
    const body = { activity_id: activity.id, items: draft, ai_run_id: ended.id };
    ask = (apply) => assistItems(trip.id, { ...body, apply });
  } else if (rules) ask = (apply) => suggest(trip.id, byRule, apply);

  const said = (run: AgentRun) => {
    const code = run.message_code;
    if (code !== RULES && code !== NO_RULES) return run.message ?? '';
    const reason = run.reason ? tCommon(`agents.reason.${run.reason}`) : '';
    const instead = t(code === RULES ? 'ai.items.rules' : 'ai.items.noRules');
    return [tCommon('agents.unavailable'), reason, instead].filter(Boolean).join(' ');
  };

  return (
    <PreviewDialog
      title={t('ai.items.title', { title: activity.title })}
      intro={t(rules ? 'ai.items.rulesIntro' : 'ai.items.intro')}
      none={t(rules ? 'suggest.none' : 'ai.items.none')}
      add={(count) => t('suggest.add', { count })}
      failed={t('ai.previewError')}
      previewKey={travelKeys.preview(trip.id, rules ? byRule : { run: ended?.id })}
      ask={ask}
      onClose={onClose}
    >
      <AiSteps
        ai={ai}
        about={t('ai.items.about')}
        label={t('ai.items.start')}
        manual={t('ai.items.manual')}
        said={said}
        ready={draft ? t('ai.ready') : rules ? '' : null}
      />
    </PreviewDialog>
  );
}
