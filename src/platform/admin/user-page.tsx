import { ArrowLeft, Copy } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useParams } from 'react-router';

import { useSession } from '@/core/auth/session-store';
import { relativeTime } from '@/core/utils/relative-time';
import { Alert, Button, Card, LoadError, SelectField, Skeleton, toast } from '@/design-system';
import { useAdminUser, useUserActions, type AdminUserDetail } from '@/platform/admin/admin-api';
import { ConfirmDialog } from '@/platform/admin/confirm-dialog';
import { UserBadges } from '@/platform/admin/user-badges';
import { describeError } from '@/platform/auth/describe-error';
import { pages } from '@/platform/shell/pages';

type Role = AdminUserDetail['role'];
type Pending = 'role' | 'disable' | 'enable' | 'revoke' | 'reset';

/** One account: its details, and what an admin can do about it (never to their own). Each
 *  change is confirmed first, and a refusal is shown in the dialog that asked. */
export function UserPage() {
  const { t, i18n } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const { userId = '' } = useParams();
  const me = useSession((state) => state.user?.id);
  const user = useAdminUser(userId);
  const actions = useUserActions(userId);
  const [confirming, setConfirming] = useState<Pending | null>(null);
  const [role, setRole] = useState<Role>('user');
  const [oneTime, setOneTime] = useState<string | null>(null);
  const close = () => {
    setConfirming(null);
  };
  const ask = (pending: Pending) => {
    // Only what happens next may show an error, never one from an earlier action.
    actions.change.reset();
    actions.revokeSessions.reset();
    actions.resetPassword.reset();
    setConfirming(pending);
  };

  if (user.isPending) return <Skeleton className="h-60" />;
  if (user.isError) {
    return (
      <LoadError onRetry={() => void user.refetch()}>
        {describeError(user.error, t, tError)}
      </LoadError>
    );
  }
  const account = user.data;
  const date = (iso: string) =>
    new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(new Date(iso));
  const self = account.id === me;

  const confirmations = {
    role: {
      title: t('admin.user.roleTitle', {
        name: account.name,
        role: t(`admin.users.roles.${role}`),
      }),
      body: t('admin.user.roleBody'),
      mutation: actions.change,
      run: () => {
        actions.change.mutate(
          { role },
          {
            onSuccess: () => {
              close();
              toast(t('admin.user.roleSaved'), { tone: 'success' });
            },
          },
        );
      },
    },
    disable: {
      title: t('admin.user.disableTitle', { name: account.name }),
      body: t('admin.user.disableBody'),
      mutation: actions.change,
      run: () => {
        actions.change.mutate({ disabled: true }, { onSuccess: close });
      },
    },
    enable: {
      title: t('admin.user.enableTitle', { name: account.name }),
      body: t('admin.user.enableBody'),
      mutation: actions.change,
      run: () => {
        actions.change.mutate({ disabled: false }, { onSuccess: close });
      },
    },
    revoke: {
      title: t('admin.user.revokeTitle', { name: account.name }),
      body: t('admin.user.revokeBody'),
      mutation: actions.revokeSessions,
      run: () => {
        actions.revokeSessions.mutate(undefined, {
          onSuccess: ({ sessions }) => {
            close();
            toast(t('admin.user.revoked', { count: sessions }), { tone: 'success' });
          },
        });
      },
    },
    reset: {
      title: t('admin.user.resetTitle', { name: account.name }),
      body: t('admin.user.resetBody'),
      mutation: actions.resetPassword,
      run: () => {
        actions.resetPassword.mutate(undefined, {
          onSuccess: ({ one_time_password: password }) => {
            close();
            setOneTime(password);
          },
        });
      },
    },
  };
  const open = confirming ? confirmations[confirming] : null;

  return (
    <div className="space-y-6">
      <Link
        to={`${pages.admin.path}/users`}
        className="inline-flex items-center gap-1 text-sm text-primary"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('admin.nav.users')}
      </Link>
      <Card title={account.name}>
        <dl className="grid gap-2 text-sm sm:grid-cols-[auto_1fr]">
          <dt className="text-muted">{t('auth.email')}</dt>
          <dd>{account.email}</dd>
          <dt className="text-muted">{t('admin.users.status')}</dt>
          <dd>
            <UserBadges user={account} />
          </dd>
          <dt className="text-muted">{t('admin.user.joined')}</dt>
          <dd>{date(account.created_at)}</dd>
          <dt className="text-muted">{t('admin.users.lastSignIn')}</dt>
          <dd>
            {account.last_login_at
              ? relativeTime(account.last_login_at, i18n.language)
              : t('admin.users.never')}
          </dd>
          <dt className="text-muted">{t('admin.user.google')}</dt>
          <dd>
            {account.providers.includes('google')
              ? t('admin.user.linked')
              : t('admin.user.notLinked')}
          </dd>
          <dt className="text-muted">{t('admin.user.devices')}</dt>
          <dd>{t('admin.user.liveSessions', { count: account.live_sessions })}</dd>
        </dl>
        <Link
          to={`${pages.admin.path}/audit?owner_id=${account.id}`}
          className="mt-3 inline-block text-sm font-medium text-primary underline underline-offset-4"
        >
          {t('admin.user.trail')}
        </Link>
      </Card>

      {oneTime && (
        <Alert tone="info">
          <p>{t('admin.user.oneTime')}</p>
          <p className="mt-2 flex items-center gap-2">
            <code className="rounded bg-bg px-2 py-1 font-mono text-base">{oneTime}</code>
            <Button
              variant="ghost"
              title={t('security.twoFactor.copy')}
              onClick={() => {
                void navigator.clipboard.writeText(oneTime);
              }}
            >
              <Copy aria-hidden="true" className="size-4" />
              <span className="sr-only">{t('security.twoFactor.copy')}</span>
            </Button>
          </p>
        </Alert>
      )}

      <Card title={t('admin.user.actions')}>
        {self ? (
          <p className="text-sm text-muted">{t('admin.user.self')}</p>
        ) : (
          <div className="space-y-4">
            <div className="max-w-48">
              <SelectField
                label={t('admin.users.role')}
                value={account.role}
                disabled={actions.change.isPending}
                options={(['user', 'admin'] as const).map((value) => ({
                  value,
                  label: t(`admin.users.roles.${value}`),
                }))}
                onChange={(event) => {
                  setRole(event.target.value as Role); // shown as is until confirmed
                  ask('role');
                }}
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  ask(account.disabled ? 'enable' : 'disable');
                }}
              >
                {account.disabled ? t('admin.user.enable') : t('admin.user.disable')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  ask('revoke');
                }}
              >
                {t('admin.user.revoke')}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  ask('reset');
                }}
              >
                {t('admin.user.reset')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      <ConfirmDialog
        open={open !== null}
        title={open?.title ?? ''}
        body={open?.body ?? ''}
        confirmLabel={t('admin.user.confirm')}
        pending={
          actions.change.isPending ||
          actions.revokeSessions.isPending ||
          actions.resetPassword.isPending
        }
        error={open?.mutation.error ? describeError(open.mutation.error, t, tError) : null}
        onConfirm={() => open?.run()}
        onClose={close}
      />
    </div>
  );
}
