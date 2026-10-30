import { Camera, IdCard } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { errorKey } from '@/core/i18n';
import { shrinkTo } from '@/core/scan/photo-reader';
import { toInput, toMinor } from '@/core/utils/money';
import { Alert, Button, Dialog, TextField, toast } from '@/design-system';
import {
  failureCode,
  usePicture,
  usePutPicture,
  useSaveWorker,
  type Options,
  type Picture,
  type Project,
  type Worker,
  type WorkerInput,
} from '@/modules/labor/api';
import { CHOICE } from '@/modules/labor/choice';
import { NS } from '@/modules/labor/i18n';

interface FormValues {
  name: string;
  gender: '' | 'female' | 'male' | 'other';
  phone: string;
  code: string;
  wage: string;
  notes: string;
}

/** The project's default wage for a new worker of this gender, as the server would pick it. */
function defaultWage(project: Project, gender: FormValues['gender']): number {
  const { rates } = project;
  if (rates.by_gender && gender === 'female') return rates.female_minor;
  if (rates.by_gender && gender === 'male') return rates.male_minor;
  return rates.default_minor;
}

/** A picture taken or picked, shrunk on the phone to what the server keeps. */
function PictureField({
  which,
  existing,
  picked,
  maxBytes,
  side,
  onPick,
}: {
  which: Picture;
  existing: string | null;
  picked: Blob | null;
  maxBytes: number;
  side: number;
  onPick: (photo: Blob) => void;
}) {
  const { t } = useTranslation(NS);
  const input = useRef<HTMLInputElement>(null);
  const preview = useMemo(() => (picked ? URL.createObjectURL(picked) : null), [picked]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const [failed, setFailed] = useState(false);
  const shown = preview ?? existing;
  const Icon = which === 'photo' ? Camera : IdCard;

  return (
    <div className="flex items-center gap-3">
      {shown ? (
        <img
          src={shown}
          alt={t(`worker.${which}Alt`)}
          className="size-16 rounded-2xl object-cover"
        />
      ) : (
        <span className="flex size-16 items-center justify-center rounded-2xl border border-dashed border-border text-muted">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      )}
      <input
        ref={input}
        type="file"
        accept="image/*"
        // The phone opens its camera: the front one for a face, the back one for a card.
        capture={which === 'photo' ? 'user' : 'environment'}
        hidden
        aria-label={t(`worker.${which}`)}
        onChange={(event) => {
          const photo = event.target.files?.[0];
          event.target.value = '';
          if (!photo) return;
          setFailed(false);
          shrinkTo(photo, side, maxBytes).then(onPick, () => {
            setFailed(true);
          });
        }}
      />
      <div className="space-y-1">
        <Button variant="secondary" className="min-h-11" onClick={() => input.current?.click()}>
          <Icon aria-hidden="true" className="size-4" />
          {t(shown ? `worker.${which}Change` : `worker.${which}Add`)}
        </Button>
        {which === 'id_card' && <p className="text-xs text-muted">{t('worker.idPrivate')}</p>}
        {failed && <p className="text-xs text-[var(--tt-danger)]">{t('worker.pictureFailed')}</p>}
      </div>
    </div>
  );
}

/** Register a worker, or change one, in a dialog: the basics, a photo to know them by, and a
 *  picture of their ID only if the owner keeps one. A new worker's wage starts at the project's
 *  default; an existing worker's wage changes in Wages, where its history is kept. */
export function WorkerForm({
  project,
  worker,
  options,
  onClose,
}: {
  project: Project;
  worker: Worker | null;
  options: Options;
  onClose: () => void;
}) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const save = useSaveWorker(project.id);
  const putPicture = usePutPicture();
  const photo = usePicture(project.id, worker ?? EMPTY, 'photo');
  const card = usePicture(project.id, worker ?? EMPTY, 'id_card');
  const [pictures, setPictures] = useState<Partial<Record<Picture, Blob>>>({});
  const form = useForm<FormValues>({
    defaultValues: {
      name: worker?.name ?? '',
      gender: worker?.gender ?? '',
      phone: worker?.phone ?? '',
      code: worker?.code ?? '',
      wage: toInput(worker?.daily_wage_minor ?? defaultWage(project, ''), project.currency),
      notes: worker?.notes ?? '',
    },
  });
  const { errors } = form.formState;
  const failure = failureCode(save.error);

  const submit = form.handleSubmit(async (values) => {
    const body: WorkerInput = {
      name: values.name.trim(),
      gender: values.gender || null,
      phone: values.phone.trim() || null,
      code: values.code.trim() || null,
      notes: values.notes.trim() || null,
      ...(worker ? {} : { daily_wage_minor: toMinor(values.wage, project.currency) ?? 0 }),
    };
    const saved = await save.mutateAsync({ id: worker?.id, body }).catch(() => null);
    if (!saved) return;
    for (const [which, picked] of Object.entries(pictures) as [Picture, Blob][]) {
      await putPicture.mutateAsync({ id: saved.id, which, photo: picked }).catch(() => null);
    }
    toast(t(worker ? 'worker.saved' : 'worker.added', { name: saved.name, code: saved.code }), {
      tone: 'success',
    });
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t(worker ? 'worker.editTitle' : 'worker.addTitle')}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
        <PictureField
          which="photo"
          existing={photo}
          picked={pictures.photo ?? null}
          maxBytes={options.photo_max_bytes}
          side={options.photo_side_px}
          onPick={(picked) => {
            setPictures((current) => ({ ...current, photo: picked }));
          }}
        />
        <TextField
          label={t('worker.name')}
          maxLength={80}
          autoComplete="off"
          error={errors.name?.message}
          {...form.register('name', {
            validate: (value) => value.trim() !== '' || t('worker.nameError'),
          })}
        />
        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('worker.gender')}</legend>
          <div className="flex flex-wrap gap-2">
            {(['', ...options.genders] as FormValues['gender'][]).map((value) => (
              <label key={value || 'none'} className={CHOICE}>
                <input
                  type="radio"
                  value={value}
                  className="sr-only"
                  {...form.register('gender', {
                    onChange: (event: { target: { value: FormValues['gender'] } }) => {
                      if (worker || form.getFieldState('wage').isDirty) return;
                      const wage = defaultWage(project, event.target.value);
                      form.setValue('wage', toInput(wage, project.currency));
                    },
                  })}
                />
                {t(`gender.${value || 'unsaid'}`, { defaultValue: value })}
              </label>
            ))}
          </div>
        </fieldset>
        {!worker && (
          <TextField
            label={t('worker.wage', { currency: project.currency })}
            hint={t('worker.wageHint')}
            inputMode="decimal"
            autoComplete="off"
            error={errors.wage?.message}
            {...form.register('wage', {
              validate: (value) => {
                const minor = toMinor(value, project.currency);
                return (
                  (minor !== null && minor >= 0 && minor <= options.max_daily_minor) ||
                  t('worker.wageError')
                );
              },
            })}
          />
        )}
        <TextField
          label={t('worker.phone')}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          error={errors.phone?.message}
          {...form.register('phone', {
            validate: (value) =>
              value.trim() === '' ||
              /^\+?[0-9 -]{6,20}$/.test(value.trim()) ||
              t('worker.phoneError'),
          })}
        />
        <TextField
          label={t('worker.code')}
          hint={worker ? undefined : t('worker.codeHint')}
          maxLength={12}
          autoComplete="off"
          {...form.register('code')}
        />
        <PictureField
          which="id_card"
          existing={card}
          picked={pictures.id_card ?? null}
          maxBytes={options.id_max_bytes}
          side={options.id_side_px}
          onPick={(picked) => {
            setPictures((current) => ({ ...current, id_card: picked }));
          }}
        />
        <TextField
          label={t('worker.notes')}
          maxLength={500}
          autoComplete="off"
          {...form.register('notes')}
        />
        <Button
          type="submit"
          className="min-h-12 w-full text-base"
          disabled={save.isPending || putPicture.isPending}
        >
          {t('worker.save')}
        </Button>
      </form>
    </Dialog>
  );
}

/** No worker yet: no picture to fetch. */
const EMPTY = {
  id: '',
  project_id: '',
  name: '',
  code: '',
  gender: null,
  phone: null,
  daily_wage_minor: 0,
  active: true,
  notes: null,
  has_photo: false,
  has_id_card: false,
  created_at: '',
  updated_at: '',
} satisfies Worker;
