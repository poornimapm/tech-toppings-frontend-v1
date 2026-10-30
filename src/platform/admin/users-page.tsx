import { useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { relativeTime } from '@/core/utils/relative-time';
import {
  Button,
  LoadError,
  Pager,
  SearchField,
  SelectField,
  Skeleton,
  Table,
} from '@/design-system';
import { FILTER_LIMITS, useUsers, type UsersQuery } from '@/platform/admin/admin-api';
import { CreateAccount } from '@/platform/admin/create-account';
import { UserBadges } from '@/platform/admin/user-badges';
import { describeError } from '@/platform/auth/describe-error';

type Role = NonNullable<UsersQuery['role']>;
type State = NonNullable<UsersQuery['state']>;

const ROLES: readonly Role[] = ['admin', 'user'];
const STATES: readonly State[] = ['active', 'disabled', 'all'];

/** Every account: find one by name or email, narrow by role or state. */
export function UsersPage() {
  const { t, i18n } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const [words, setWords] = useState('');
  const [role, setRole] = useState<Role | ''>('');
  const [state, setState] = useState<State>('active');
  const [page, setPage] = useState(1);
  const q = useDeferredValue(words.trim());
  const users = useUsers({ q: q || null, role: role || null, state, page });
  const [creating, setCreating] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => {
            setCreating(true);
          }}
        >
          {t('admin.create.open')}
        </Button>
      </div>
      {creating && (
        <CreateAccount
          onClose={() => {
            setCreating(false);
          }}
        />
      )}
      <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto]">
        <SearchField
          label={t('admin.users.search')}
          maxLength={FILTER_LIMITS.userSearch}
          value={words}
          onChange={(value) => {
            setWords(value);
            setPage(1);
          }}
        />
        <SelectField
          label={t('admin.users.role')}
          value={role}
          options={[
            { value: '', label: t('admin.users.anyRole') },
            ...ROLES.map((value) => ({ value, label: t(`admin.users.roles.${value}`) })),
          ]}
          onChange={(event) => {
            setRole(event.target.value as Role | '');
            setPage(1);
          }}
        />
        <SelectField
          label={t('admin.users.state')}
          value={state}
          options={STATES.map((value) => ({ value, label: t(`admin.users.states.${value}`) }))}
          onChange={(event) => {
            setState(event.target.value as State);
            setPage(1);
          }}
        />
      </div>
      {users.isPending && <Skeleton className="h-40" />}
      {users.isError && (
        <LoadError onRetry={() => void users.refetch()}>
          {describeError(users.error, t, tError)}
        </LoadError>
      )}
      {users.data && (
        <>
          <Table
            caption={t('admin.nav.users')}
            rows={users.data.items}
            rowKey={(user) => user.id}
            empty={t('admin.users.none')}
            columns={[
              {
                key: 'who',
                header: t('admin.users.account'),
                cell: (user) => (
                  <Link
                    to={user.id}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {user.name}
                    <span className="block text-xs font-normal text-muted">{user.email}</span>
                  </Link>
                ),
              },
              {
                key: 'badges',
                header: t('admin.users.status'),
                cell: (user) => <UserBadges user={user} />,
              },
              {
                key: 'seen',
                header: t('admin.users.lastSignIn'),
                cell: (user) =>
                  user.last_login_at
                    ? relativeTime(user.last_login_at, i18n.language)
                    : t('admin.users.never'),
              },
            ]}
          />
          <Pager page={page} hasNext={users.data.has_next} onPage={setPage} />
        </>
      )}
    </div>
  );
}
