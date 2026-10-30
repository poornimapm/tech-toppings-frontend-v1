import { Lock, LockOpen, Pencil, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { displayDate, todayIn } from '@/core/utils/dates';
import {
  Alert,
  Badge,
  Button,
  Dialog,
  EmptyState,
  FilterChips,
  LoadError,
  Skeleton,
  TextField,
  toast,
} from '@/design-system';
import {
  failureCode,
  useOptions,
  useProjectStatus,
  useProjects,
  useSaveProject,
  type Project,
} from '@/modules/labor/api';
import { CHOICE } from '@/modules/labor/choice';
import { NS } from '@/modules/labor/i18n';
import manifest from '@/modules/labor/manifest';

const STATES = ['open', 'closed'] as const;
/** A few pictures to tell projects apart at a glance (any emoji may be typed instead). */
const ICONS = ['🌱', '☕', '🏠', '🏢', '🧱', '🛒', '🧹', '🚜'];

/** The owner's projects, open ones first: as many as they need, overlapping as they like, open
 *  until they close one (closing keeps everything; reopening carries on). */
export function ProjectsPage() {
  const { t, i18n } = useTranslation(NS);
  const [state, setState] = useState<(typeof STATES)[number]>('open');
  const projects = useProjects({ state });
  const status = useProjectStatus();
  const [editing, setEditing] = useState<Project | 'new' | null>(null);
  const [closing, setClosing] = useState<Project | null>(null);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FilterChips
          label={t('projects.show')}
          chips={STATES.map((value) => ({ value, label: t(`projects.${value}`) }))}
          value={state}
          onChange={setState}
        />
        <Button
          className="min-h-11"
          onClick={() => {
            setEditing('new');
          }}
        >
          <Plus aria-hidden="true" className="size-5" />
          {t('projects.add')}
        </Button>
      </div>
      {projects.isPending ? (
        <Skeleton className="h-48 rounded-3xl" />
      ) : projects.isError && !projects.data ? (
        <LoadError onRetry={() => void projects.refetch()}>{t('projects.loadError')}</LoadError>
      ) : projects.data.length === 0 ? (
        <EmptyState
          icon={manifest.icon}
          title={t(state === 'open' ? 'projects.none' : 'projects.noneClosed')}
        />
      ) : (
        <ul role="list" aria-label={t('nav.projects')} className="grid gap-3 sm:grid-cols-2">
          {projects.data.map((project) => (
            <li
              key={project.id}
              className="space-y-3 rounded-3xl border border-border bg-surface p-4"
            >
              <div className="flex items-start gap-3">
                <span aria-hidden="true" className="text-3xl">
                  {project.icon ?? '📋'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold break-words">{project.name}</p>
                  <p className="text-sm text-muted">
                    {[
                      project.kind
                        ? t(`kinds.${project.kind}`, { defaultValue: project.kind })
                        : null,
                      t('projects.since', {
                        date: displayDate(project.started_on).toLocaleDateString(i18n.language, {
                          dateStyle: 'medium',
                        }),
                      }),
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                {project.status === 'closed' && (
                  <Badge icon={<Lock aria-hidden="true" className="size-3" />}>
                    {t('projects.closedBadge')}
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {project.status === 'open' && (
                  <Link
                    to={`../attendance?project=${project.id}`}
                    relative="path"
                    className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-contrast"
                  >
                    {t('projects.recordToday')}
                  </Link>
                )}
                <Button
                  variant="secondary"
                  className="min-h-11"
                  onClick={() => {
                    setEditing(project);
                  }}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                  {t('projects.edit')}
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-11"
                  onClick={() => {
                    if (project.status === 'open') setClosing(project);
                    else
                      status.mutate(
                        { id: project.id, open: true },
                        {
                          onSuccess: () =>
                            toast(t('projects.reopened', { name: project.name }), {
                              tone: 'success',
                            }),
                        },
                      );
                  }}
                >
                  {project.status === 'open' ? (
                    <Lock aria-hidden="true" className="size-4" />
                  ) : (
                    <LockOpen aria-hidden="true" className="size-4" />
                  )}
                  {t(project.status === 'open' ? 'projects.close' : 'projects.reopen')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {editing && (
        <ProjectForm
          project={editing === 'new' ? null : editing}
          onClose={() => {
            setEditing(null);
          }}
        />
      )}
      {closing && (
        <Dialog
          open
          onOpenChange={(open) => {
            if (!open) setClosing(null);
          }}
          title={t('projects.closeTitle', { name: closing.name })}
          description={t('projects.closeBody')}
        >
          {/* Keep it open first: the focus lands there, so Enter alone never closes it. */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                setClosing(null);
              }}
            >
              {t('projects.keepOpen')}
            </Button>
            <Button
              aria-disabled={status.isPending || undefined}
              onClick={() => {
                if (status.isPending) return;
                status.mutate(
                  { id: closing.id, open: false },
                  {
                    onSuccess: () => {
                      toast(t('projects.closedToast', { name: closing.name }), { tone: 'success' });
                      setClosing(null);
                    },
                  },
                );
              }}
            >
              {t('projects.close')}
            </Button>
          </div>
        </Dialog>
      )}
    </section>
  );
}

interface FormValues {
  name: string;
  kind: string;
  icon: string;
  started_on: string;
  description: string;
  notes: string;
}

function ProjectForm({ project, onClose }: { project: Project | null; onClose: () => void }) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const timezone = useSession((state) => state.user?.timezone);
  const options = useOptions();
  const save = useSaveProject();
  const kindsId = useId();
  const form = useForm<FormValues>({
    defaultValues: {
      name: project?.name ?? '',
      kind: project?.kind ?? '',
      icon: project?.icon ?? ICONS[0],
      started_on: project?.started_on ?? todayIn(timezone),
      description: project?.description ?? '',
      notes: project?.notes ?? '',
    },
  });
  const { errors } = form.formState;
  const failure = failureCode(save.error);

  const submit = form.handleSubmit(async (values) => {
    const saved = await save
      .mutateAsync({
        id: project?.id,
        body: {
          name: values.name.trim(),
          kind: values.kind.trim() || null,
          icon: values.icon.trim() || null,
          started_on: values.started_on || null,
          description: values.description.trim() || null,
          notes: values.notes.trim() || null,
        },
      })
      .catch(() => null);
    if (!saved) return;
    toast(t(project ? 'projects.saved' : 'projects.added', { name: saved.name }), {
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
      title={t(project ? 'projects.editTitle' : 'projects.addTitle')}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
        <TextField
          label={t('projects.name')}
          hint={t('projects.nameHint')}
          maxLength={80}
          autoComplete="off"
          error={errors.name?.message}
          {...form.register('name', {
            validate: (value) => value.trim() !== '' || t('projects.nameError'),
          })}
        />
        <fieldset>
          <legend className="mb-1 text-sm font-medium">{t('projects.icon')}</legend>
          <div className="flex flex-wrap gap-2">
            {ICONS.map((icon) => (
              <label key={icon} className={CHOICE}>
                <input type="radio" value={icon} className="sr-only" {...form.register('icon')} />
                <span className="text-xl">{icon}</span>
              </label>
            ))}
          </div>
        </fieldset>
        <TextField
          label={t('projects.kind')}
          list={kindsId}
          maxLength={40}
          autoComplete="off"
          {...form.register('kind')}
        />
        <datalist id={kindsId}>
          {options.data?.kinds.map((kind) => (
            <option key={kind} value={kind}>
              {t(`kinds.${kind}`, { defaultValue: kind })}
            </option>
          ))}
        </datalist>
        <TextField type="date" label={t('projects.started')} {...form.register('started_on')} />
        <TextField
          label={t('projects.description')}
          maxLength={300}
          autoComplete="off"
          {...form.register('description')}
        />
        <TextField
          label={t('projects.notes')}
          maxLength={500}
          autoComplete="off"
          {...form.register('notes')}
        />
        <Button type="submit" className="min-h-12 w-full text-base" disabled={save.isPending}>
          {t('projects.save')}
        </Button>
      </form>
    </Dialog>
  );
}
