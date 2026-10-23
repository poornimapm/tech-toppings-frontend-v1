import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { Alert, Button, Card, LoadError, Skeleton, TextField, toast } from '@/design-system';
import { useTwoFactor, useTwoFactorActions } from '@/platform/auth/account-api';
import { describeError } from '@/platform/auth/describe-error';
import { useReauth, type Reauth } from '@/platform/auth/reauth';
import { ReauthFields } from '@/platform/auth/reauth-fields';
import { RecoveryCodes } from '@/platform/auth/recovery-codes';

type Stage =
  | { step: 'idle' }
  | { step: 'setup'; secret: string; uri: string }
  | { step: 'codes'; codes: string[] }
  | { step: 'renew' }
  | { step: 'disable' };

const IDLE: Stage = { step: 'idle' };
const LOW_CODES = 3;

/** A key typed by hand reads better in groups of four. */
const grouped = (secret: string) => secret.replace(/(.{4})/g, '$1 ').trim();

interface CodeFormProps {
  submitLabel: string;
  /** Turning it on or off: the password too (or Google again, without one). */
  reauthenticate?: boolean;
  pending: boolean;
  error: unknown;
  onSubmit: (code: string, reauth: Reauth) => void;
  onCancel: () => void;
}

/** A code from the app (and proof it's them, when it asks for it), to confirm a change. */
function CodeForm({
  submitLabel,
  reauthenticate,
  pending,
  error,
  onSubmit,
  onCancel,
}: CodeFormProps) {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const reauth = useReauth();
  const [code, setCode] = useState('');
  const passwordFirst = reauthenticate && reauth.hasPassword;

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    onSubmit(code.trim(), reauth);
  };

  return (
    <form noValidate className="space-y-3" onSubmit={submit}>
      {error !== null && <Alert tone="danger">{describeError(error, t, tError)}</Alert>}
      {reauthenticate && <ReauthFields reauth={reauth} focusFirst />}
      <TextField
        label={t('auth.twoFactor.code')}
        autoComplete="one-time-code"
        maxLength={32}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- the form was just opened for this
        autoFocus={!passwordFirst}
        value={code}
        onChange={(event) => {
          setCode(event.target.value);
        }}
      />
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          disabled={pending || !code.trim() || (reauthenticate && !reauth.ready)}
        >
          {submitLabel}
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          {t('actions.cancel')}
        </Button>
      </div>
    </form>
  );
}

/** Two-step sign-in: set it up with an authenticator app, renew recovery codes, turn it off. */
export function TwoFactorCard() {
  const { t, i18n } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const status = useTwoFactor();
  const actions = useTwoFactorActions();
  const [stage, setStage] = useState<Stage>(IDLE);
  const idle = () => {
    setStage(IDLE);
  };

  const body = () => {
    // Shown this once: never swapped for a spinner or a load error while the status refreshes.
    if (stage.step === 'codes') return <RecoveryCodes codes={stage.codes} onDone={idle} />;
    if (status.isPending) return <Skeleton className="h-16" />;
    if (status.isError) {
      return (
        <LoadError onRetry={() => void status.refetch()}>
          {describeError(status.error, t, tError)}
        </LoadError>
      );
    }
    const { available, enabled, enabled_at: since, recovery_codes_left: left } = status.data;
    if (!enabled && !available) {
      return <p className="text-sm text-muted">{t('security.twoFactor.unavailable')}</p>;
    }

    if (!enabled && stage.step === 'setup') {
      return (
        <div className="space-y-4">
          <ol className="list-decimal space-y-3 ps-5 text-sm">
            <li>
              <p>{t('security.twoFactor.scan')}</p>
              <a href={stage.uri} className="font-medium text-primary underline underline-offset-4">
                {t('security.twoFactor.openApp')}
              </a>
              <p className="mt-2 text-muted">{t('security.twoFactor.typeKey')}</p>
              <code className="mt-1 block rounded-lg bg-bg p-2 font-mono break-all">
                {grouped(stage.secret)}
              </code>
            </li>
            <li>{t('security.twoFactor.enterCode')}</li>
          </ol>
          <CodeForm
            submitLabel={t('security.twoFactor.turnOn')}
            reauthenticate
            pending={actions.enable.isPending}
            error={actions.enable.error}
            onCancel={idle}
            onSubmit={(code, reauth) => {
              actions.enable.mutate(
                { code, ...reauth.body },
                {
                  onSuccess: ({ recovery_codes: codes }) => {
                    setStage({ step: 'codes', codes });
                  },
                  onError: reauth.retryOn,
                },
              );
            }}
          />
        </div>
      );
    }

    if (!enabled) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-muted">{t('security.twoFactor.explain')}</p>
          {actions.setup.error !== null && (
            <Alert tone="danger">{describeError(actions.setup.error, t, tError)}</Alert>
          )}
          <Button
            disabled={actions.setup.isPending}
            onClick={() => {
              actions.enable.reset(); // a new secret: the last attempt's error no longer applies
              actions.setup.mutate(undefined, {
                onSuccess: ({ secret, otpauth_uri: uri }) => {
                  setStage({ step: 'setup', secret, uri });
                },
              });
            }}
          >
            {t('security.twoFactor.start')}
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        <p className="text-sm">
          {since
            ? t('security.twoFactor.onSince', {
                date: new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
                  new Date(since),
                ),
              })
            : t('security.twoFactor.on')}
        </p>
        {left <= LOW_CODES ? (
          <Alert tone="danger">{t('security.twoFactor.codesLeft', { count: left })}</Alert>
        ) : (
          <p className="text-sm text-muted">{t('security.twoFactor.codesLeft', { count: left })}</p>
        )}
        {stage.step === 'renew' && (
          <CodeForm
            submitLabel={t('security.twoFactor.renew')}
            pending={actions.renew.isPending}
            error={actions.renew.error}
            onCancel={idle}
            onSubmit={(code) => {
              actions.renew.mutate(code, {
                onSuccess: ({ recovery_codes: codes }) => {
                  setStage({ step: 'codes', codes });
                },
              });
            }}
          />
        )}
        {stage.step === 'disable' && (
          <CodeForm
            submitLabel={t('security.twoFactor.turnOff')}
            reauthenticate
            pending={actions.disable.isPending}
            error={actions.disable.error}
            onCancel={idle}
            onSubmit={(code, reauth) => {
              actions.disable.mutate(
                { code, ...reauth.body },
                {
                  onSuccess: () => {
                    idle();
                    toast(t('security.twoFactor.turnedOff'), { tone: 'success' });
                  },
                  onError: reauth.retryOn,
                },
              );
            }}
          />
        )}
        {stage.step === 'idle' && (
          <div className="flex flex-wrap gap-2">
            <Button
              variant="secondary"
              onClick={() => {
                actions.renew.reset();
                setStage({ step: 'renew' });
              }}
            >
              {t('security.twoFactor.renew')}
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                actions.disable.reset();
                setStage({ step: 'disable' });
              }}
            >
              {t('security.twoFactor.turnOff')}
            </Button>
          </div>
        )}
      </div>
    );
  };

  return <Card title={t('security.twoFactor.title')}>{body()}</Card>;
}
