import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { safeNext } from '@/core/auth/safe-next';
import { useAuthConfig } from '@/core/auth/queries';
import { needsCode, signIn, signInWithGoogle, type SignInResult } from '@/core/auth/session';
import { Alert, Button, PasswordField, TextField } from '@/design-system';
import { AuthCard } from '@/platform/auth/auth-card';
import { describeError } from '@/platform/auth/describe-error';
import { GoogleSignInButton } from '@/platform/auth/google-sign-in-button';
import { TwoFactorStep } from '@/platform/auth/two-factor-step';
import {
  checkSignIn,
  validationMessage,
  type SignInProblems,
  type SignInValues,
} from '@/platform/auth/validation';

const FIELDS = ['email', 'password'] as const satisfies readonly (keyof SignInValues)[];

/** What the form holds, read from the form itself (autofill counts even without events). */
function readForm(form: HTMLFormElement): SignInValues {
  const data = new FormData(form);
  const text = (name: keyof SignInValues) => {
    const value = data.get(name);
    return typeof value === 'string' ? value : '';
  };
  return { email: text('email'), password: text('password') };
}

export function LoginPage() {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const config = useAuthConfig();
  const [failure, setFailure] = useState<string | null>(null);
  const [challenge, setChallenge] = useState<string | null>(null);
  // Checked on submit, then again as the fields change; the first field at fault takes focus.
  const [errors, setErrors] = useState<SignInProblems | null>(null);
  const [isSubmitting, setSubmitting] = useState(false);
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

  const submit = async (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    const values = readForm(form);
    const problems = checkSignIn(values);
    setErrors(problems);
    const first = FIELDS.find((name) => problems[name]);
    if (first) {
      form.querySelector<HTMLInputElement>(`[name="${first}"]`)?.focus();
      return;
    }
    setSubmitting(true);
    try {
      await finish(() => signIn(values));
    } finally {
      setSubmitting(false);
    }
  };

  const googleClientId = config.data?.google_client_id;

  return (
    <>
      {challenge && (
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
      )}
      {/* Hidden, not unmounted, during the code step: Back (or a sign-in that ran out) finds the
          email and password as they were, so one press of Sign in tries again. */}
      <div hidden={challenge !== null}>
        <AuthCard title={t('auth.login.title')}>
          {failure && <Alert tone="danger">{failure}</Alert>}
          <form
            noValidate
            className="space-y-4"
            onSubmit={(event) => void submit(event)}
            onChange={(event) => {
              if (errors) setErrors(checkSignIn(readForm(event.currentTarget)));
            }}
          >
            <TextField
              label={t('auth.email')}
              name="email"
              type="email"
              autoComplete="email"
              error={validationMessage(errors?.email, t)}
            />
            <PasswordField
              label={t('auth.password')}
              name="password"
              autoComplete="current-password"
              showLabel={t('auth.showPassword')}
              hideLabel={t('auth.hidePassword')}
              error={validationMessage(errors?.password, t)}
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
              <Link
                to="/register"
                className="font-medium text-primary underline underline-offset-4"
              >
                {t('auth.login.register')}
              </Link>
            </p>
          )}
        </AuthCard>
      </div>
    </>
  );
}
