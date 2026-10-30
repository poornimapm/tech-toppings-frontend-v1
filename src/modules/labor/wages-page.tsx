import { History, IndianRupee } from 'lucide-react';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { useSession } from '@/core/auth/session-store';
import { errorKey } from '@/core/i18n';
import { displayDate, todayIn } from '@/core/utils/dates';
import { formatMoney, toInput, toMinor } from '@/core/utils/money';
import {
  Alert,
  Button,
  Dialog,
  LoadError,
  Skeleton,
  Switch,
  TextField,
  toast,
} from '@/design-system';
import {
  failureCode,
  useAllWorkers,
  useOptions,
  useSetRates,
  useSetWage,
  useWages,
  type Project,
  type Worker,
} from '@/modules/labor/api';
import { NS } from '@/modules/labor/i18n';
import { useLabor } from '@/modules/labor/labor-context';
import { NoProject } from '@/modules/labor/labor-layout';
import { rowButton, rowName } from '@/modules/labor/row-label';
import { WorkerPhoto } from '@/modules/labor/worker-photo';

/**
 * Wages: the project's default daily wage for new workers (one for all, or by gender when the
 * owner wants that), and each worker's own, changed from a day on with its history. A change
 * never rewrites past days: they keep the wage they were recorded at.
 */
export function WagesPage() {
  const { t } = useTranslation(NS);
  const { projectId, project } = useLabor();
  const workers = useAllWorkers(projectId, { active: true });
  const [changing, setChanging] = useState<Worker | null>(null);
  const [history, setHistory] = useState<Worker | null>(null);

  if (!projectId) return <NoProject />;
  if (!project) return <Skeleton className="h-48 rounded-3xl" />;
  const closed = project.status === 'closed';

  return (
    <div className="space-y-6">
      {closed && <Alert tone="info">{t('project.closedNote')}</Alert>}
      <RatesForm key={project.updated_at} project={project} disabled={closed} />
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">{t('wages.workers')}</h2>
        <p className="text-sm text-muted">{t('wages.workersHint')}</p>
        {workers.isPending ? (
          <Skeleton className="h-40 rounded-3xl" />
        ) : workers.isError && !workers.data ? (
          <LoadError onRetry={() => void workers.refetch()}>{t('workers.loadError')}</LoadError>
        ) : (
          <ul role="list" aria-label={t('wages.workers')} className="space-y-2">
            {workers.data.map((worker) => (
              <WageRow
                key={worker.id}
                project={project}
                worker={worker}
                disabled={closed}
                onChange={() => {
                  setChanging(worker);
                }}
                onHistory={() => {
                  setHistory(worker);
                }}
              />
            ))}
          </ul>
        )}
      </section>
      {changing && (
        <WageForm
          project={project}
          worker={changing}
          onClose={() => {
            setChanging(null);
          }}
        />
      )}
      {history && (
        <WageHistory
          project={project}
          worker={history}
          onClose={() => {
            setHistory(null);
          }}
        />
      )}
    </div>
  );
}

interface RatesValues {
  by_gender: boolean;
  default_amount: string;
  female_amount: string;
  male_amount: string;
}

function RatesForm({ project, disabled }: { project: Project; disabled: boolean }) {
  const { t } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const options = useOptions();
  const save = useSetRates();
  const { rates, currency } = project;
  const form = useForm<RatesValues>({
    defaultValues: {
      by_gender: rates.by_gender,
      default_amount: toInput(rates.default_minor, currency),
      female_amount: toInput(rates.female_minor, currency),
      male_amount: toInput(rates.male_minor, currency),
    },
  });
  const byGender = useWatch({ control: form.control, name: 'by_gender' });
  const { errors } = form.formState;
  const failure = failureCode(save.error);
  const amount = {
    validate: (value: string) => {
      const minor = toMinor(value, currency);
      const most = options.data?.max_daily_minor ?? Number.MAX_SAFE_INTEGER;
      return (minor !== null && minor >= 0 && minor <= most) || t('wages.amountError');
    },
  };

  const submit = form.handleSubmit(async (values) => {
    const saved = await save
      .mutateAsync({
        id: project.id,
        body: {
          by_gender: values.by_gender,
          default_minor: toMinor(values.default_amount, currency) ?? 0,
          female_minor: toMinor(values.female_amount, currency) ?? 0,
          male_minor: toMinor(values.male_amount, currency) ?? 0,
        },
      })
      .catch(() => null);
    if (saved) toast(t('wages.ratesSaved'), { tone: 'success' });
  });

  return (
    <form
      noValidate
      className="space-y-4 rounded-3xl border border-border bg-surface p-4"
      onSubmit={(event) => void submit(event)}
    >
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <IndianRupee aria-hidden="true" className="size-5" />
        {t('wages.defaults')}
      </h2>
      <p className="text-sm text-muted">{t('wages.defaultsHint')}</p>
      {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
      <Switch
        label={t('wages.byGender')}
        checked={byGender}
        disabled={disabled}
        onCheckedChange={(checked) => {
          form.setValue('by_gender', checked, { shouldDirty: true });
        }}
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <TextField
          label={t('wages.default', { currency })}
          inputMode="decimal"
          disabled={disabled}
          error={errors.default_amount?.message}
          {...form.register('default_amount', amount)}
        />
        {byGender && (
          <>
            <TextField
              label={t('wages.female', { currency })}
              inputMode="decimal"
              disabled={disabled}
              error={errors.female_amount?.message}
              {...form.register('female_amount', amount)}
            />
            <TextField
              label={t('wages.male', { currency })}
              inputMode="decimal"
              disabled={disabled}
              error={errors.male_amount?.message}
              {...form.register('male_amount', amount)}
            />
          </>
        )}
      </div>
      {!disabled && (
        <Button type="submit" className="min-h-11" disabled={save.isPending}>
          {t('wages.saveRates')}
        </Button>
      )}
    </form>
  );
}

function WageRow({
  project,
  worker,
  disabled,
  onChange,
  onHistory,
}: {
  project: Project;
  worker: Worker;
  disabled: boolean;
  onChange: () => void;
  onHistory: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  return (
    <li className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3">
      <WorkerPhoto project={project.id} worker={worker} />
      <div className="min-w-0 flex-1">
        <p id={rowName(worker.id)} className="truncate font-semibold">
          {worker.name}
        </p>
        <p className="text-sm">
          {t('wages.now', {
            amount: formatMoney(worker.daily_wage_minor, project.currency, i18n.language),
          })}
        </p>
      </div>
      <Button
        variant="ghost"
        className="min-h-11"
        aria-label={t('wages.historyOf', { name: worker.name })}
        onClick={onHistory}
      >
        <History aria-hidden="true" className="size-4" />
      </Button>
      {!disabled && (
        <Button
          variant="secondary"
          className="min-h-11"
          {...rowButton(`labor-wage-${worker.id}`, rowName(worker.id))}
          onClick={onChange}
        >
          {t('wages.change')}
        </Button>
      )}
    </li>
  );
}

function WageForm({
  project,
  worker,
  onClose,
}: {
  project: Project;
  worker: Worker;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const { t: tError } = useTranslation('errors');
  const timezone = useSession((state) => state.user?.timezone);
  const today = todayIn(timezone);
  const options = useOptions();
  const save = useSetWage();
  const form = useForm({
    defaultValues: {
      amount: toInput(worker.daily_wage_minor, project.currency),
      from: today,
      reason: '',
    },
  });
  const { errors } = form.formState;
  const failure = failureCode(save.error);

  const submit = form.handleSubmit(async (values) => {
    const saved = await save
      .mutateAsync({
        id: worker.id,
        body: {
          daily_wage_minor: toMinor(values.amount, project.currency) ?? 0,
          effective_on: values.from,
          reason: values.reason.trim() || null,
        },
      })
      .catch(() => null);
    if (!saved) return;
    toast(
      t('wages.changed', {
        name: saved.name,
        amount: formatMoney(saved.daily_wage_minor, project.currency, i18n.language),
      }),
      { tone: 'success' },
    );
    onClose();
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('wages.changeTitle', { name: worker.name })}
      description={t('wages.changeBody')}
    >
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {failure && <Alert tone="danger">{tError(errorKey(failure))}</Alert>}
        <TextField
          label={t('wages.newWage', { currency: project.currency })}
          inputMode="decimal"
          autoComplete="off"
          error={errors.amount?.message}
          {...form.register('amount', {
            validate: (value) => {
              const minor = toMinor(value, project.currency);
              const most = options.data?.max_daily_minor ?? Number.MAX_SAFE_INTEGER;
              return (minor !== null && minor >= 0 && minor <= most) || t('wages.amountError');
            },
          })}
        />
        <TextField type="date" label={t('wages.from')} max={today} {...form.register('from')} />
        <TextField
          label={t('wages.reason')}
          maxLength={300}
          autoComplete="off"
          {...form.register('reason')}
        />
        <Button type="submit" className="min-h-12 w-full text-base" disabled={save.isPending}>
          {t('wages.saveWage')}
        </Button>
      </form>
    </Dialog>
  );
}

function WageHistory({
  project,
  worker,
  onClose,
}: {
  project: Project;
  worker: Worker;
  onClose: () => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const history = useWages(project.id, worker.id);
  const money = (minor: number) => formatMoney(minor, project.currency, i18n.language);
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('wages.historyOf', { name: worker.name })}
    >
      {history.isPending ? (
        <Skeleton className="h-24 rounded-2xl" />
      ) : (
        <ol className="space-y-2">
          {(history.data ?? []).map((change) => (
            <li key={change.created_at} className="rounded-2xl border border-border p-3 text-sm">
              <p className="font-semibold">
                {change.from_minor === null
                  ? t('wages.started', { amount: money(change.to_minor) })
                  : t('wages.fromTo', {
                      from: money(change.from_minor),
                      to: money(change.to_minor),
                    })}
              </p>
              <p className="text-muted">
                {t('wages.effective', {
                  date: displayDate(change.effective_on).toLocaleDateString(i18n.language, {
                    dateStyle: 'medium',
                  }),
                })}
                {change.reason ? ` · ${change.reason}` : ''}
              </p>
            </li>
          ))}
        </ol>
      )}
    </Dialog>
  );
}
