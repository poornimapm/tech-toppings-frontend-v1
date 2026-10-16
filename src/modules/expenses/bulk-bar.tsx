import { FolderInput, Tag, Trash2, Undo2, X } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { errorKey } from '@/core/i18n';
import { Alert, Button, Dialog, SelectField, TextField, toast } from '@/design-system';
import { failureCode, type Entry } from '@/modules/expenses/api';
import {
  skippedBy,
  useBulkUpdate,
  type BulkInput,
  type BulkResult,
} from '@/modules/expenses/bulk-api';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { NS } from '@/modules/expenses/i18n';

const MAX_TAG = 30;
type Change = Omit<BulkInput, 'ids'>;
type Asking = 'category' | 'tag' | null;

/**
 * What to do with the entries ticked on the list: file them under a category, add or take off a
 * tag, or delete them (undone from the message). Deleted entries can only be brought back.
 * Sticks to the bottom of the screen, above the phone's navigation bar.
 */
export function BulkBar({
  shown,
  chosen,
  deleted,
  onChoose,
  onClose,
}: {
  /** The entries on the list now, for "select all". */
  shown: readonly Entry[];
  chosen: readonly string[];
  /** The list shows deleted entries. */
  deleted: boolean;
  onChoose: (ids: string[]) => void;
  onClose: () => void;
}) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const run = useBulkUpdate();
  const [asking, setAsking] = useState<Asking>(null);
  const all = shown.length > 0 && shown.every((entry) => chosen.includes(entry.id));
  const failure = failureCode(run.error);
  const problem = failure
    ? failure === 'VALIDATION_ERROR'
      ? t('bulk.tooMany')
      : tError(errorKey(failure))
    : undefined;

  /** Tell what was done and what was skipped; true when anything was done. */
  function report(result: BulkResult, said: string, undo?: () => void): boolean {
    const count = result.changed.length;
    if (count > 0) {
      toast(said, {
        tone: 'success',
        ...(undo && { action: { label: t('bulk.undo'), onAction: undo } }),
      });
    }
    const skipped = skippedBy(result).map(([reason, many]) =>
      t(`bulk.skipped.${reason}`, { count: many }),
    );
    if (skipped.length > 0) toast(skipped.join(' '), { tone: 'info' });
    return count > 0;
  }

  async function apply(change: Change, said: (count: number) => string, undo?: Change) {
    const result = await run.mutateAsync({ ids: [...chosen], ...change }).catch(() => null);
    if (!result) return false; // shown from run.error
    const done = report(
      result,
      said(result.changed.length),
      undo &&
        (() => {
          run.mutate(
            { ids: result.changed, ...undo },
            {
              onSuccess: (back) =>
                report(back, t('bulk.done.undelete', { count: back.changed.length })),
            },
          );
        }),
    );
    // Deleted or brought back, they leave the list: nothing stays ticked.
    if (done && (change.action === 'delete' || change.action === 'undelete')) onChoose([]);
    return true;
  }

  return (
    <div
      role="region"
      aria-label={t('bulk.label')}
      className="sticky bottom-20 z-20 space-y-2 rounded-3xl border border-primary/40 bg-glass p-3 shadow-xl backdrop-blur-xl sm:bottom-4"
    >
      {problem && !asking && <Alert tone="danger">{problem}</Alert>}
      <div className="flex flex-wrap items-center gap-2">
        <p aria-live="polite" className="mr-auto text-sm font-semibold">
          {t('bulk.chosen', { count: chosen.length })}
        </p>
        <Button
          variant="ghost"
          onClick={() => {
            onChoose(all ? [] : shown.map((entry) => entry.id));
          }}
        >
          {all ? t('bulk.none') : t('bulk.all', { count: shown.length })}
        </Button>
        <Button variant="ghost" aria-label={t('bulk.close')} onClick={onClose}>
          <X aria-hidden="true" className="size-4" />
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {deleted ? (
          <Button
            disabled={chosen.length === 0 || run.isPending}
            onClick={() =>
              void apply({ action: 'undelete' }, (count) => t('bulk.done.undelete', { count }))
            }
          >
            <Undo2 aria-hidden="true" className="size-4" />
            {t('bulk.undelete')}
          </Button>
        ) : (
          <>
            <Button
              variant="secondary"
              disabled={chosen.length === 0 || run.isPending}
              onClick={() => {
                setAsking('category');
              }}
            >
              <FolderInput aria-hidden="true" className="size-4" />
              {t('bulk.category')}
            </Button>
            <Button
              variant="secondary"
              disabled={chosen.length === 0 || run.isPending}
              onClick={() => {
                setAsking('tag');
              }}
            >
              <Tag aria-hidden="true" className="size-4" />
              {t('bulk.tags')}
            </Button>
            <Button
              variant="secondary"
              disabled={chosen.length === 0 || run.isPending}
              onClick={() =>
                void apply({ action: 'delete' }, (count) => t('bulk.done.delete', { count }), {
                  action: 'undelete',
                })
              }
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {t('bulk.delete')}
            </Button>
          </>
        )}
      </div>
      {asking && (
        <BulkDialog
          asking={asking}
          count={chosen.length}
          busy={run.isPending}
          problem={problem}
          onApply={async (change, said) => {
            if (await apply(change, said)) setAsking(null);
          }}
          onClose={() => {
            setAsking(null);
          }}
        />
      )}
    </div>
  );
}

/** Ask which category, or which tag (to add or take off), for the entries ticked. */
function BulkDialog({
  asking,
  count,
  busy,
  problem,
  onApply,
  onClose,
}: {
  asking: Exclude<Asking, null>;
  count: number;
  busy: boolean;
  /** Why the last try failed, if it did. */
  problem: string | undefined;
  onApply: (change: Change, said: (count: number) => string) => Promise<void>;
  onClose: () => void;
}) {
  const { t } = useTranslation(NS);
  const book = useCategoryBook();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const live = book.categories.filter((item) => !item.archived);
  const tag = value.trim().toLowerCase();

  function send(change: Change, said: (done: number) => string) {
    if ((asking === 'category' ? value : tag) === '') {
      setError(t(asking === 'category' ? 'bulk.categoryError' : 'bulk.tagError'));
      return;
    }
    void onApply(change, said);
  }

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t(asking === 'category' ? 'bulk.categoryTitle' : 'bulk.tagTitle', { count })}
    >
      <div className="space-y-4">
        {problem && <Alert tone="danger">{problem}</Alert>}
        {asking === 'category' ? (
          <>
            <SelectField
              label={t('bulk.categoryField')}
              placeholder={t('bulk.categoryPlaceholder')}
              value={value}
              error={error || undefined}
              options={live.map((item) => ({
                value: item.id,
                label: `${item.icon} ${book.nameOf(item)}`,
              }))}
              onChange={(event) => {
                setValue(event.target.value);
              }}
            />
            <Button
              className="w-full"
              disabled={busy}
              onClick={() => {
                const name = book.nameOf(book.find(value));
                send({ action: 'category', category_id: value }, (done) =>
                  t('bulk.done.category', { count: done, category: name }),
                );
              }}
            >
              {t('bulk.move', { count })}
            </Button>
          </>
        ) : (
          <>
            <TextField
              label={t('bulk.tagField')}
              autoComplete="off"
              maxLength={MAX_TAG}
              value={value}
              error={error || undefined}
              onChange={(event) => {
                setValue(event.target.value);
              }}
            />
            <div className="grid grid-cols-2 gap-2">
              <Button
                disabled={busy}
                onClick={() => {
                  send({ action: 'add_tag', tag }, (done) =>
                    t('bulk.done.addTag', { count: done, tag }),
                  );
                }}
              >
                {t('bulk.addTag')}
              </Button>
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  send({ action: 'remove_tag', tag }, (done) =>
                    t('bulk.done.removeTag', { count: done, tag }),
                  );
                }}
              >
                {t('bulk.removeTag')}
              </Button>
            </div>
          </>
        )}
      </div>
    </Dialog>
  );
}
