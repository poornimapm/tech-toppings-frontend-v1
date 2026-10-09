import { useTranslation } from 'react-i18next';
import { Link, Outlet } from 'react-router';

import { textFor } from '@/core/modules/module-text';
import { useModuleViews } from '@/core/modules/queries';
import { useModuleRegistry } from '@/core/modules/registry';
import { Skeleton } from '@/design-system';

/**
 * Wraps a module's pages: they render only while the module is available to this user. The
 * API enforces the same rule (403 MODULE_DISABLED); this just explains it nicely.
 */
export function ModuleGate({ moduleKey }: { moduleKey: string }) {
  const { t, i18n } = useTranslation();
  const registry = useModuleRegistry();
  const views = useModuleViews();
  const view = views.data?.find((item) => item.key === moduleKey);

  if (views.isPending) return <Skeleton className="h-64 rounded-3xl" />;
  if (view?.available) return <Outlet />;

  const name = textFor(registry.definitionFor(moduleKey), i18n.language).name;
  return (
    <div className="mx-auto max-w-md space-y-4 py-16 text-center">
      <h1 className="text-2xl font-bold tracking-tight">
        {t('module.unavailableTitle', { name })}
      </h1>
      <p className="text-muted">{t('module.unavailableBody')}</p>
      <Link to="/" className="inline-block font-medium text-primary underline underline-offset-4">
        {t('module.backHome')}
      </Link>
    </div>
  );
}
