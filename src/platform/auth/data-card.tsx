import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { Alert, Button, Card, Dialog, TextField, toast } from '@/design-system';
import { useDeleteAccount, useExportData } from '@/platform/auth/account-api';
import { describeError } from '@/platform/auth/describe-error';
import { useReauth } from '@/platform/auth/reauth';
import { ReauthFields } from '@/platform/auth/reauth-fields';

/**
 * Deleting the account asks for proof it's really them, just now: the email typed out, the
 * password (or Google sign-in again for an account without one), and a code with two-step on.
 * It is mounted only while open, so each opening starts with nothing typed.
 */
function DeleteAccountDialog({ onClose }: { onClose: () => void }) {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const navigate = useNavigate();
  const user = useSession((state) => state.user);
  const reauth = useReauth();
  const remove = useDeleteAccount(() => {
    toast(t('security.data.deleted'), { tone: 'success' });
    void navigate('/login', { replace: true });
  });
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  if (!user) return null;

  const submit = (event: SyntheticEvent) => {
    event.preventDefault();
    remove.mutate(
      {
        confirm_email: email.trim(),
        ...reauth.body,
        code: user.two_factor ? code.trim() : null,
      },
      { onError: reauth.retryOn },
    );
  };

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      title={t('security.data.deleteTitle')}
      description={t('security.data.deleteWarning')}
    >
      <form noValidate className="mt-4 space-y-3" onSubmit={submit}>
        {remove.error !== null && (
          <Alert tone="danger">{describeError(remove.error, t, tError)}</Alert>
        )}
        <TextField
          label={t('security.data.confirmEmail', { email: user.email })}
          type="email"
          autoComplete="off"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
          }}
        />
        <ReauthFields reauth={reauth} />
        {user.two_factor && (
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
        <div className="flex flex-wrap gap-2 pt-2">
          <Button
            type="submit"
            variant="secondary"
            className="border-danger text-danger"
            disabled={
              remove.isPending ||
              email.trim().toLowerCase() !== user.email ||
              !reauth.ready ||
              (user.two_factor && !code.trim())
            }
          >
            {t('security.data.deleteForGood')}
          </Button>
          <Button variant="ghost" onClick={onClose}>
            {t('actions.cancel')}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}

/** The user's right to their data: all of it as one file, or none of it kept. */
export function DataCard() {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const exportData = useExportData();
  const [deleting, setDeleting] = useState(false);

  return (
    <Card title={t('security.data.title')}>
      <div className="space-y-5">
        <div className="space-y-2">
          <p className="text-sm text-muted">{t('security.data.exportExplain')}</p>
          {exportData.error !== null && (
            <Alert tone="danger">{describeError(exportData.error, t, tError)}</Alert>
          )}
          <Button
            variant="secondary"
            disabled={exportData.isPending}
            onClick={() => {
              exportData.mutate();
            }}
          >
            {t('security.data.export')}
          </Button>
        </div>
        <div className="space-y-2 border-t border-border pt-4">
          <p className="text-sm text-muted">{t('security.data.deleteExplain')}</p>
          <Button
            variant="secondary"
            className="text-danger"
            onClick={() => {
              setDeleting(true);
            }}
          >
            {t('security.data.delete')}
          </Button>
        </div>
      </div>
      {deleting && (
        <DeleteAccountDialog
          onClose={() => {
            setDeleting(false);
          }}
        />
      )}
    </Card>
  );
}
