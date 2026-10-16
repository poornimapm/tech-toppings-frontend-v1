import { BookmarkPlus, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { errorKey } from '@/core/i18n';
import { Alert, Button, Dialog, FilterChips, TextField, toast } from '@/design-system';
import { failureCode } from '@/modules/expenses/api';
import { CONFIRM_TRIGGER, useConfirmFocus } from '@/modules/expenses/confirm-focus';
import { NS } from '@/modules/expenses/i18n';
import {
  useDeleteFilter,
  useSaveFilter,
  useSavedFilters,
  type SavedFilter,
  type SavedView,
} from '@/modules/expenses/saved-filters-api';
import { paramsOf, showsView, viewOf } from '@/modules/expenses/view-params';

const MAX_NAME = 60;

/** A name as the server compares names: any case, spaces squeezed. */
const sameName = (a: string, b: string) => {
  const key = (name: string) => name.normalize('NFKC').toLowerCase().split(/\s+/).join(' ').trim();
  return key(a) === key(b);
};

/**
 * The user's saved views as chips above the list: one opens its filters, the one shown now is
 * picked out and can be renamed or deleted, and filters not saved yet can be saved by name.
 * A link to `?view=<id>` (what search finds) opens that view's filters.
 */
export function SavedViews({
  params,
  filtered,
  onOpen,
}: {
  params: URLSearchParams;
  /** The list shows more (or less) than its defaults: worth saving. */
  filtered: boolean;
  onOpen: (query: URLSearchParams) => void;
}) {
  const { t } = useTranslation(NS);
  const saved = useSavedFilters();
  // undefined: no dialog; null: saving a new view; else the view renamed or deleted.
  const [dialog, setDialog] = useState<SavedFilter | null | undefined>(undefined);
  const views = saved.data ?? [];
  const current = views.find((item) => showsView(params, item.view));
  const linked = params.get('view');
  useEffect(() => {
    if (!linked || !saved.data) return;
    const chosen = saved.data.find((item) => item.id === linked);
    // A view deleted since leaves the list as it usually opens.
    onOpen(chosen ? paramsOf(chosen.view) : new URLSearchParams());
  }, [linked, saved.data, onOpen]);
  if (views.length === 0 && !filtered) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {views.length > 0 && (
        <FilterChips
          label={t('views.label')}
          value={current?.id ?? ''}
          chips={views.map((item) => ({ value: item.id, label: item.name }))}
          onChange={(id) => {
            const chosen = views.find((item) => item.id === id);
            if (chosen) onOpen(paramsOf(chosen.view));
          }}
        />
      )}
      {current ? (
        <Button
          variant="ghost"
          aria-label={t('views.editLabel', { name: current.name })}
          onClick={() => {
            setDialog(current);
          }}
        >
          <Pencil aria-hidden="true" className="size-4" />
        </Button>
      ) : (
        filtered && (
          <Button
            variant="secondary"
            onClick={() => {
              setDialog(null);
            }}
          >
            <BookmarkPlus aria-hidden="true" className="size-4" />
            {t('views.save')}
          </Button>
        )
      )}
      {dialog !== undefined && (
        <ViewDialog
          editing={dialog}
          view={viewOf(params)}
          views={views}
          onClose={() => {
            setDialog(undefined);
          }}
        />
      )}
    </div>
  );
}

/** Name the filters shown now as a new view, or rename or delete the view shown. A name taken
 *  by another view can be given to these filters instead. */
function ViewDialog({
  editing,
  view,
  views,
  onClose,
}: {
  editing: SavedFilter | null;
  view: SavedView;
  views: SavedFilter[];
  onClose: () => void;
}) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const save = useSaveFilter();
  const remove = useDeleteFilter();
  const [deleting, setDeleting] = useState(false);
  const confirmRef = useConfirmFocus<HTMLDivElement>(deleting);
  const form = useForm<{ name: string }>({ defaultValues: { name: editing?.name ?? '' } });
  const { errors } = form.formState;
  const failure = failureCode(save.error);
  const name = useWatch({ control: form.control, name: 'name' });
  const taken =
    failure === 'EXPENSE_SAVED_FILTER_EXISTS' && editing === null
      ? views.find((item) => sameName(item.name, name))
      : undefined;

  function finish(
    said: 'views.saved' | 'views.renamed' | 'views.replaced' | 'views.deleted',
    named: string,
  ) {
    toast(t(said, { name: named }), { tone: 'success' });
    onClose();
  }

  const submit = form.handleSubmit(async (values) => {
    const done = await save
      .mutateAsync(editing ? { id: editing.id, name: values.name } : { name: values.name, view })
      .catch(() => null); // shown from save.error
    if (done) finish(editing ? 'views.renamed' : 'views.saved', done.name);
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={editing ? t('views.editTitle', { name: editing.name }) : t('views.saveTitle')}
      description={editing ? undefined : t('views.saveHint')}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && !taken && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
        {taken && (
          <Alert tone="danger">
            <p>{t('views.taken', { name: taken.name })}</p>
            <Button
              variant="secondary"
              className="mt-2"
              disabled={save.isPending}
              onClick={() => {
                save.mutate(
                  { id: taken.id, view },
                  {
                    onSuccess: (done) => {
                      finish('views.replaced', done.name);
                    },
                  },
                );
              }}
            >
              {t('views.replace', { name: taken.name })}
            </Button>
          </Alert>
        )}
        <TextField
          label={t('views.name')}
          autoComplete="off"
          maxLength={MAX_NAME}
          error={errors.name?.message}
          {...form.register('name', {
            validate: (value) => value.trim() !== '' || t('views.nameError'),
          })}
        />
        <Button type="submit" className="w-full" disabled={save.isPending}>
          {t(editing ? 'views.rename' : 'views.saveButton')}
        </Button>
      </form>
      {editing && (
        <div ref={confirmRef} className="mt-4 border-t border-border pt-4">
          {deleting ? (
            <div role="alert" className="flex flex-wrap items-center gap-2">
              <p className="flex-1 text-sm">{t('views.confirm', { name: editing.name })}</p>
              <Button
                variant="secondary"
                onClick={() => {
                  setDeleting(false);
                }}
              >
                {t('views.no')}
              </Button>
              <Button
                disabled={remove.isPending}
                onClick={() => {
                  remove.mutate(editing.id, {
                    onSuccess: () => {
                      finish('views.deleted', editing.name);
                    },
                  });
                }}
              >
                {t('views.yes')}
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              {...CONFIRM_TRIGGER}
              onClick={() => {
                setDeleting(true);
              }}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              {t('views.delete')}
            </Button>
          )}
        </div>
      )}
    </Dialog>
  );
}
