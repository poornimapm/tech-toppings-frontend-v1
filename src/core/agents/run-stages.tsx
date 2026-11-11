import { Check, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { RUN_NS } from '@/core/agents/i18n';
import type { RunStage } from '@/core/agents/run';
import { cx } from '@/core/utils/cx';
import { Button } from '@/design-system';

/**
 * A background run's progress: the stages it has reached, each once in the order first reached
 * (a run goes back to reading, and to the model, as often as it needs), in fixed words (the codes
 * the run records, never the model's text), the latest one still under way. Each new stage is
 * announced politely. Cancel stops the run, and whatever it drafted is let go.
 */
export function RunStages({
  stages,
  onCancel,
}: {
  stages: readonly RunStage[];
  onCancel: () => void;
}) {
  const { t } = useTranslation(RUN_NS);
  const { t: tCommon } = useTranslation();
  const latest = stages.at(-1);
  const lines = stages.length
    ? [...new Set(stages)].map((stage) => ({ key: stage, word: t(`stages.${stage}`) }))
    : [{ key: 'starting', word: t('starting') }];
  return (
    <div className="flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-border bg-surface p-4">
      {/* Not atomic: only the stage just reached is read out, not the whole list again. */}
      <div aria-live="polite">
        <ol role="list" aria-label={t('progress')} className="space-y-1 text-sm">
          {lines.map(({ key, word }) => {
            const current = (key === latest || latest === undefined) && latest !== 'done';
            return (
              <li
                key={key}
                aria-current={current ? 'step' : undefined}
                className={cx('flex items-center gap-2', current ? 'font-medium' : 'text-muted')}
              >
                {current ? (
                  <Sparkles
                    aria-hidden="true"
                    className="size-4 text-primary motion-safe:animate-pulse"
                  />
                ) : (
                  <Check aria-hidden="true" className="size-4" />
                )}
                {word}
              </li>
            );
          })}
        </ol>
      </div>
      <Button variant="secondary" className="min-h-11" onClick={onCancel}>
        {tCommon('actions.cancel')}
      </Button>
    </div>
  );
}
