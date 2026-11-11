import { Sparkles } from 'lucide-react';
import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { useAiConsent, type AgentRun } from '@/core/agents/queries';
import { RunStages } from '@/core/agents/run-stages';
import { Alert, Button } from '@/design-system';
import type { AiAction } from '@/modules/travel/ai-action';
import { Failure } from '@/modules/travel/failure';
import { failureText } from '@/modules/travel/failure-text';
import { NS } from '@/modules/travel/i18n';

/** The words a run ended with: the AI's own answer (a question back, say). */
const answerOf = (run: AgentRun) => run.message ?? '';

/**
 * Where one of Travel's AI actions stands. While it works: its stages, with Cancel. When it
 * ended with no draft: why, in words (it couldn't run, and the reason; it stopped; what it said
 * instead), a button to turn AI on where consent is the reason (saying so if that fails), Retry,
 * and `manual`, the way to do it by hand. A draft is the page's to show, in its usual preview.
 */
export function AiProgress({
  action,
  manual,
  said = answerOf,
}: {
  action: AiAction;
  manual: ReactNode;
  /** The words of a run that ended without a draft (a static answer's code, worded). */
  said?: (run: AgentRun) => string;
}) {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const consent = useAiConsent();
  const { ended, error } = action;
  const reason = ended?.reason ? tCommon(`agents.reason.${ended.reason}`) : '';

  let why: string[] = [];
  if (error) why = [failureText(error)];
  else if (ended?.status === 'unavailable') why = [tCommon('agents.unavailable'), reason];
  else if (ended?.status === 'incomplete' && action.draft === null) {
    why = [tCommon('agents.incomplete'), reason];
  } else if (ended && action.draft === null) why = [said(ended) || t('ai.nothing')];
  const words = why.filter(Boolean).join(' ');

  return (
    <div className="space-y-3">
      {action.working && <RunStages stages={action.stages} onCancel={action.stop} />}
      {/* Kept mounted, so why it ended is announced when it comes. */}
      <Alert tone="info">{words}</Alert>
      {words && (
        <>
          {!error && ended?.reason === 'consent' && (
            <div className="space-y-2 rounded-2xl border border-border bg-bg/60 p-3 text-sm">
              <p className="text-muted">{tCommon('agents.enableHint')}</p>
              <Button
                className="min-h-11"
                disabled={consent.isPending}
                onClick={() => {
                  consent.mutate(undefined, { onSuccess: () => void action.ask() });
                }}
              >
                <Sparkles aria-hidden="true" className="size-4" />
                {tCommon('agents.enable')}
              </Button>
              <Failure error={consent.error} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="secondary" className="min-h-11" onClick={action.retry}>
              {tCommon('actions.retry')}
            </Button>
            <p className="text-sm text-muted">{manual}</p>
          </div>
        </>
      )}
    </div>
  );
}
