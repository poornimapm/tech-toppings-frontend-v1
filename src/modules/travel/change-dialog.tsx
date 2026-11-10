import { ArrowLeft, Check, Eye, Undo2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { Button, Dialog, SelectField, TextField, toast } from '@/design-system';
import { ChangeList } from '@/modules/travel/change-list';
import { Failure } from '@/modules/travel/failure';
import { NS } from '@/modules/travel/i18n';
import {
  useChangeActivity,
  useUndo,
  type Activity,
  type ChangeAction,
  type ChangeInput,
  type ChangeResult,
} from '@/modules/travel/plan-api';
import { useTripContext } from '@/modules/travel/trip-context';
import { daysIn, weekdayOf } from '@/modules/travel/trip-words';
import { useOnce } from '@/modules/travel/use-once';
import { useWords } from '@/modules/travel/words';

interface ChangeValues {
  note: string;
  title: string;
  kind: string;
  time: string;
  day: string;
  new_time: string;
}

/** The change as the API takes it, for a preview or for real, as of the revision seen. */
function bodyOf(
  action: ChangeAction,
  activity: Activity,
  values: ChangeValues,
  apply: boolean,
): ChangeInput {
  const base = { action, apply, revision_no: activity.revision_no };
  if (action === 'reschedule') {
    return {
      ...base,
      new_day: values.day === activity.day ? null : values.day,
      new_start_time: values.new_time || null,
    };
  }
  const note = { ...base, actual_note: values.note.trim() || null };
  if (action !== 'replace') return note;
  return {
    ...note,
    new_activity: {
      title: values.title.trim(),
      kind: values.kind,
      start_time: values.time || null,
      confirmed: false,
    },
  };
}

/**
 * Marking an activity done, skipping, replacing or rescheduling it, in three steps: what the
 * change is; what it would do, with nothing written yet (what it changes, what to look at, what
 * of the person's own work it keeps); then "What changed?", with a way to take it all back.
 */
export function ChangeDialog({
  activity,
  action,
  onClose,
  onReload,
}: {
  activity: Activity;
  action: ChangeAction;
  onClose: () => void;
  /** The activity changed elsewhere: the latest is asked for. */
  onReload: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { trip, options } = useTripContext();
  const words = useWords();
  const preview = useChangeActivity();
  const apply = useChangeActivity();
  const undo = useUndo();
  const [shown, setShown] = useState<ChangeResult | null>(null);
  const [done, setDone] = useState<ChangeResult | null>(null);
  const form = useForm<ChangeValues>({
    defaultValues: {
      note: '',
      title: '',
      kind: activity.kind,
      time: activity.start_time ?? '',
      day: activity.day,
      new_time: '',
    },
  });
  const { errors } = form.formState;
  const failed = undo.error ?? apply.error ?? preview.error;

  const ask = form.handleSubmit(async (values) => {
    const result = await preview
      .mutateAsync({ id: activity.id, body: bodyOf(action, activity, values, false) })
      .catch(() => null); // shown from preview.error
    if (result) setShown(result);
  });

  const commit = useOnce(async () => {
    const result = await apply
      .mutateAsync({ id: activity.id, body: bodyOf(action, activity, form.getValues(), true) })
      .catch(() => null); // shown from apply.error
    if (result) setDone(result);
    return result !== null;
  });

  const takeBack = useOnce(async () => {
    const undone = await undo.mutateAsync(done?.event_id ?? '').catch(() => null);
    if (undone) {
      toast(t('change.undone'), { tone: 'success' });
      onClose();
    }
    return undone !== null;
  });

  const reload = () => {
    for (const each of [preview, apply, undo]) each.reset();
    setShown(null);
    onReload();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        done ? t('change.whatChanged') : t(`change.titles.${action}`, { title: activity.title })
      }
    >
      <div className="space-y-4">
        <Failure error={failed} onReload={reload} />
        {done ? (
          <>
            <ChangeList result={done} planned={false} currency={trip.currency} />
            <div className="flex flex-wrap gap-2">
              {done.event_id && (
                <Button
                  variant="secondary"
                  className="min-h-11"
                  aria-disabled={undo.isPending || undefined}
                  onClick={takeBack}
                >
                  <Undo2 aria-hidden="true" className="size-4" />
                  {t('change.undo')}
                </Button>
              )}
              <Button className="min-h-11 flex-1" onClick={onClose}>
                {t('change.close')}
              </Button>
            </div>
          </>
        ) : shown ? (
          <>
            <p className="text-sm text-muted">{t('change.previewIntro')}</p>
            <ChangeList result={shown} planned currency={trip.currency} />
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                className="min-h-11"
                onClick={() => {
                  preview.reset();
                  apply.reset();
                  setShown(null);
                }}
              >
                <ArrowLeft aria-hidden="true" className="size-4" />
                {t('change.back')}
              </Button>
              <Button
                className="min-h-11 flex-1"
                aria-disabled={apply.isPending || undefined}
                onClick={commit}
              >
                <Check aria-hidden="true" className="size-4" />
                {t('change.apply')}
              </Button>
            </div>
          </>
        ) : (
          <form noValidate className="space-y-4" onSubmit={(event) => void ask(event)}>
            {action === 'replace' && (
              <>
                <TextField
                  label={t('change.newTitle')}
                  maxLength={120}
                  autoComplete="off"
                  error={errors.title?.message}
                  {...form.register('title', {
                    validate: (value) => value.trim() !== '' || t('change.newTitleError'),
                  })}
                />
                <div className="grid grid-cols-2 gap-3">
                  <SelectField
                    label={t('activity.kind')}
                    options={options.activity_kinds.map((kind) => ({
                      value: kind,
                      label: words.kind(kind),
                    }))}
                    {...form.register('kind')}
                  />
                  <TextField type="time" label={t('activity.time')} {...form.register('time')} />
                </div>
              </>
            )}
            {action === 'reschedule' ? (
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label={t('change.newDay')}
                  options={daysIn(trip).map((day) => ({
                    value: day,
                    label: weekdayOf(day, i18n.language),
                  }))}
                  error={errors.day?.message}
                  {...form.register('day', {
                    validate: (value, values) =>
                      value !== activity.day ||
                      (values.new_time !== '' && values.new_time !== activity.start_time) ||
                      t('change.sameError'),
                  })}
                />
                <TextField
                  type="time"
                  label={t('change.newTime')}
                  {...form.register('new_time', { deps: ['day'] })}
                />
              </div>
            ) : (
              <TextField
                label={t(`change.notes.${action}`)}
                maxLength={500}
                autoComplete="off"
                {...form.register('note')}
              />
            )}
            <Button type="submit" className="min-h-11 w-full" disabled={preview.isPending}>
              <Eye aria-hidden="true" className="size-4" />
              {t('change.preview')}
            </Button>
          </form>
        )}
      </div>
    </Dialog>
  );
}
