import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';
import * as z from 'zod/mini';

import { safeNext } from '@/core/auth/safe-next';
import { useAuthConfig } from '@/core/auth/queries';
import { needsCode, signIn, signInWithGoogle, type SignInResult } from '@/core/auth/session';
import { Alert, Button, PasswordField, TextField } from '@/design-system';
import { AuthCard } from '@/platform/auth/auth-card';
import { describeError } from '@/platform/auth/describe-error';
import { GoogleSignInButton } from '@/platform/auth/google-sign-in-button';
import { TwoFactorStep } from '@/platform/auth/two-factor-step';
import { validationMessage } from '@/platform/auth/validation';

const schema = z.object({
  email: z.email({ error: 'email' }),
  password: z.string().check(z.minLength(1, { error: 'required' })),
});
type LoginForm = z.infer<typeof schema>;

export function LoginPage() {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const config = useAuthConfig();
  const [failure, setFailure] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  const form = useForm<LoginForm>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const next = safeNext(params.get('next'));

  const goOn = () => navigate(next, { replace: true });

  const finish = async (attempt: () => Promise<SignInResult>) => {
    setFailure(null);
    try {
      const result = await attempt();
      if (needsCode(result)) setChallenge(result.challenge_token);
      else await goOn();
    } catch (error) {
      setFailure(describeError(error, t, tError));
    }
  };

  const googleClientId = config.data?.google_client_id;

  if (challenge) {
    return (
      <AuthCard title={t('auth.twoFactor.title')}>
        <TwoFactorStep
          challenge={challenge}
          onSignedIn={goOn}
          onRestart={(reason) => {
            setChallenge(null);
            setFailure(reason ?? null);
          }}
        />
      </AuthCard>
    );
  }

  return (
    <AuthCard title={t('auth.login.title')}>
      {failure && <Alert tone="danger">{failure}</Alert>}
      <form
        noValidate
        className="space-y-4"
        onSubmit={(event) =>
          void form.handleSubmit((values) => finish(() => signIn(values)))(event)
        }
      >
        <TextField
          label={t('auth.email')}
          type="email"
          autoComplete="email"
          error={validationMessage(errors.email, t)}
          {...form.register('email')}
        />
        <PasswordField
          label={t('auth.password')}
          autoComplete="current-password"
          showLabel={t('auth.showPassword')}
          hideLabel={t('auth.hidePassword')}
          error={validationMessage(errors.password, t)}
          {...form.register('password')}
        />
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {t('auth.login.submit')}
        </Button>
      </form>
      {googleClientId && (
        <>
          <p className="text-center text-sm text-muted">{t('auth.google.divider')}</p>
          <GoogleSignInButton
            clientId={googleClientId}
            onCredential={(idToken) => void finish(() => signInWithGoogle(idToken))}
          />
        </>
      )}
      <p className="text-sm text-muted">{t('auth.login.forgot')}</p>
      {config.data?.registration_mode !== 'closed' && (
        <p className="text-sm">
          {t('auth.login.noAccount')}{' '}
          <Link to="/register" className="font-medium text-primary underline underline-offset-4">
            {t('auth.login.register')}
          </Link>
        </p>
      )}
    </AuthCard>
  );
}
