import { useTranslation } from 'react-i18next';

import { useAuthConfig } from '@/core/auth/queries';
import { Alert, PasswordField } from '@/design-system';
import { GoogleSignInButton } from '@/platform/auth/google-sign-in-button';
import type { Reauth } from '@/platform/auth/reauth';

/** The password field, or Google's button for an account without a password. */
export function ReauthFields({ reauth, focusFirst }: { reauth: Reauth; focusFirst?: boolean }) {
  const { t } = useTranslation();
  const googleClientId = useAuthConfig().data?.google_client_id;

  if (reauth.hasPassword) {
    return (
      <PasswordField
        label={t('auth.password')}
        autoComplete="current-password"
        showLabel={t('auth.showPassword')}
        hideLabel={t('auth.hidePassword')}
        // eslint-disable-next-line jsx-a11y/no-autofocus -- the form was just opened for this
        autoFocus={focusFirst}
        value={reauth.password}
        onChange={(event) => {
          reauth.setPassword(event.target.value);
        }}
      />
    );
  }
  if (reauth.googleToken) {
    return <p className="text-sm text-success">{t('security.reauth.googleConfirmed')}</p>;
  }
  if (!googleClientId) return <Alert tone="danger">{t('security.reauth.noGoogle')}</Alert>;
  return (
    <div className="space-y-2">
      <p className="text-sm text-muted">{t('security.reauth.googleAgain')}</p>
      <GoogleSignInButton clientId={googleClientId} onCredential={reauth.setGoogleToken} />
    </div>
  );
}
