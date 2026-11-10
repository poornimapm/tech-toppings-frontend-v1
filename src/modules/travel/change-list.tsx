import { CircleAlert, Lock, Minus, Pencil, Plus, RotateCcw, type LucideIcon } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';

import { isShownField, useFieldWords } from '@/modules/travel/field-words';
import { NS } from '@/modules/travel/i18n';
import en from '@/modules/travel/i18n/en.json';
import { isKnown } from '@/modules/travel/known';
import type { ChangeResult, Flag, RecordChange } from '@/modules/travel/plan-api';
import { weekdayOf } from '@/modules/travel/trip-words';
import { useWords } from '@/modules/travel/words';

const OP_ICONS: Record<RecordChange['op'], LucideIcon> = {
  add: Plus,
  remove: Minus,
  revive: RotateCcw,
  set: Pencil,
};

type Shown = Pick<ChangeResult, 'what_changed' | 'needs_review' | 'kept' | 'days'>;

/**
 * What a change reaches, record by record and field by field, then what it leaves for the
 * person to look at (never changed) and their own work it keeps. `planned` words it as what
 * would happen, for the preview; otherwise as what did.
 */
export function ChangeList({
  result,
  planned,
  currency,
}: {
  result: Shown;
  planned: boolean;
  currency: string;
}) {
  const { t, i18n } = useTranslation(NS);
  const headingId = useId();
  const { what_changed, needs_review, kept, days } = result;
  return (
    <section aria-labelledby={headingId} className="space-y-3">
      <h3 id={headingId} className="text-base font-semibold">
        {t(planned ? 'changes.willTitle' : 'changes.didTitle')}
      </h3>
      {what_changed.length === 0 ? (
        <p className="text-sm text-muted">{t('changes.nothing')}</p>
      ) : (
        <ul role="list" className="space-y-2">
          {what_changed.map((change, index) => (
            <ChangeLine
              key={`${change.record_id ?? 'new'}-${String(index)}`}
              change={change}
              planned={planned}
              currency={currency}
            />
          ))}
        </ul>
      )}
      {days.length > 0 && (
        <p className="text-sm text-muted">
          {t('changes.days', {
            days: days.map((day) => weekdayOf(day, i18n.language)).join(', '),
          })}
        </p>
      )}
      <Flags title={t('changes.review')} flags={needs_review} icon={CircleAlert} />
      <Flags title={t('changes.kept')} flags={kept} icon={Lock} />
    </section>
  );
}

/** One record's part in a change, and each field it set from and to. */
export function ChangeLine({
  change,
  planned,
  currency,
}: {
  change: RecordChange;
  planned: boolean;
  currency: string;
}) {
  const { t } = useTranslation(NS);
  const words = useWords();
  const fields = useFieldWords(currency);
  const Icon = OP_ICONS[change.op];
  const all = change.fields ?? [];
  // Said by the server while it is still the suggestion as worded (an added one, by its line).
  const key = change.suggestion_key ?? all.find((line) => line.field === 'suggestion_key')?.new;
  const title = words.item(change.title, typeof key === 'string' ? key : null, true);
  const entity = isKnown(en.changes.entities, change.entity)
    ? t(`changes.entities.${change.entity}`)
    : change.entity;
  const lines = all.filter((line) => isShownField(line.field));
  return (
    <li className="flex gap-2 rounded-xl border border-border p-2 text-sm">
      <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
      <div className="min-w-0">
        <p className="break-words">
          <span className="font-semibold">
            {t(planned ? `changes.will.${change.op}` : `changes.did.${change.op}`, { title })}
          </span>{' '}
          <span className="text-muted">· {entity}</span>
        </p>
        {lines.map((line) => (
          // "Status: Planned → Skipped": the same marks read in every language.
          <p key={line.field} className="text-muted">
            {fields.label(line.field)}:{' '}
            {change.op === 'set' && `${fields.value(line.field, line.old, change.entity)} → `}
            {fields.value(line.field, line.new, change.entity)}
          </p>
        ))}
      </div>
    </li>
  );
}

function Flags({ title, flags, icon: Icon }: { title: string; flags: Flag[]; icon: LucideIcon }) {
  const { t } = useTranslation(NS);
  const words = useWords();
  const headingId = useId();
  if (flags.length === 0) return null;
  return (
    <section aria-labelledby={headingId} className="space-y-1">
      <h4 id={headingId} className="text-sm font-semibold">
        {title}
      </h4>
      <ul role="list" className="space-y-1">
        {flags.map((flag) => {
          // A suggestion still as its rule words it (a tick keeps it so), in the reader's words.
          const named = words.item(flag.title, flag.suggestion_key, true);
          return (
            <li key={`${flag.entity}-${flag.record_id}`} className="flex gap-2 text-sm">
              <Icon aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-muted" />
              <span className="break-words">
                {isKnown(en.changes.reasons, flag.reason)
                  ? t(`changes.reasons.${flag.reason}`, { title: named })
                  : named}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
