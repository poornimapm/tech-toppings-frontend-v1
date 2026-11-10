import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { UnsavedGuard } from '@/core/forms/unsaved-guard';
import { errorKey } from '@/core/i18n';
import { cx } from '@/core/utils/cx';
import { Alert, Button, toast } from '@/design-system';
import { failureCode, useAddTrip, useOptions, type Options } from '@/modules/travel/api';
import { NS } from '@/modules/travel/i18n';
import { ModeCards } from '@/modules/travel/mode-cards';
import { PeopleStep } from '@/modules/travel/people-step';
import { PlaceStep } from '@/modules/travel/place-step';
import { StyleStep } from '@/modules/travel/style-step';
import {
  blankTrip,
  bodyOf,
  STEP_FIELDS,
  STEPS,
  type Step,
  type TripValues,
} from '@/modules/travel/trip-form';
import { TripReview } from '@/modules/travel/trip-review';
import { Waiting } from '@/modules/travel/waiting';

/** Planning a trip, step by step: what the form offers comes from the server first. */
export function NewTripPage() {
  const { t } = useTranslation(NS);
  const options = useOptions();
  const currency = useSession((state) => state.user?.base_currency) ?? 'INR';
  if (!options.data) {
    return <Waiting query={options} failed={t('new.loadError')} className="h-96 rounded-3xl" />;
  }
  return <TripSteps options={options.data} currency={currency} />;
}

/**
 * The guided steps: where and when, who, style and budget, the mode, then everything to check
 * and change before it is saved. Each step is checked before the next; Enter moves on, and the
 * focus goes to each new step's heading. The trip is sent with one key, so a retry after a
 * failure can't plan it twice.
 */
function TripSteps({ options, currency }: { options: Options; currency: string }) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const navigate = useNavigate();
  const own = useSession((state) => state.user?.timezone);
  const add = useAddTrip();
  const form = useForm<TripValues>({ defaultValues: blankTrip(currency) });
  const [step, setStep] = useState<Step>('place');
  // Sent back from the check to change one part: Next returns there.
  const [checking, setChecking] = useState(false);
  const [key] = useState(() => crypto.randomUUID());
  // Saved: the page goes back to Home once the guard is gone (it would ask).
  const [done, setDone] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const moved = useRef(false);
  const sending = useRef(false);
  const headingId = useId();
  const index = STEPS.indexOf(step);
  const failure = failureCode(add.error);

  const go = (next: Step) => {
    moved.current = true;
    setStep(next);
  };

  useEffect(() => {
    if (moved.current) heading.current?.focus();
  }, [step]);

  useEffect(() => {
    if (done) void navigate('..', { relative: 'path' });
  }, [done, navigate]);

  const forward = async () => {
    if (!(await form.trigger(STEP_FIELDS[step], { shouldFocus: true }))) return;
    setChecking(false);
    go(checking ? 'review' : (STEPS[index + 1] ?? 'review'));
  };

  const send = async (filled: TripValues) => {
    // A second press, while the first is on its way or once it is saved, isn't sent again.
    if (sending.current) return;
    sending.current = true;
    const saved = await add.mutateAsync({ body: bodyOf(filled, own), key }).catch(() => null);
    if (!saved) {
      sending.current = false; // shown from add.error, and can be tried again
      return;
    }
    toast(t('new.saved', { title: saved.title }), { tone: 'success' });
    setDone(true);
  };

  return (
    <section aria-labelledby={headingId} className="mx-auto max-w-2xl space-y-5">
      {!done && <UnsavedGuard dirty={form.formState.isDirty} />}
      <div className="space-y-2">
        <p className="text-sm text-muted">
          {t('new.progress', { number: index + 1, count: STEPS.length })}
        </p>
        <h2
          ref={heading}
          id={headingId}
          tabIndex={-1}
          className="text-2xl font-bold tracking-tight"
        >
          {t(`new.steps.${step}`)}
        </h2>
        <ol aria-label={t('new.title')} className="flex gap-1">
          {STEPS.map((each, at) => (
            <li
              key={each}
              aria-current={each === step ? 'step' : undefined}
              className={cx('h-1.5 flex-1 rounded-full', at <= index ? 'bg-primary' : 'bg-border')}
            >
              <span className="sr-only">{t(`new.steps.${each}`)}</span>
            </li>
          ))}
        </ol>
      </div>
      <form
        noValidate
        className="space-y-5"
        onSubmit={(event) => {
          if (step === 'review') {
            void form.handleSubmit(send)(event);
            return;
          }
          event.preventDefault();
          void forward();
        }}
      >
        {step === 'place' && <PlaceStep form={form} options={options} />}
        {step === 'people' && <PeopleStep form={form} options={options} />}
        {step === 'style' && <StyleStep form={form} options={options} />}
        {step === 'mode' && (
          <ModeCards field={form.register('mode')} premiumAvailable={options.premium_available} />
        )}
        {step === 'review' && (
          <>
            {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
            {/* Read once: nothing changes while the check is on screen. */}
            <TripReview
              values={form.getValues()}
              onEdit={(part) => {
                setChecking(true);
                go(part);
              }}
            />
          </>
        )}
        <div className="flex flex-wrap gap-2">
          {index > 0 && !checking && (
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => {
                go(STEPS[index - 1] ?? 'place');
              }}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t('new.back')}
            </Button>
          )}
          {step === 'review' ? (
            <Button type="submit" className="min-h-11 flex-1" disabled={add.isPending}>
              <Check aria-hidden="true" className="size-4" />
              {t('new.save')}
            </Button>
          ) : (
            <Button type="submit" className="min-h-11 flex-1">
              {t(checking ? 'new.toReview' : 'new.next')}
              <ArrowRight aria-hidden="true" className="size-4" />
            </Button>
          )}
        </div>
      </form>
    </section>
  );
}
