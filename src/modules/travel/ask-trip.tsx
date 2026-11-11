import { ArrowRight } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { Alert, Card } from '@/design-system';
import { useAiAction } from '@/modules/travel/ai-action';
import { AiAsk } from '@/modules/travel/ai-ask';
import { OPEN, openedOf, pathOf } from '@/modules/travel/ai-drafts';
import { AiProgress } from '@/modules/travel/ai-progress';
import { assistTrip } from '@/modules/travel/assist-api';
import { SIDE_LINK } from '@/modules/travel/choice';
import { NS } from '@/modules/travel/i18n';
import { useTripContext } from '@/modules/travel/trip-context';
import { weekdayOf } from '@/modules/travel/trip-words';

/**
 * Ask about this trip (Basic AI), on its Overview: a question answered in plain text, as the
 * assistant's own words. It is told to answer from the trip's records, but nothing checks what it
 * says, so the page never vouches for it: it says it can be wrong, and that the trip's sections
 * are the record. Where the answer is one of them, a link opens it (on that day). It changes
 * nothing.
 */
export function AskTrip() {
  const { t, i18n } = useTranslation(NS);
  const { trip } = useTripContext();
  const id = useId();
  const [question, setQuestion] = useState('');
  const ai = useAiAction({
    tool: OPEN,
    start: (locale) => assistTrip(trip.id, { task: 'ask', text: question.trim() }, locale),
    read: (action) => openedOf(action, trip),
    tripId: trip.id,
  });
  // Only a run that finished answers: one that stopped says so.
  const finished = ai.ended?.status === 'completed';
  const answer = finished ? (ai.ended?.message?.trim() ?? '') : '';
  const opened = finished ? ai.draft : null;
  const answered = answer || opened ? true : null;
  const section = opened && t(`tabs.${opened.section}`);

  return (
    <Card title={t('ai.ask.title')}>
      <div className="space-y-3">
        <AiAsk
          id={id}
          about={t('ai.ask.about')}
          words={{
            label: t('ai.ask.words'),
            hint: t('ai.ask.example'),
            value: question,
            onChange: setQuestion,
          }}
          label={t('ai.ask.start')}
          working={ai.working}
          onAsk={() => void ai.ask()}
        />
        <AiProgress
          action={{
            ...ai,
            draft: answered,
            stop: () => {
              ai.stop();
              document.getElementById(id)?.focus();
            },
          }}
          manual={t('ai.ask.manual')}
          said={() => t('ai.ask.none')}
        />
        {/* Kept mounted, so the answer is read out as it comes. */}
        <Alert tone="info">
          {answer && (
            <>
              <span className="block text-muted">{t('ai.ask.from')}</span>
              <span className="mt-1 block whitespace-pre-line">{answer}</span>
              <span className="mt-1 block text-muted">{t('ai.ask.check')}</span>
            </>
          )}
        </Alert>
        {opened && (
          <Link to={pathOf(opened)} className={SIDE_LINK}>
            {opened.day
              ? t('ai.ask.openDay', { section, day: weekdayOf(opened.day, i18n.language) })
              : t('ai.ask.open', { section })}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        )}
      </div>
    </Card>
  );
}
