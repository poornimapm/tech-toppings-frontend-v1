import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import type { AgentRun } from '@/core/agents/queries';
import { useSession } from '@/core/auth/session-store';
import { UnsavedGuard } from '@/core/forms/unsaved-guard';
import { errorKey } from '@/core/i18n';
import { ScanPhoto } from '@/core/scan/scan-photo';
import { todayIn } from '@/core/utils/dates';
import { toInput, toMinor } from '@/core/utils/money';
import { Alert, Button, Dialog, TextField, toast } from '@/design-system';
import {
  failureCode,
  TEXT_MAX,
  useDeleteReceipt,
  useSaveReceipt,
  type Receipt,
  type ReceiptInput,
  type ReceiptOptions,
} from '@/modules/receipts/api';
import { draftOf, DRAFT_TOOL, type BillDraft } from '@/modules/receipts/bill-draft';
import { NS } from '@/modules/receipts/i18n';
import { endsOn, lengthOf, monthsAfter, type Length } from '@/modules/receipts/warranty';

/** The skill that reads a bill into a receipt, from its photo (AI) or its text (rules, or AI). */
export const SCAN_SKILL = 'scan-bill';

const CHOICE =
  'inline-flex min-h-11 cursor-pointer items-center rounded-full border border-border bg-surface/60 px-4 py-2 text-sm ' +
  'has-checked:border-primary has-checked:bg-primary/10 has-checked:font-semibold ' +
  'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-[var(--tt-focus)]';

/** Everything in the form is text, as typed; `bodyOf` turns it into what the API takes. */
interface FormValues {
  text: string;
  shop: string;
  bought_on: string;
  amount: string;
  length: Length;
  /** The end date when the length is 'other'. */
  ends_on: string;
  remind_days: string;
  bill_number: string;
  serial_number: string;
  note: string;
}

function valuesOf(
  receipt: Receipt | null,
  draft: BillDraft | null,
  options: ReceiptOptions,
  today: string,
): FormValues {
  if (receipt) {
    const ends = receipt.warranty_ends_on;
    const length = lengthOf(receipt.bought_on, ends, options.quick_months);
    return {
      text: receipt.text,
      shop: receipt.shop ?? '',
      bought_on: receipt.bought_on,
      amount: receipt.amount_minor === null ? '' : toInput(receipt.amount_minor, receipt.currency),
      length,
      ends_on: length === 'other' ? (ends ?? '') : '',
      remind_days: String(receipt.remind_days_before),
      bill_number: receipt.bill_number ?? '',
      serial_number: receipt.serial_number ?? '',
      note: receipt.note ?? '',
    };
  }
  const bought = draft?.bought_on && draft.bought_on <= today ? draft.bought_on : today;
  const months = draft?.warranty_months;
  const quick = months !== undefined && options.quick_months.includes(months);
  return {
    text: draft?.text ?? '',
    shop: draft?.shop ?? '',
    bought_on: bought,
    amount: draft?.amount === undefined ? '' : String(draft.amount),
    length: months === undefined ? 'none' : quick ? `${months}` : 'other',
    ends_on: months !== undefined && !quick ? monthsAfter(bought, months) : '',
    remind_days: String(options.remind_days_before),
    bill_number: draft?.bill_number ?? '',
    serial_number: draft?.serial_number ?? '',
    note: '',
  };
}

function bodyOf(values: FormValues, currency: string): ReceiptInput {
  const ends = endsOn(values.bought_on, values.length, values.ends_on);
  return {
    text: values.text.trim(),
    shop: values.shop.trim() || null,
    bought_on: values.bought_on,
    amount_minor: values.amount.trim() ? toMinor(values.amount, currency) : null,
    warranty_ends_on: ends || null,
    remind_days_before: Number(values.remind_days),
    bill_number: values.bill_number.trim() || null,
    serial_number: values.serial_number.trim() || null,
    note: values.note.trim() || null,
  };
}

/** The bill draft's field each form field is filled from, to ask for a check where it was
 *  read with doubt. */
const READ_FROM: Partial<Record<keyof FormValues, string>> = {
  text: 'text',
  shop: 'shop',
  bought_on: 'bought_on',
  amount: 'amount',
  length: 'warranty_months',
  bill_number: 'bill_number',
  serial_number: 'serial_number',
};

/** A receipt to keep or change: what was bought and where, when and for how much, and its
 *  warranty, with a reminder before it ends. A new one can be filled in from a bill's photo. */
export function ReceiptForm({
  receipt,
  draft: handed,
  options,
}: {
  receipt: Receipt | null;
  /** A bill read by the assistant, to fill a new receipt with. */
  draft: BillDraft | null;
  options: ReceiptOptions;
}) {
  const { t } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const navigate = useNavigate();
  const user = useSession((state) => state.user);
  const today = todayIn(user?.timezone);
  const currency = receipt?.currency ?? user?.base_currency ?? '';
  const save = useSaveReceipt();
  const remove = useDeleteReceipt();
  const [asking, setAsking] = useState(false);
  // Saved or deleted: the page goes back to the list once the guard is gone (it would ask).
  const [done, setDone] = useState(false);
  // A bill read into the form, and the values it gave: a field it read with doubt asks for a
  // check until it is changed.
  const [bill, setBill] = useState(() =>
    handed ? { draft: handed, filled: valuesOf(null, handed, options, today) } : null,
  );
  const form = useForm<FormValues>({
    defaultValues: bill?.filled ?? valuesOf(receipt, null, options, today),
  });
  const { errors, isDirty } = form.formState;
  const values = useWatch({ control: form.control });
  const failure = failureCode(save.error);
  const years = Math.floor(options.max_months / 12);

  const check = (field: keyof FormValues) => {
    const from = READ_FROM[field];
    const doubted = bill && from && bill.draft.uncertain.includes(from);
    return doubted && values[field] === bill.filled[field] ? t('form.check') : undefined;
  };

  const lengthLabel = (value: Length) => {
    if (value === 'none' || value === 'other') return t(`form.lengths.${value}`);
    const months = Number(value);
    return months % 12 === 0
      ? t('form.lengths.years', { count: months / 12 })
      : t('form.lengths.months', { count: months });
  };

  const read = (run: AgentRun) => {
    const action = run.client_actions.find((one) => one.tool === DRAFT_TOOL);
    const draft = action ? draftOf(action.arguments) : null;
    if (!draft) return;
    const filled = valuesOf(null, draft, options, today);
    setBill({ draft, filled });
    form.reset(filled);
  };

  const submit = form.handleSubmit(async (values) => {
    const body = bodyOf(values, currency);
    const saved = await save.mutateAsync({ id: receipt?.id, body }).catch(() => null);
    if (!saved) return; // shown from save.error
    const said = receipt
      ? t('form.saved', { text: saved.text })
      : t(saved.warranty_ends_on ? 'form.added' : 'form.addedPlain', { text: saved.text });
    toast(said, { tone: 'success' });
    setDone(true);
  });

  useEffect(() => {
    if (done) void navigate('..', { relative: 'path' });
  }, [done, navigate]);

  const deleteIt = () => {
    if (!receipt || remove.isPending) return;
    remove.mutate(receipt.id, {
      onSuccess: () => {
        setAsking(false);
        toast(t('form.deleted', { text: receipt.text }), { tone: 'success' });
        setDone(true);
      },
    });
  };

  return (
    <>
      {/* A bill read in is unsaved input too, changed or not. */}
      {!done && <UnsavedGuard dirty={isDirty || bill !== null} />}
      {!receipt && (
        <ScanPhoto
          skill={SCAN_SKILL}
          texts={{
            button: t('scan.button'),
            pick: t('scan.pick'),
            sending: t('scan.sending'),
            reading: t('scan.reading'),
            progress: t('scan.progress'),
            unreadable: t('scan.unreadable'),
          }}
          describe={(run) => (run.message_code === 'scan-bill.ready' ? t('scan.filled') : null)}
          onRead={read}
        />
      )}
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
        <TextField
          label={t('form.text')}
          hint={check('text') ?? t('form.textHint')}
          maxLength={TEXT_MAX}
          autoComplete="off"
          error={errors.text?.message}
          {...form.register('text', {
            validate: (value) => value.trim() !== '' || t('form.textError'),
          })}
        />
        <TextField
          label={t('form.shop')}
          hint={check('shop')}
          maxLength={80}
          autoComplete="off"
          {...form.register('shop')}
        />
        <TextField
          type="date"
          label={t('form.bought')}
          hint={check('bought_on')}
          max={today}
          error={errors.bought_on?.message}
          {...form.register('bought_on', {
            validate: (value) => (value !== '' && value <= today) || t('form.boughtError'),
          })}
        />
        <TextField
          label={t('form.amount', { currency })}
          hint={check('amount')}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value) =>
              value.trim() === '' || (toMinor(value, currency) ?? 0) > 0 || t('form.amountError'),
          })}
        />

        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('form.warranty')}</legend>
          {check('length') && <p className="mb-1 text-xs text-muted">{check('length')}</p>}
          <div className="flex flex-wrap gap-2">
            {(
              ['none', ...options.quick_months.map((months) => `${months}`), 'other'] as Length[]
            ).map((value) => (
              <label key={value} className={CHOICE}>
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...form.register('length')}
                />
                {lengthLabel(value)}
              </label>
            ))}
          </div>
        </fieldset>
        {values.length === 'other' && (
          <TextField
            type="date"
            label={t('form.endsOn')}
            error={errors.ends_on?.message}
            {...form.register('ends_on', {
              validate: (value, values) => {
                const bought = values.bought_on;
                const latest = bought ? monthsAfter(bought, options.max_months) : '';
                const fits = value !== '' && value >= bought && (!latest || value <= latest);
                return fits || t('form.endsError', { years });
              },
            })}
          />
        )}
        {values.length !== 'none' && (
          <TextField
            label={t('form.remind')}
            hint={t('form.remindHint')}
            inputMode="numeric"
            autoComplete="off"
            error={errors.remind_days?.message}
            {...form.register('remind_days', {
              validate: (value) => {
                const days = Number(value);
                const fits =
                  /^\d+$/.test(value.trim()) && days >= 0 && days <= options.max_remind_days;
                return fits || t('form.remindError', { max: options.max_remind_days });
              },
            })}
          />
        )}
        <TextField
          label={t('form.billNumber')}
          hint={check('bill_number')}
          maxLength={40}
          autoComplete="off"
          {...form.register('bill_number')}
        />
        <TextField
          label={t('form.serialNumber')}
          hint={check('serial_number')}
          maxLength={60}
          autoComplete="off"
          {...form.register('serial_number')}
        />
        <TextField
          label={t('form.note')}
          maxLength={500}
          autoComplete="off"
          {...form.register('note')}
        />

        <div className="flex flex-wrap gap-2">
          <Button type="submit" className="min-h-11 flex-1" disabled={save.isPending}>
            {t('form.save')}
          </Button>
          {receipt && (
            <Button
              variant="secondary"
              className="min-h-11"
              onClick={() => {
                setAsking(true);
              }}
            >
              {t('form.delete')}
            </Button>
          )}
        </div>
      </form>
      {receipt && (
        <Dialog
          open={asking}
          onOpenChange={setAsking}
          title={t('form.deleteTitle')}
          description={t('form.deleteBody', { text: receipt.text })}
        >
          {/* Cancel first: the focus lands on it, so Enter alone never deletes. */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setAsking(false);
              }}
            >
              {tCommon('actions.cancel')}
            </Button>
            <Button aria-disabled={remove.isPending || undefined} onClick={deleteIt}>
              {t('form.delete')}
            </Button>
          </div>
        </Dialog>
      )}
    </>
  );
}
