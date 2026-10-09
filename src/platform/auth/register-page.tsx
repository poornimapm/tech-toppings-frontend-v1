import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import * as z from 'zod/mini';

import { ApiError } from '@/core/api/api-error';
import { passwordViolations } from '@/core/auth/password-policy';
import { useAuthConfig } from '@/core/auth/queries';
import { register as registerAccount } from '@/core/auth/session';
import { Alert, Button, PasswordField, TextField } from '@/design-system';
import { AuthCard } from '@/platform/auth/auth-card';
import { describeError } from '@/platform/auth/describe-error';
import { PasswordRules } from '@/platform/auth/password-rules';
import { validationMessage } from '@/platform/auth/validation';

const schema = z
  .object({
    name: z
      .string()
      .check(
        z.trim(),
        z.minLength(1, { error: 'required' }),
        z.maxLength(80, { error: 'tooLong' }),
      ),
    email: z.email({ error: 'email' }),
    password: z.string().check(z.minLength(1, { error: 'required' })),
    confirm: z.string(),
  })
  .check(
    z.refine((values) => values.password === values.confirm, {
      error: 'mismatch',
      path: ['confirm'],
    }),
  );
type RegisterForm = z.infer<typeof schema>;

export function RegisterPage() {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const navigate = useNavigate();
  const config = useAuthConfig();
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', password: '', confirm: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const password = useWatch({ control: form.control, name: 'password' });
  const policy = config.data?.password_policy;

  if (config.data?.registration_mode === 'closed') {
    return (
      <AuthCard title={t('auth.register.title')}>
        <Alert>{t('auth.register.closed')}</Alert>
      </AuthCard>
    );
  }

  const submit = form.handleSubmit(async ({ name, email, password: chosen }) => {
    setFailure(null);
    if (policy && passwordViolations(chosen, policy).length > 0) {
      form.setError('password', { message: tError('AUTH_PASSWORD_POLICY') });
      return;
    }
    try {
      await registerAccount({ name, email, password: chosen });
      await navigate('/', { replace: true });
    } catch (error) {
      const message = describeError(error, t, tError);
      if (error instanceof ApiError && error.code === 'AUTH_EMAIL_TAKEN') {
        form.setError('email', { message });
      } else if (error instanceof ApiError && error.code === 'AUTH_PASSWORD_POLICY') {
        form.setError('password', { message });
      } else {
        setFailure(message);
      }
    }
  });

  return (
    <AuthCard title={t('auth.register.title')}>
      {failure && <Alert tone="danger">{failure}</Alert>}
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        <TextField
          label={t('auth.name')}
          autoComplete="name"
          error={validationMessage(errors.name, t)}
          {...form.register('name')}
        />
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          error={validationMessage(errors.email, t)}
          {...form.register('email')}
        />
        <PasswordField
          label={t('auth.password')}
          autoComplete="new-password"
          showLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          error={validationMessage(errors.password, t)}
          hint={policy && <PasswordRules password={password} policy={policy} />}
          {...form.register('password')}
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
          {t('auth.register.submit')}
        </Button>
      </form>
      <p className="text-sm">
        {t('auth.register.haveAccount')}{' '}
        <Link to="/login" className="font-medium text-primary underline underline-offset-4">
          {t('auth.register.signIn')}
        </Link>
      </p>
    </AuthCard>
  );
}
