import { ArrowLeft, Check, Eye } from 'lucide-react';
import { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { UnsavedGuard } from '@/core/forms/unsaved-guard';
import { toInput, toMinor } from '@/core/utils/money';
import { Button, Dialog, SelectField, Switch, TextField } from '@/design-system';
import { ChangeList } from '@/modules/travel/change-list';
import { Failure } from '@/modules/travel/failure';
import { NS } from '@/modules/travel/i18n';
import {
  useAddActivity,
  useEditActivity,
  type Activity,
  type ActivityFields,
  type RecordChange,
} from '@/modules/travel/plan-api';
import { useUndoToast } from '@/modules/travel/removal';
import { useTripContext } from '@/modules/travel/trip-context';
import { dayOf } from '@/modules/travel/trip-words';
import { useWords } from '@/modules/travel/words';

/** Everything in the form is text, as typed; `fieldsOf` turns it into what the API takes. */
interface ActivityValues {
  title: string;
  kind: string;
  start_time: string;
  duration: string;
  location: string;
  transport: string;
  notes: string;
  cost: string;
  confirmed: boolean;
}

const given = (text: string) => text.trim() || null;
const minutesOf = (text: string) => (/^\d+$/.test(text.trim()) ? Number(text.trim()) : null);

function valuesOf(activity: Activity | null, kind: string, currency: string): ActivityValues {
  const cost = activity?.estimated_cost_minor ?? null;
  return {
    title: activity?.title ?? '',
    kind: activity?.kind ?? kind,
    start_time: activity?.start_time ?? '',
    duration: activity?.duration_minutes ? String(activity.duration_minutes) : '',
    location: activity?.location ?? '',
    transport: activity?.transport ?? '',
    notes: activity?.notes ?? '',
    cost: cost === null ? '' : toInput(cost, currency),
    confirmed: activity?.confirmed ?? false,
  };
}

/** The fields as the API takes them. An emptied one is no value; the booking it links to isn't
 *  here, so an edit leaves it as it is. */
function fieldsOf(values: ActivityValues, currency: string): Omit<ActivityFields, 'booking_id'> {
  return {
    title: values.title.trim(),
    kind: values.kind,
    start_time: values.start_time || null,
    duration_minutes: minutesOf(values.duration),
    location: given(values.location),
    transport: given(values.transport),
    notes: given(values.notes),
    estimated_cost_minor: values.cost.trim() ? toMinor(values.cost, currency) : null,
    confirmed: values.confirmed,
  };
}

/** An edit as "What changed?" says it: each field that differs, from and to. */
function changeOf(activity: Activity, fields: ReturnType<typeof fieldsOf>): RecordChange {
  const lines = Object.entries(fields)
    .filter(([name, value]) => activity[name as keyof typeof fields] !== value)
    .map(([name, value]) => ({
      field: name,
      old: activity[name as keyof typeof fields],
      new: value,
    }));
  return {
    entity: 'activity',
    op: 'set',
    record_id: activity.id,
    title: activity.title,
    day: activity.day,
    fields: lines,
  };
}

/**
 * Add an activity to a day, or edit one, in a dialog. A new one is sent with one key for the
 * form's whole life, so a retry after a lost reply can't add it twice. An edit shows what it
 * would change first, then goes as of the revision opened; one changed elsewhere since offers
 * the latest instead; one that differs in nothing has nothing to make. Either is said with a way
 * to take back exactly the event it answered (none if the server found nothing to change).
 */
export function ActivityForm({
  activity,
  day,
  onClose,
  onReload,
}: {
  /** The activity being edited, or null for a new one on `day`. */
  activity: Activity | null;
  day: string;
  onClose: () => void;
  onReload: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { trip, options } = useTripContext();
  const words = useWords();
  const add = useAddActivity(trip.id);
  const edit = useEditActivity();
  const save = activity ? edit : add;
  const undoable = useUndoToast();
  const [key] = useState(() => crypto.randomUUID());
  // An edit, shown before it is made.
  const [review, setReview] = useState<RecordChange | null>(null);
  const sending = useRef(false);
  const { currency } = trip;
  const form = useForm<ActivityValues>({
    defaultValues: valuesOf(activity, options.activity_kinds[0] ?? 'other', currency),
  });
  const { errors, isDirty } = form.formState;

  const send = async (values: ActivityValues) => {
    // A second press, while the first is on its way or once it is saved, isn't sent again.
    if (sending.current) return;
    sending.current = true;
    const fields = fieldsOf(values, currency);
    const saved = await (
      activity
        ? edit.mutateAsync({
            id: activity.id,
            body: { ...fields, revision_no: activity.revision_no },
          })
        : add.mutateAsync({ body: { ...fields, day }, key })
    ).catch(() => null);
    if (!saved) {
      sending.current = false; // shown from save.error, and can be tried again
      return;
    }
    undoable(saved, t(activity ? 'activity.saved' : 'activity.added', { title: saved.title }));
    onClose();
  };
  // An edit whose every field is as saved (a space typed and taken out, say) has nothing to make.
  const differs = Boolean(review?.fields?.length);

  // An edit is shown first; a new one goes at once.
  const submitted = async (values: ActivityValues) => {
    if (activity) setReview(changeOf(activity, fieldsOf(values, currency)));
    else await send(values);
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={
        activity
          ? t('activity.editTitle', { title: activity.title })
          : t('activity.addTitle', { day: dayOf(day, i18n.language) })
      }
    >
      <UnsavedGuard dirty={isDirty && !save.isSuccess} />
      <Failure
        error={save.error}
        onReload={() => {
          save.reset();
          setReview(null);
          onReload();
        }}
      />
      {review && (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-muted">{t('change.previewIntro')}</p>
          {differs ? (
            <ChangeList
              result={{ what_changed: [review], needs_review: [], kept: [], days: [] }}
              planned
              currency={currency}
            />
          ) : (
            <p>{t('change.asSaved')}</p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => {
                save.reset();
                setReview(null);
              }}
            >
              <ArrowLeft aria-hidden="true" className="size-4" />
              {t('change.back')}
            </Button>
            <Button
              className="min-h-11 flex-1"
              disabled={!differs || save.isPending || save.isSuccess}
              onClick={() => void send(form.getValues())}
            >
              <Check aria-hidden="true" className="size-4" />
              {t('change.apply')}
            </Button>
          </div>
        </div>
      )}
      {/* Kept while its change is shown, so Back finds everything as it was typed. */}
      <form
        noValidate
        hidden={review !== null}
        className="mt-4 space-y-4"
        onSubmit={(event) => void form.handleSubmit(submitted)(event)}
      >
        <TextField
          label={t('activity.name')}
          maxLength={120}
          autoComplete="off"
          error={errors.title?.message}
          {...form.register('title', {
            validate: (value) => value.trim() !== '' || t('activity.nameError'),
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
          <TextField type="time" label={t('activity.time')} {...form.register('start_time')} />
        </div>
        <TextField
          label={t('activity.duration')}
          inputMode="numeric"
          autoComplete="off"
          error={errors.duration?.message}
          {...form.register('duration', {
            validate: (value) =>
              value.trim() === '' || (minutesOf(value) ?? 0) > 0 || t('activity.durationError'),
          })}
        />
        <TextField
          label={t('activity.location')}
          maxLength={200}
          autoComplete="off"
          {...form.register('location')}
        />
        <TextField
          label={t('activity.transport')}
          maxLength={200}
          autoComplete="off"
          {...form.register('transport')}
        />
        <TextField
          label={t('activity.cost', { currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.cost?.message}
          {...form.register('cost', {
            validate: (value) =>
              value.trim() === '' || toMinor(value, currency) !== null || t('activity.costError'),
          })}
        />
        <TextField
          label={t('activity.notes')}
          maxLength={1000}
          autoComplete="off"
          {...form.register('notes')}
        />
        <Controller
          control={form.control}
          name="confirmed"
          render={({ field }) => (
            <Switch
              label={t('activity.confirmed')}
              description={t('activity.confirmedHint')}
              checked={field.value}
              onCheckedChange={field.onChange}
            />
          )}
        />
        {activity ? (
          <Button type="submit" className="min-h-11 w-full" disabled={!isDirty}>
            <Eye aria-hidden="true" className="size-4" />
            {t('change.preview')}
          </Button>
        ) : (
          <Button
            type="submit"
            className="min-h-11 w-full"
            disabled={save.isPending || save.isSuccess}
          >
            {t('activity.save')}
          </Button>
        )}
      </form>
    </Dialog>
  );
}
