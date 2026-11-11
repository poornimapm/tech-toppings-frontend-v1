import { Check, Sparkles, Undo2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { formatMoney, toMinor } from '@/core/utils/money';
import { Alert, Button } from '@/design-system';
import { useAiAction } from '@/modules/travel/ai-action';
import { AiProgress } from '@/modules/travel/ai-progress';
import { describeTrip } from '@/modules/travel/assist-api';
import { currencyLabel } from '@/modules/travel/currencies';
import { NS } from '@/modules/travel/i18n';
import { LIMITS, type TripValues } from '@/modules/travel/trip-form';
import { TRIP_DRAFT, tripDraftOf, type TripDraft } from '@/modules/travel/trip-draft';
import { Row } from '@/modules/travel/trip-review';
import { daysOf, lengthOf, placesOf } from '@/modules/travel/trip-words';

/**
 * Describe your trip, on the first planning step: the person's own words, drafted by Basic AI
 * into these steps. The draft is shown first, and fills the steps only when they say so; then
 * they check every step and save as usual, so nothing is saved by the AI. It never fills in who
 * travels, notes, the mode or the reminder. AI helps only a trip in Basic AI: while the trip being
 * planned is in Static (the wizard's default, chosen at its mode step), this offers to choose
 * Basic AI first, and the mode step can change it back.
 */
export function DescribeTrip({
  form,
  before,
  onBefore,
}: {
  form: UseFormReturn<TripValues>;
  /** What the steps held before a draft first filled them in, to put back: kept beside the form,
   *  so it is still offered after checking the other steps, until it is used or the trip saved. */
  before: TripValues | null;
  onBefore: (values: TripValues | null) => void;
}) {
  const { t } = useTranslation(NS);
  const headingId = useId();
  const wordsId = useId();
  const mode = useWatch({ control: form.control, name: 'mode' });
  const [text, setText] = useState('');
  // Where the focus goes once the button just pressed has gone: the words, or the trip's name.
  const focusNext = useRef<'words' | 'title' | null>(null);
  const ai = useAiAction({
    tool: TRIP_DRAFT,
    start: (locale) => describeTrip(text.trim(), locale),
    read: (action) => tripDraftOf(action, form.getValues('currency')),
  });
  const { draft } = ai;

  useEffect(() => {
    const next = focusNext.current;
    focusNext.current = null;
    if (next === 'words') document.getElementById(wordsId)?.focus();
    if (next === 'title') form.setFocus('title');
  });

  const putAside = () => {
    ai.stop();
    focusNext.current = 'words';
  };
  const use = (filled: TripDraft) => {
    const now = structuredClone(form.getValues());
    if (!before) onBefore(now);
    // Kept defaults: the steps still count as changed, so leaving asks first.
    form.reset({ ...now, ...filled }, { keepDefaultValues: true });
    ai.stop();
    focusNext.current = 'title';
  };

  let status = '';
  if (draft) status = t('new.describe.ready');
  else if (before) status = t('new.describe.filled');

  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-3xl border border-primary/30 bg-glass p-4"
    >
      <h3 id={headingId} className="flex items-center gap-2 text-base font-semibold">
        <Sparkles aria-hidden="true" className="size-5 text-primary" />
        {t('new.describe.title')}
      </h3>
      {mode !== 'basic' ? (
        <>
          <p className="text-sm text-muted">{t('new.describe.offer')}</p>
          <Button
            variant="secondary"
            className="min-h-11"
            onClick={() => {
              focusNext.current = 'words';
              form.setValue('mode', 'basic', { shouldDirty: true });
            }}
          >
            {t('new.describe.useBasic')}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            {t('new.describe.basicOn', { step: t('new.steps.mode') })}
          </p>
          <form
            noValidate
            className="space-y-2"
            onSubmit={(event) => {
              event.preventDefault();
              if (text.trim() && !ai.working) void ai.ask();
            }}
          >
            <label htmlFor={wordsId} className="block text-sm font-medium">
              {t('new.describe.words')}
            </label>
            <textarea
              id={wordsId}
              value={text}
              rows={2}
              maxLength={LIMITS.assist}
              aria-describedby={`${wordsId}-hint`}
              onChange={(event) => {
                setText(event.target.value);
              }}
              className="block min-h-12 w-full rounded-lg border border-border bg-surface px-3 py-2 text-text"
            />
            <p id={`${wordsId}-hint`} className="text-sm text-muted">
              {t('new.describe.example')}
            </p>
            <Button
              type="submit"
              className="min-h-11"
              aria-disabled={ai.working || !text.trim() || undefined}
            >
              <Sparkles aria-hidden="true" className="size-4" />
              {t('new.describe.draft')}
            </Button>
          </form>
          <AiProgress action={{ ...ai, stop: putAside }} manual={t('new.describe.manual')} />
          {draft && (
            <DraftPreview
              draft={draft}
              currency={form.getValues('currency')}
              onUse={() => {
                use(draft);
              }}
              onCancel={putAside}
            />
          )}
        </>
      )}
      {/* Kept mounted, so a draft coming in, or the steps filled in, is announced. */}
      <Alert tone="info">{status}</Alert>
      {before && !draft && (
        <Button
          variant="secondary"
          className="min-h-11"
          onClick={() => {
            form.reset(before, { keepDefaultValues: true });
            onBefore(null);
            focusNext.current = 'title';
          }}
        >
          <Undo2 aria-hidden="true" className="size-4" />
          {t('new.describe.putBack')}
        </Button>
      )}
    </section>
  );
}

/** The draft as it would fill the steps, worded as the check before saving words it: only what
 *  it gives (a currency, where it changes the form's). Nothing changes until "Fill in the steps";
 *  Cancel puts it aside. */
function DraftPreview({
  draft,
  currency,
  onUse,
  onCancel,
}: {
  draft: TripDraft;
  /** The form's, for a budget given without one. */
  currency: string;
  onUse: () => void;
  onCancel: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const headingId = useId();
  const language = i18n.language;
  const money = draft.currency ?? currency;
  const budget = draft.budget === undefined ? null : toMinor(draft.budget, money);
  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-2xl border border-border bg-surface p-4"
    >
      <h4 id={headingId} className="font-semibold">
        {t('new.describe.preview')}
      </h4>
      <dl className="grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[minmax(8rem,auto)_1fr]">
        <Row label={t('new.review.title')} value={draft.title} />
        <Row label={t('new.review.destinations')} value={placesOf(draft.destinations)} />
        <Row
          label={t('new.review.dates')}
          value={`${daysOf(draft, language)} · ${t('new.review.days', { count: lengthOf(draft) })}`}
        />
        {draft.departure_city && (
          <Row label={t('new.review.departure')} value={draft.departure_city} />
        )}
        {draft.trip_type && (
          <Row label={t('new.review.type')} value={t(`trip.types.${draft.trip_type}`)} />
        )}
        {draft.pace && <Row label={t('new.review.pace')} value={t(`trip.paces.${draft.pace}`)} />}
        {money !== currency && (
          <Row label={t('new.style.currency')} value={currencyLabel(money, language)} />
        )}
        {budget !== null && (
          <Row label={t('new.review.budget')} value={formatMoney(budget, money, language)} />
        )}
        {draft.interests && <Row label={t('new.review.interests')} value={draft.interests} />}
      </dl>
      <p className="text-sm text-muted">{t('new.describe.yours')}</p>
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="min-h-11" onClick={onCancel}>
          {tCommon('actions.cancel')}
        </Button>
        <Button className="min-h-11 flex-1" onClick={onUse}>
          <Check aria-hidden="true" className="size-4" />
          {t('new.describe.use')}
        </Button>
      </div>
    </section>
  );
}
