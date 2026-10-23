import { useState, type SyntheticEvent } from 'react';
import { useTranslation } from 'react-i18next';

import { useAuthConfig } from '@/core/auth/queries';
import {
  Alert,
  Badge,
  Button,
  Card,
  LoadError,
  Skeleton,
  Table,
  TextField,
  toast,
} from '@/design-system';
import { useAllowlist, useAllowlistActions } from '@/platform/admin/admin-api';
import { describeError } from '@/platform/auth/describe-error';

/** Who may register while registration is by invitation: added here, or set in the server's
 *  settings (those can only be changed there). */
export function AllowlistPage() {
  const { t, i18n } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const mode = useAuthConfig().data?.registration_mode;
  const allowed = useAllowlist();
  const actions = useAllowlistActions();
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const failed = actions.add.error ?? actions.remove.error;

  const add = (event: SyntheticEvent) => {
    event.preventDefault();
    actions.remove.reset(); // only the latest action's error shows
    actions.add.mutate(
      { email: email.trim(), note: note.trim() || null },
      {
        onSuccess: () => {
          toast(t('admin.allowlist.added', { email: email.trim() }), { tone: 'success' });
          setEmail('');
          setNote('');
        },
      },
    );
  };

  return (
    <div className="space-y-6">
      {mode && mode !== 'allowlist' && (
        <Alert tone="info">{t(`admin.allowlist.mode.${mode}`)}</Alert>
      )}
      <Card title={t('admin.allowlist.add')}>
        <form
          noValidate
          className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end"
          onSubmit={add}
        >
          <TextField
            label={t('auth.email')}
            type="email"
            autoComplete="off"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
            }}
          />
          <TextField
            label={t('admin.allowlist.note')}
            maxLength={200}
            value={note}
            onChange={(event) => {
              setNote(event.target.value);
            }}
          />
          <Button type="submit" disabled={actions.add.isPending || !email.trim()}>
            {t('admin.allowlist.addButton')}
          </Button>
        </form>
      </Card>
      {failed && <Alert tone="danger">{describeError(failed, t, tError)}</Alert>}
      {allowed.isPending && <Skeleton className="h-40" />}
      {allowed.isError && (
        <LoadError onRetry={() => void allowed.refetch()}>
          {describeError(allowed.error, t, tError)}
        </LoadError>
      )}
      {allowed.data && (
        <Table
          caption={t('admin.nav.allowlist')}
          rows={allowed.data}
          rowKey={(item) => item.email}
          empty={t('admin.allowlist.none')}
          columns={[
            { key: 'email', header: t('auth.email'), cell: (item) => item.email },
            { key: 'note', header: t('admin.allowlist.note'), cell: (item) => item.note ?? '' },
            {
              key: 'source',
              header: t('admin.allowlist.source'),
              cell: (item) => (
                <Badge tone={item.source === 'settings' ? 'locked' : 'neutral'}>
                  {t(`admin.allowlist.sources.${item.source}`)}
                </Badge>
              ),
            },
            {
              key: 'added',
              header: t('admin.allowlist.addedAt'),
              cell: (item) =>
                item.added_at
                  ? new Intl.DateTimeFormat(i18n.language, { dateStyle: 'medium' }).format(
                      new Date(item.added_at),
                    )
                  : '',
            },
            {
              key: 'remove',
              header: <span className="sr-only">{t('admin.allowlist.remove')}</span>,
              cell: (item) =>
                item.source === 'admin' ? (
                  <Button
                    variant="ghost"
                    aria-label={t('admin.allowlist.removeOne', { email: item.email })}
                    disabled={actions.remove.isPending}
                    onClick={() => {
                      actions.add.reset();
                      actions.remove.mutate(item.email);
                    }}
                  >
                    {t('admin.allowlist.remove')}
                  </Button>
                ) : null,
            },
          ]}
        />
      )}
    </div>
  );
}
