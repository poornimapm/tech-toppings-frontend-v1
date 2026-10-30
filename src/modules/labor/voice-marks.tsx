import { CircleAlert, Mic, X } from 'lucide-react';
import { useEffect, useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { errorKey, toLanguage } from '@/core/i18n';
import { useOnline } from '@/core/pwa/use-online';
import { useDictation } from '@/core/speech/speech';
import { cx } from '@/core/utils/cx';
import { Badge, Button, SelectField, toast } from '@/design-system';
import {
  failureCode,
  useMark,
  useReadMarks,
  useTaps,
  type Day,
  type MarkStatus,
} from '@/modules/labor/api';
import { NS } from '@/modules/labor/i18n';
import type { MarksDraft } from '@/modules/labor/marks-draft';

const STATUSES: MarkStatus[] = ['full', 'half', 'absent'];

interface Props {
  project: string;
  day: string;
  /** The day's sheet, once loaded: the draft is checked against it. */
  sheet: Day | undefined;
  /** A draft the assistant read elsewhere and handed to this page. */
  handed: MarksDraft | null;
  /** The draft is for another day: the page goes there to check it. */
  onDay: (day: string) => void;
}

/**
 * Saying the marks ("Ravi full day, Meena half day, the rest absent"), or typing them: the words
 * are read into a draft (the mark-attendance skill, by the rules or the AI), shown worker by
 * worker to check and change, and saved only when the owner saves them. A draft the assistant
 * read lands here too. Reading needs the network; tapping each mark doesn't.
 */
export function VoiceMarks({ project, day, sheet, handed, onDay }: Props) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const online = useOnline();
  const wordsId = useId();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [spoken, setSpoken] = useState(false);
  const [said, setSaid] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ value: MarksDraft; key: number } | null>(null);
  const [taken, setTaken] = useState<MarksDraft | null>(null);
  const read = useReadMarks(project, day);
  const dictation = useDictation(toLanguage(i18n.language), (heard) => {
    setText(heard);
    setSpoken(true);
  });

  if (handed && handed !== taken) {
    // Taken once, in this render: each one handed starts the check afresh.
    setTaken(handed);
    setDraft({ value: handed, key: (draft?.key ?? 0) + 1 });
    setOpen(true);
  }
  const draftDay = draft?.value.day;
  useEffect(() => {
    if (draftDay && draftDay !== day) onDay(draftDay);
  }, [day, draftDay, onDay]);

  const close = () => {
    dictation.stop();
    setOpen(false);
    setDraft(null);
    setSaid(null);
    setText('');
    setSpoken(false);
  };

  const submit = async () => {
    const words = text.trim();
    if (!words || !online || read.isPending) return;
    dictation.stop();
    const out = await read
      .mutateAsync({
        text: words,
        input_type: spoken ? 'speech' : 'text',
        locale: toLanguage(i18n.language),
      })
      .catch(() => null);
    if (!out) return;
    const count = Number(out.message_params.count ?? 0);
    setSaid(
      out.status === 'unavailable'
        ? t('voice.unavailable')
        : (out.message ??
            (out.message_code
              ? t(`voice.codes.${out.message_code}`, { count, defaultValue: '' })
              : null)),
    );
    setDraft(out.draft ? { value: out.draft, key: (draft?.key ?? 0) + 1 } : null);
  };

  if (!open) {
    return (
      <Button
        variant="secondary"
        className="min-h-12 w-full text-base"
        onClick={() => {
          setOpen(true);
        }}
      >
        <Mic aria-hidden="true" className="size-5" />
        {t('voice.open')}
      </Button>
    );
  }

  const failure = failureCode(read.error);
  let status = said;
  if (read.isPending) status = t('voice.reading');
  else if (dictation.listening) status = t('voice.listening');
  else if (failure) status = tError(errorKey(failure));
  const ready = draft && sheet && (!draft.value.day || draft.value.day === day);

  return (
    <section
      aria-labelledby={`${wordsId}-title`}
      className="space-y-3 rounded-3xl border border-border bg-surface p-4"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h2 id={`${wordsId}-title`} className="text-lg font-semibold">
            {t('voice.title')}
          </h2>
          <p className="text-sm text-muted">{t('voice.hint')}</p>
        </div>
        <Button variant="ghost" className="min-h-11" aria-label={t('voice.close')} onClick={close}>
          <X aria-hidden="true" className="size-5" />
        </Button>
      </div>
      <form
        className="space-y-2"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label htmlFor={wordsId} className="text-sm font-medium">
          {t('voice.words')}
        </label>
        <div className="flex items-start gap-2">
          <textarea
            id={wordsId}
            value={text}
            rows={2}
            maxLength={1000}
            onChange={(event) => {
              setText(event.target.value);
              setSpoken(false);
            }}
            className="min-h-12 w-full rounded-2xl border border-border bg-bg px-3 py-2 text-base"
          />
          {dictation.supported && (
            <Button
              variant="secondary"
              className={cx('min-h-12 min-w-12', dictation.listening && 'animate-pulse')}
              aria-pressed={dictation.listening}
              aria-label={t(dictation.listening ? 'voice.stop' : 'voice.listen')}
              onClick={dictation.listening ? dictation.stop : dictation.start}
            >
              <Mic aria-hidden="true" className="size-5" />
            </Button>
          )}
        </div>
        <Button
          type="submit"
          className="min-h-12 w-full text-base"
          aria-disabled={!online || read.isPending || !text.trim() || undefined}
        >
          {t('voice.read')}
        </Button>
      </form>
      {!online && <p className="text-sm">{t('voice.offline')}</p>}
      <p role="status" className="text-sm font-medium">
        {status}
      </p>
      {ready && (
        <Review
          key={draft.key}
          draft={draft.value}
          sheet={sheet}
          project={project}
          day={day}
          onDone={close}
        />
      )}
    </section>
  );
}

interface Row {
  heard: string;
  worker: string; // '' until chosen
  status: MarkStatus | null;
  check: boolean;
}

/** The draft, worker by worker: who (chosen when unsure) and which mark, then everyone not
 *  named under "the rest"; saved only with Save. */
function Review({
  draft,
  sheet,
  project,
  day,
  onDone,
}: {
  draft: MarksDraft;
  sheet: Day;
  project: string;
  day: string;
  onDone: () => void;
}) {
  const { t } = useTranslation(NS);
  const mark = useMark(project, day);
  const { shown, tap } = useTaps(project, day, sheet);
  const byId = new Map(sheet.workers.map((worker) => [worker.id, worker]));
  const [rows, setRows] = useState<Row[]>(() =>
    draft.marks.map((said) => {
      const known =
        said.worker_id !== null && said.worker_id !== undefined && byId.has(said.worker_id);
      return {
        heard: said.name,
        worker: known ? (said.worker_id ?? '') : '',
        status: said.status ?? null,
        check: !known || said.uncertain.length > 0,
      };
    }),
  );
  const [rest, setRest] = useState<MarkStatus | null>(draft.rest ?? null);
  const named = new Set(rows.map((row) => row.worker).filter(Boolean));
  // "The rest": the workers not named who have no mark yet (a mark already made stays).
  const others = sheet.workers.filter(
    (worker) => worker.active && !named.has(worker.id) && shown(worker.id) === null,
  );
  const taps = [
    ...rows.flatMap((row) => {
      const worker = byId.get(row.worker);
      return worker && row.status ? [tap(worker, row.status)] : [];
    }),
    ...(rest ? others.map((worker) => tap(worker, rest)) : []),
  ];
  const change = (index: number, patch: Partial<Row>) => {
    setRows((all) => all.map((row, at) => (at === index ? { ...row, ...patch } : row)));
  };

  return (
    <div className="space-y-3">
      <h3 className="font-semibold">{t('voice.review')}</h3>
      <ul role="list" className="space-y-2">
        {rows.map((row, index) => (
          <ReviewRow
            key={`${row.heard}-${String(index)}`}
            row={row}
            name={byId.get(row.worker)?.name ?? null}
            workers={sheet.workers}
            onChange={(patch) => {
              change(index, patch);
            }}
          />
        ))}
        {rest && others.length > 0 && (
          <RestRow names={others.map((worker) => worker.name)} status={rest} onStatus={setRest} />
        )}
      </ul>
      <div className="flex flex-wrap gap-2">
        <Button
          className="min-h-12 text-base"
          aria-disabled={taps.length === 0 || mark.isPending || undefined}
          onClick={() => {
            if (taps.length === 0 || mark.isPending) return;
            mark.mutate(taps, {
              onSuccess: (saved) => {
                const count = taps.length;
                toast(t(saved ? 'voice.saved' : 'voice.kept', { count }), { tone: 'success' });
                onDone();
              },
            });
          }}
        >
          {t('voice.save', { count: taps.length })}
        </Button>
        <Button variant="ghost" className="min-h-12" onClick={onDone}>
          {t('voice.cancel')}
        </Button>
      </div>
    </div>
  );
}

function ReviewRow({
  row,
  name,
  workers,
  onChange,
}: {
  row: Row;
  name: string | null;
  workers: Day['workers'];
  onChange: (patch: Partial<Row>) => void;
}) {
  const { t } = useTranslation(NS);
  const nameId = useId();
  return (
    <li className="space-y-2 rounded-2xl border border-border p-3">
      <div className="flex flex-wrap items-center gap-2">
        <p id={nameId} className="font-semibold">
          {name ?? t('voice.who', { heard: row.heard })}
        </p>
        {row.check && (
          <Badge icon={<CircleAlert aria-hidden="true" className="size-3" />}>
            {t('voice.check')}
          </Badge>
        )}
      </div>
      {row.check && (
        <SelectField
          label={t('voice.pick')}
          value={row.worker}
          options={[
            { value: '', label: t('voice.nobody') },
            ...workers.map((worker) => ({
              value: worker.id,
              label: `${worker.name} (${worker.code})`,
            })),
          ]}
          onChange={(event) => {
            onChange({ worker: event.target.value });
          }}
        />
      )}
      <MarkChoice
        labelledBy={nameId}
        value={row.status}
        onChange={(status) => {
          onChange({ status });
        }}
      />
    </li>
  );
}

function RestRow({
  names,
  status,
  onStatus,
}: {
  names: string[];
  status: MarkStatus;
  onStatus: (status: MarkStatus) => void;
}) {
  const { t } = useTranslation(NS);
  const nameId = useId();
  return (
    <li className="space-y-2 rounded-2xl border border-border p-3">
      <p id={nameId} className="font-semibold">
        {t('voice.rest', { count: names.length })}
      </p>
      <p className="text-sm text-muted">{names.join(', ')}</p>
      <MarkChoice labelledBy={nameId} value={status} onChange={onStatus} />
    </li>
  );
}

/** Full day, half day or absent: words on every button, the chosen one pressed. */
function MarkChoice({
  labelledBy,
  value,
  onChange,
}: {
  labelledBy: string;
  value: MarkStatus | null;
  onChange: (status: MarkStatus) => void;
}) {
  const { t } = useTranslation(NS);
  return (
    <div role="group" aria-labelledby={labelledBy} className="grid grid-cols-3 gap-2">
      {STATUSES.map((status) => (
        <button
          key={status}
          type="button"
          aria-pressed={value === status}
          onClick={() => {
            onChange(status);
          }}
          className={cx(
            'min-h-11 rounded-xl border-2 px-2 text-sm font-semibold',
            value === status
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border bg-bg text-text hover:bg-surface',
          )}
        >
          {t(`mark.${status}`)}
        </button>
      ))}
    </div>
  );
}
