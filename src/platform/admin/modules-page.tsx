import { useTranslation } from 'react-i18next';

import { textFor } from '@/core/modules/module-text';
import { useModuleRegistry } from '@/core/modules/registry';
import { Alert, Button, LoadError, SelectField, Skeleton, Switch, Table } from '@/design-system';
import { useAdminModules, useChangeModule, type AdminModule } from '@/platform/admin/admin-api';
import { describeError } from '@/platform/auth/describe-error';

const STATUSES: readonly AdminModule['status'][] = ['live', 'beta', 'coming_soon'];

/** Each module for everyone: its stage (live, beta, coming soon) and whether it is on at all.
 *  What an admin sets overrides the module's own manifest until reset. */
export function ModulesPage() {
  const { t, i18n } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const registry = useModuleRegistry();
  const modules = useAdminModules();
  const change = useChangeModule();
  const nameOf = (key: string) => textFor(registry.definitionFor(key), i18n.language).name;

  if (modules.isPending) return <Skeleton className="h-40" />;
  if (modules.isError) {
    return (
      <LoadError onRetry={() => void modules.refetch()}>
        {describeError(modules.error, t, tError)}
      </LoadError>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">{t('admin.modules.explain')}</p>
      {change.error !== null && (
        <Alert tone="danger">{describeError(change.error, t, tError)}</Alert>
      )}
      <Table
        caption={t('admin.nav.modules')}
        rows={modules.data}
        rowKey={(module) => module.key}
        columns={[
          { key: 'name', header: t('admin.modules.module'), cell: (module) => nameOf(module.key) },
          {
            key: 'status',
            header: t('admin.modules.stage'),
            cell: (module) => (
              <SelectField
                label={t('admin.modules.stageOf', { name: nameOf(module.key) })}
                hideLabel
                value={module.status}
                disabled={change.isPending}
                options={STATUSES.map((value) => ({
                  value,
                  label: t(`admin.modules.stages.${value}`),
                }))}
                onChange={(event) => {
                  change.mutate({
                    key: module.key,
                    status: event.target.value as AdminModule['status'],
                  });
                }}
              />
            ),
          },
          {
            key: 'on',
            header: t('admin.modules.on'),
            cell: (module) => (
              <Switch
                label={
                  <span className="sr-only">
                    {t('admin.modules.onFor', { name: nameOf(module.key) })}
                  </span>
                }
                checked={module.global_enabled}
                disabled={change.isPending}
                onCheckedChange={(checked) => {
                  change.mutate({ key: module.key, global_enabled: checked });
                }}
              />
            ),
          },
          {
            key: 'reset',
            header: <span className="sr-only">{t('admin.modules.reset')}</span>,
            cell: (module) =>
              module.overridden.length > 0 ? (
                <Button
                  variant="ghost"
                  aria-label={t('admin.modules.resetOne', { name: nameOf(module.key) })}
                  disabled={change.isPending}
                  title={t('admin.modules.resetHint')}
                  onClick={() => {
                    change.mutate({
                      key: module.key,
                      ...Object.fromEntries(module.overridden.map((field) => [field, null])),
                    });
                  }}
                >
                  {t('admin.modules.reset')}
                </Button>
              ) : null,
          },
        ]}
      />
    </div>
  );
}
