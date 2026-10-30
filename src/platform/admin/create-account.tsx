import { Copy } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

import { textFor } from '@/core/modules/module-text';
import { useModuleRegistry } from '@/core/modules/registry';
import { Alert, Button, Dialog, TextField } from '@/design-system';
import { useAdminModules, useCreateUser } from '@/platform/admin/admin-api';
import { describeError } from '@/platform/auth/describe-error';

interface FormValues {
  email: string;
  name: string;
  modules: string[];
}

/**
 * A new account, made by the admin (an owner of Labor Management, say): their email and name,
 * the modules only some accounts may use that they are given, and a one-time password shown
 * once, which they change when they first sign in.
 */
export function CreateAccount({ onClose }: { onClose: () => void }) {
  const { t, i18n } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const registry = useModuleRegistry();
  const modules = useAdminModules();
  const create = useCreateUser();
  const [made, setMade] = useState<{ name: string; password: string } | null>(null);
  const form = useForm<FormValues>({ defaultValues: { email: '', name: '', modules: [] } });
  const { errors } = form.formState;
  const grantable = (modules.data ?? []).filter((module) => module.audience === 'granted');

  const submit = form.handleSubmit(async (values) => {
    const created = await create
      .mutateAsync({
        email: values.email.trim(),
        name: values.name.trim(),
        modules: values.modules,
      })
      .catch(() => null);
    if (created) setMade({ name: created.user.name, password: created.one_time_password });
  });

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('admin.create.title')}
      description={made ? undefined : t('admin.create.body')}
    >
      {made ? (
        <div className="space-y-4">
          <Alert tone="info">
            <p>{t('admin.create.made', { name: made.name })}</p>
            <p className="mt-1">{t('admin.user.oneTime')}</p>
            <p className="mt-2 flex items-center gap-2">
              <code className="rounded bg-bg px-2 py-1 font-mono text-base">{made.password}</code>
              <Button
                variant="ghost"
                title={t('security.twoFactor.copy')}
                onClick={() => {
                  void navigator.clipboard.writeText(made.password);
                }}
              >
                <Copy aria-hidden="true" className="size-4" />
                <span className="sr-only">{t('security.twoFactor.copy')}</span>
              </Button>
            </p>
          </Alert>
          <Button className="w-full" onClick={onClose}>
            {t('admin.create.done')}
          </Button>
        </div>
      ) : (
        <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
          {create.error && <Alert tone="danger">{describeError(create.error, t, tError)}</Alert>}
          <TextField
            type="email"
            label={t('auth.email')}
            autoComplete="off"
            error={errors.email?.message}
            {...form.register('email', {
              validate: (value) =>
                /^\S+@\S+\.\S+$/.test(value.trim()) || t('admin.create.emailError'),
            })}
          />
          <TextField
            label={t('admin.create.name')}
            maxLength={80}
            autoComplete="off"
            error={errors.name?.message}
            {...form.register('name', {
              validate: (value) => value.trim() !== '' || t('admin.create.nameError'),
            })}
          />
          {grantable.length > 0 && (
            <fieldset className="space-y-2">
              <legend className="text-sm font-medium">{t('admin.create.modules')}</legend>
              {grantable.map((module) => (
                <label key={module.key} className="flex min-h-11 items-center gap-2 text-sm">
                  <input type="checkbox" value={module.key} {...form.register('modules')} />
                  {textFor(registry.definitionFor(module.key), i18n.language).name}
                </label>
              ))}
            </fieldset>
          )}
          <Button type="submit" className="w-full" disabled={create.isPending}>
            {t('admin.create.submit')}
          </Button>
        </form>
      )}
    </Dialog>
  );
}
