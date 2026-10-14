import { ArrowLeft, Pencil, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router';

import { cx } from '@/core/utils/cx';
import { formatMoney } from '@/core/utils/money';
import { relativeTime } from '@/core/utils/relative-time';
import { Badge, Button, LoadError, Skeleton, toast } from '@/design-system';
import {
  useDeleteEntry,
  useEntry,
  useRestoreEntry,
  useRevisions,
  useUndeleteEntry,
  type Entry,
} from '@/modules/expenses/api';
import { useCategoryBook } from '@/modules/expenses/category-book';
import { CategoryIcon } from '@/modules/expenses/category-icon';
import { EntryForm } from '@/modules/expenses/entry-form';
import { EntryPrice } from '@/modules/expenses/entry-price';
import { useFieldText } from '@/modules/expenses/field-text';
import { NS } from '@/modules/expenses/i18n';

const DETAILS = ['date', 'time', 'merchant', 'payment_mode', 'for_whom', 'tags', 'note'] as const;
const CARD = 'rounded-3xl border border-border bg-glass p-5 shadow-sm backdrop-blur-xl';

/** An entry's history, newest first: what changed each time, and a way back to any version. */
function History({ entry }: { entry: Entry }) {
  const { t, i18n } = useTranslation(NS);
  const revisions = useRevisions(entry.id);
  const restore = useRestoreEntry();
  const text = useFieldText(entry.currency);

  return (
    <section aria-labelledby="entry-history" className={CARD}>
      <h2 id="entry-history" className="text-lg font-semibold">
        {t('entry.history')}
      </h2>
      <ol role="list" className="mt-4 space-y-5 border-l-2 border-border pl-5">
        {revisions.data?.map((revision) => (
          <li key={revision.revision_no} className="relative">
            <span
              aria-hidden="true"
              className="absolute top-1.5 -left-[1.6rem] size-2.5 rounded-full bg-primary ring-4 ring-surface"
            />
            <p className="font-medium">
              {t(`entry.action.${revision.action}`)}{' '}
              <span className="font-normal text-muted">
                {text.value('source', revision.source)} ·{' '}
                <time dateTime={revision.changed_at}>
                  {relativeTime(revision.changed_at, i18n.language)}
                </time>
              </span>
            </p>
            {revision.changes.length > 0 && (
              <ul role="list" className="mt-1 space-y-0.5 text-sm text-muted">
                {revision.changes.map((change) => (
                  <li key={change.field}>
                    <span className="text-text">{text.label(change.field)}:</span>{' '}
                    {text.value(change.field, change.old)} → {text.value(change.field, change.new)}
                  </li>
                ))}
              </ul>
            )}
            <div className="mt-2">
              {revision.revision_no === entry.revision_no ? (
                <Badge>{t('entry.current')}</Badge>
              ) : (
                !entry.deleted && (
                  <Button
                    variant="secondary"
                    aria-label={t('entry.restoreLabel', { number: revision.revision_no })}
                    disabled={restore.isPending}
                    onClick={() => {
                      restore.mutate(
                        { id: entry.id, revision_no: revision.revision_no },
                        {
                          onSuccess: (restored) =>
                            toast(t('toast.restored', { title: restored.title }), {
                              tone: 'success',
                            }),
                        },
                      );
                    }}
                  >
                    <RotateCcw aria-hidden="true" className="size-4" />
                    {t('entry.restore')}
                  </Button>
                )
              )}
            </div>
          </li>
        ))}
      </ol>
      {revisions.hasNextPage && (
        <Button
          variant="secondary"
          className="mt-4"
          disabled={revisions.isFetchingNextPage}
          onClick={() => void revisions.fetchNextPage()}
        >
          {t('list.more')}
        </Button>
      )}
    </section>
  );
}

/** One entry: what it is, what can be done with it, and its history. */
export function EntryPage() {
  const { id = '' } = useParams();
  const { t, i18n } = useTranslation(NS);
  const { t: tCommon } = useTranslation();
  const navigate = useNavigate();
  const entry = useEntry(id);
  const book = useCategoryBook();
  const remove = useDeleteEntry();
  const undelete = useUndeleteEntry();
  // 0 = closed; a new number each time it opens, so the form starts from the latest entry.
  const [editing, setEditing] = useState(0);
  const text = useFieldText(entry.data?.currency ?? '');

  const back = (
    <Link to=".." className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
      <ArrowLeft aria-hidden="true" className="size-4" />
      {t('entry.back')}
    </Link>
  );
  if (entry.isPending) return <Skeleton className="h-64 rounded-3xl" />;
  if (entry.isError) {
    return (
      <div className="space-y-4">
        {back}
        <LoadError onRetry={() => void entry.refetch()}>{t('entry.notFound')}</LoadError>
      </div>
    );
  }

  const current = entry.data;
  const category = book.find(current.category_id);
  const income = current.kind === 'income';

  function onDelete() {
    remove.mutate(current.id, {
      onSuccess: () => {
        toast(t('toast.deleted', { title: current.title }), {
          action: {
            label: tCommon('actions.undo'),
            onAction: () => {
              undelete.mutate(current.id);
            },
          },
        });
        void navigate('..');
      },
    });
  }

  return (
    <div className="space-y-5">
      {back}
      <section aria-labelledby="entry-title" className={cx(CARD, 'space-y-4')}>
        <div className="flex items-center gap-4">
          <CategoryIcon category={category} className="size-14 text-2xl" />
          <div className="min-w-0 flex-1">
            <h1 id="entry-title" className="truncate text-2xl font-bold tracking-tight">
              {current.title}
            </h1>
            <p className="text-muted">
              {t(`kind.${current.kind}`)} · {book.nameOf(category)}
            </p>
          </div>
          <p className={cx('text-2xl font-bold tabular-nums', income && 'text-success')}>
            {income ? '+' : '−'}
            {formatMoney(current.amount_minor, current.currency, i18n.language)}
          </p>
        </div>

        {current.deleted && (
          <p role="status" className="flex flex-wrap items-center gap-2 text-sm text-muted">
            <Badge tone="locked">{t('entry.deleted')}</Badge>
            {t('entry.deletedHint')}
          </p>
        )}

        <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
          {DETAILS.filter((field) => (current[field]?.length ?? 0) > 0).map((field) => (
            <div key={field} className="flex gap-2">
              <dt className="shrink-0 text-muted">{text.label(field)}:</dt>
              <dd className="min-w-0 break-words">{text.value(field, current[field])}</dd>
            </div>
          ))}
          {current.attachments.map((link) => (
            <div key={link.url} className="flex gap-2">
              <dt className="shrink-0 text-muted">{text.label('attachments')}:</dt>
              <dd className="min-w-0 truncate">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-4"
                >
                  {link.label ?? link.url}
                </a>
              </dd>
            </div>
          ))}
        </dl>

        <EntryPrice entry={current} />

        <div className="flex flex-wrap gap-2">
          {current.deleted ? (
            <Button
              disabled={undelete.isPending}
              onClick={() => {
                undelete.mutate(current.id, {
                  onSuccess: () =>
                    toast(t('toast.undeleted', { title: current.title }), { tone: 'success' }),
                });
              }}
            >
              <RotateCcw aria-hidden="true" className="size-4" />
              {t('entry.undelete')}
            </Button>
          ) : (
            <>
              <Button
                onClick={() => {
                  setEditing((count) => count + 1);
                }}
              >
                <Pencil aria-hidden="true" className="size-4" />
                {t('entry.edit')}
              </Button>
              <Button variant="secondary" disabled={remove.isPending} onClick={onDelete}>
                <Trash2 aria-hidden="true" className="size-4" />
                {t('entry.delete')}
              </Button>
            </>
          )}
        </div>
      </section>

      <History entry={current} />

      {editing > 0 && (
        <EntryForm
          key={`${editing}-${current.revision_no}`}
          entry={current}
          onClose={() => {
            setEditing(0);
          }}
          onReload={() => void entry.refetch()}
        />
      )}
    </div>
  );
}
