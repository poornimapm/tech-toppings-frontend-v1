import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/core/api/api-error';
import { finishSignIn } from '@/core/auth/session';
import { Alert, Button, TextField } from '@/design-system';
import { describeError } from '@/platform/auth/describe-error';

interface TwoFactorStepProps {
  challenge: string;
  onSignedIn: () => void | Promise<void>;
  /** Back to the first step: by choice, or because the challenge ran out (with why). */
  onRestart: (reason?: string) => void;
}

/** Sign-in's second step: a code from the authenticator app, or a recovery code. */
export function TwoFactorStep({ challenge, onSignedIn, onRestart }: TwoFactorStepProps) {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const [code, setCode] = useState('');
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: SyntheticEvent) => {
    event.preventDefault();
    if (!code.trim()) {
      setFailure(t('auth.validation.required'));
      return;
    }
    setBusy(true);
    setFailure(null);
    try {
      await finishSignIn(challenge, code.trim());
      await onSignedIn();
    } catch (error) {
      const message = describeError(error, t, tError);
      if (error instanceof ApiError && error.code === 'AUTH_TWO_FACTOR_CHALLENGE_INVALID') {
        onRestart(message);
        return;
      }
      setFailure(message);
      setBusy(false);
    }
  };

  return (
    <form noValidate className="space-y-4" onSubmit={(event) => void submit(event)}>
      <p className="text-sm text-muted">{t('auth.twoFactor.prompt')}</p>
      {failure && <Alert tone="danger">{failure}</Alert>}
      <TextField
        label={t('auth.twoFactor.code')}
        autoComplete="one-time-code"
        maxLength={32}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- sign-in just moved to this step
        autoFocus
        value={code}
        hint={t('auth.twoFactor.recoveryHint')}
        onChange={(event) => {
          setCode(event.target.value);
        }}
      />
      <Button type="submit" className="w-full" disabled={busy}>
        {t('auth.twoFactor.submit')}
      </Button>
      <Button
        variant="ghost"
        className="w-full"
        onClick={() => {
          onRestart();
        }}
      >
        {t('auth.twoFactor.back')}
      </Button>
    </form>
  );
}
