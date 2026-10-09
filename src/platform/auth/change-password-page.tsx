import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import * as z from 'zod/mini';

import { ApiError } from '@/core/api/api-error';
import { passwordViolations } from '@/core/auth/password-policy';
import { useAuthConfig } from '@/core/auth/queries';
import { changePassword } from '@/core/auth/session';
import { useSession } from '@/core/auth/session-store';
import { Alert, Button, PasswordField } from '@/design-system';
import { AuthCard } from '@/platform/auth/auth-card';
import { describeError } from '@/platform/auth/describe-error';
import { PasswordRules } from '@/platform/auth/password-rules';
import { validationMessage } from '@/platform/auth/validation';

const schema = z
  .object({
    current: z.string().check(z.minLength(1, { error: 'required' })),
    next: z.string().check(z.minLength(1, { error: 'required' })),
    confirm: z.string(),
  })
  .check(
    z.refine((values) => values.next === values.confirm, { error: 'mismatch', path: ['confirm'] }),
  );
type ChangeForm = z.infer<typeof schema>;

/** Voluntary change, or the forced change after an admin reset (must_change_password). */
export function ChangePasswordPage() {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const navigate = useNavigate();
  const forced = useSession((state) => state.user?.must_change_password ?? false);
  const config = useAuthConfig();
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<ChangeForm>({
    resolver: zodResolver(schema),
    defaultValues: { current: '', next: '', confirm: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const policy = config.data?.password_policy;
  const nextPassword = useWatch({ control: form.control, name: 'next' });

  const submit = form.handleSubmit(async ({ current, next }) => {
    setFailure(null);
    if (policy && passwordViolations(next, policy).length > 0) {
      form.setError('next', { message: tError('AUTH_PASSWORD_POLICY') });
      return;
    }
    try {
      await changePassword({ current_password: current, new_password: next });
      await navigate('/', { replace: true });
    } catch (error) {
      const message = describeError(error, t, tError);
      if (error instanceof ApiError && error.code === 'AUTH_CURRENT_PASSWORD_INVALID') {
        form.setError('current', { message });
      } else if (error instanceof ApiError && error.code === 'AUTH_PASSWORD_POLICY') {
        form.setError('next', { message });
      } else {
        setFailure(message);
      }
    }
  });

  return (
    <AuthCard title={forced ? t('auth.change.forcedTitle') : t('auth.change.title')}>
      {forced && <Alert>{t('auth.change.forcedBody')}</Alert>}
      {failure && <Alert tone="danger">{failure}</Alert>}
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        <PasswordField
          label={forced ? t('auth.change.currentOneTime') : t('auth.change.current')}
          autoComplete="current-password"
          showLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          error={validationMessage(errors.current, t)}
          {...form.register('current')}
        />
        <PasswordField
          label={t('auth.change.new')}
          autoComplete="new-password"
          showLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          error={validationMessage(errors.next, t)}
          hint={policy && <PasswordRules password={nextPassword} policy={policy} />}
          {...form.register('next')}
        />
        <PasswordField
          label={t('auth.confirmPassword')}
          autoComplete="new-password"
          showLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          error={validationMessage(errors.confirm, t)}
          {...form.register('confirm')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t('auth.change.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
