import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { UnsavedGuard } from '@/core/forms/unsaved-guard';
import { Button, Dialog, SelectField, TextField, toast } from '@/design-system';
import {
  asSuggested,
  useAddItem,
  useEditItem,
  type Bag,
  type ChecklistItem,
} from '@/modules/travel/checklist-api';
import { Failure } from '@/modules/travel/failure';
import { NS } from '@/modules/travel/i18n';
import { useTripContext } from '@/modules/travel/trip-context';
import { daysIn, weekdayOf } from '@/modules/travel/trip-words';
import { useWords } from '@/modules/travel/words';

interface ItemValues {
  title: string;
  quantity: string;
  bag: string;
  /** '' is the whole trip. */
  day: string;
}

const countOf = (text: string) => (/^\d+$/.test(text.trim()) ? Number(text.trim()) : 0);

/**
 * Add an item, or edit one, in a dialog: a packing item goes in a bag, any other is for the
 * whole trip or one of its days (one tied to an activity stays on that activity's day). A new one
 * goes with one key for the form's life; an edit, as of the revision opened.
 */
export function ItemForm({
  item,
  packing,
  day,
  onClose,
  onReload,
  onSaved,
}: {
  /** The item being edited, or null for a new one. */
  item: ChecklistItem | null;
  /** A packing item (in a bag), or one to do. */
  packing: boolean;
  /** Where a new one to do goes: a day, or null for the whole trip. */
  day: string | null;
  onClose: () => void;
  onReload: () => void;
  /** Told the item as saved: the page shows where it went (on another day, say). */
  onSaved?: (saved: ChecklistItem) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { trip, options } = useTripContext();
  const words = useWords();
  const add = useAddItem(trip.id);
  const edit = useEditItem();
  const save = item ? edit : add;
  const [key] = useState(() => crypto.randomUUID());
  const sending = useRef(false);
  const name = item ? words.item(item.title, item.suggestion_key, asSuggested(item)) : '';
  const form = useForm<ItemValues>({
    defaultValues: {
      title: name,
      quantity: String(item?.quantity ?? 1),
      bag: item?.bag ?? options.bags[0] ?? '',
      day: item ? (item.day ?? '') : (day ?? ''),
    },
  });
  const { errors, isDirty } = form.formState;
  const max = options.max_item_quantity;
  // A day is chosen only for one to do that isn't tied to an activity.
  const daily = !packing && !item?.activity_id;

  const send = async (values: ItemValues) => {
    // A second press, while the first is on its way or once it is saved, isn't sent again.
    if (sending.current) return;
    sending.current = true;
    const title = values.title.trim();
    const fields = {
      quantity: countOf(values.quantity),
      ...(packing ? { bag: values.bag as Bag } : {}),
      ...(daily ? { day: values.day || null } : {}),
    };
    // A suggestion's name is shown in the reader's words: sent only once really changed.
    const renamed = title === name ? {} : { title };
    const saved = await (
      item
        ? edit.mutateAsync({
            id: item.id,
            body: { ...fields, ...renamed, revision_no: item.revision_no },
          })
        : add.mutateAsync({ body: { title, state: 'not_started', ...fields }, key })
    ).catch(() => null);
    if (!saved) {
      sending.current = false; // shown from save.error, and can be tried again
      return;
    }
    const named = words.item(saved.title, saved.suggestion_key, asSuggested(saved));
    toast(t(item ? 'checklist.saved' : 'checklist.added', { title: named }), { tone: 'success' });
    onSaved?.(saved);
    onClose();
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={item ? t('checklist.editTitle', { title: name }) : t('checklist.addTitle')}
    >
      <UnsavedGuard dirty={isDirty && !save.isSuccess} />
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) => void form.handleSubmit(send)(event)}
      >
        <Failure
          error={save.error}
          onReload={() => {
            save.reset();
            onReload();
          }}
        />
        <TextField
          label={t('checklist.name')}
          maxLength={120}
          autoComplete="off"
          error={errors.title?.message}
          {...form.register('title', {
            validate: (value) => value.trim() !== '' || t('checklist.nameError'),
          })}
        />
        <div className="grid grid-cols-2 gap-3">
          <TextField
            label={t('checklist.howMany')}
            inputMode="numeric"
            autoComplete="off"
            error={errors.quantity?.message}
            {...form.register('quantity', {
              validate: (value) =>
                (countOf(value) >= 1 && countOf(value) <= max) ||
                t('checklist.howManyError', { max }),
            })}
          />
          {packing && (
            <SelectField
              label={t('checklist.bag')}
              options={options.bags.map((bag) => ({ value: bag, label: t(`bags.${bag}`) }))}
              {...form.register('bag')}
            />
          )}
          {daily && (
            <SelectField
              label={t('checklist.day')}
              options={[
                { value: '', label: t('checklist.wholeTrip') },
                ...daysIn(trip).map((each) => ({
                  value: each,
                  label: weekdayOf(each, i18n.language),
                })),
              ]}
              {...form.register('day')}
            />
          )}
        </div>
        <Button
          type="submit"
          className="min-h-11 w-full"
          disabled={save.isPending || save.isSuccess}
        >
          {t('checklist.save')}
        </Button>
      </form>
    </Dialog>
  );
}
