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
import { Alert, Button, PasswordField, TextField } from '@/design-system';
import { AuthCard } from '@/platform/auth/auth-card';
import { describeError } from '@/platform/auth/describe-error';
import { PasswordRules } from '@/platform/auth/password-rules';
import { useReauth } from '@/platform/auth/reauth';
import { ReauthFields } from '@/platform/auth/reauth-fields';
import { validationMessage } from '@/platform/auth/validation';

/** An account without a password (Google only) has no current one to type. */
const schemaFor = (hasPassword: boolean) =>
  z
    .object({
      current: hasPassword ? z.string().check(z.minLength(1, { error: 'required' })) : z.string(),
      next: z.string().check(z.minLength(1, { error: 'required' })),
      confirm: z.string(),
    })
    .check(
      z.refine((values) => values.next === values.confirm, {
        error: 'mismatch',
        path: ['confirm'],
      }),
    );
type ChangeForm = z.infer<ReturnType<typeof schemaFor>>;

/**
 * Voluntary change, the forced change after an admin reset (must_change_password), or a
 * Google-only account's first password: that takes Google sign-in again (and a code with
 * two-step on), since a password set from a stolen session would open account deletion.
 */
export function ChangePasswordPage() {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const navigate = useNavigate();
  const forced = useSession((state) => state.user?.must_change_password ?? false);
  const twoFactor = useSession((state) => state.user?.two_factor ?? false);
  const reauth = useReauth();
  const first = !reauth.hasPassword;
  const [code, setCode] = useState('');
  const config = useAuthConfig();
  const [failure, setFailure] = useState<string | null>(null);
  const form = useForm<ChangeForm>({
    resolver: zodResolver(schemaFor(reauth.hasPassword)),
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
      await changePassword(
        first
          ? {
              new_password: next,
              google_id_token: reauth.googleToken,
              code: twoFactor ? code.trim() : null,
            }
          : { current_password: current, new_password: next },
      );
      await navigate('/', { replace: true });
    } catch (error) {
      reauth.retryOn(error);
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
    <AuthCard
      title={
        forced
          ? t('auth.change.forcedTitle')
          : first
            ? t('auth.change.setTitle')
            : t('auth.change.title')
      }
    >
      {forced && <Alert>{t('auth.change.forcedBody')}</Alert>}
      {first && <Alert>{t('auth.change.setBody')}</Alert>}
      {failure && <Alert tone="danger">{failure}</Alert>}
      <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
        {first ? (
          <>
            <ReauthFields reauth={reauth} />
            {twoFactor && (
              <TextField
                label={t('auth.twoFactor.code')}
                autoComplete="one-time-code"
                maxLength={32}
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                }}
              />
            )}
          </>
        ) : (
          <PasswordField
            label={forced ? t('auth.change.currentOneTime') : t('auth.change.current')}
            autoComplete="current-password"
            showLabel={t('auth.showPassword')}
            hideLabel={t('auth.hidePassword')}
            error={validationMessage(errors.current, t)}
            {...form.register('current')}
          />
        )}
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
        <Button
          type="submit"
          className="w-full"
          disabled={isSubmitting || (first && (!reauth.ready || (twoFactor && !code.trim())))}
        >
          {t('auth.change.submit')}
        </Button>
      </form>
    </AuthCard>
  );
}
