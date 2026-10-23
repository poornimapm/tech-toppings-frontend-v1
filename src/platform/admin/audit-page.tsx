import { useDeferredValue, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSearchParams } from 'react-router';

import { Button, LoadError, Pager, SelectField, Skeleton, Table, TextField } from '@/design-system';
import { FILTER_LIMITS, useAuditLog, type AuditItem } from '@/platform/admin/admin-api';
import { describeError } from '@/platform/auth/describe-error';

const ENTITIES = ['user', 'allowed_email', 'module'] as const;

/** `key: value` pairs of an entry's facts, one line each (nested facts as JSON). */
function Facts({ details }: { details: AuditItem['details'] }) {
  const entries = Object.entries(details);
  if (entries.length === 0) return null;
  return (
    <ul className="space-y-0.5 font-mono text-xs">
      {entries.map(([key, value]) => (
        <li key={key}>
          {key}: {typeof value === 'string' ? value : JSON.stringify(value)}
        </li>
      ))}
    </ul>
  );
}

/**
 * Who changed what, and when: role changes, disabling, resets, allowlist and module edits,
 * two-step sign-in, exports and deletions. Opened from an account, it shows that account's.
 * Times and the day filter are UTC, as the server counts days.
 */
export function AuditPage() {
  const { t, i18n } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const [params, setParams] = useSearchParams();
  const ownerId = params.get('owner_id');
  const [action, setAction] = useState('');
  const [entity, setEntity] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  // The page belongs to one account's trail: back or forward to another starts at page 1.
  const [paging, setPaging] = useState({ ownerId, page: 1 });
  const page = paging.ownerId === ownerId ? paging.page : 1;
  const setPage = (next: number) => {
    setPaging({ ownerId, page: next });
  };
  const deferredAction = useDeferredValue(action.trim());
  const log = useAuditLog({
    action: deferredAction || null,
    entity: entity || null,
    owner_id: ownerId,
    from: from || null,
    to: to || null,
    page,
  });
  const when = new Intl.DateTimeFormat(i18n.language, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'UTC',
  });
  const filtered =
    <T,>(set: (value: T) => void) =>
    (value: T) => {
      set(value);
      setPage(1);
    };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <TextField
          label={t('admin.audit.action')}
          placeholder="user.role_changed"
          maxLength={FILTER_LIMITS.auditAction}
          value={action}
          onChange={(event) => {
            filtered(setAction)(event.target.value);
          }}
        />
        <SelectField
          label={t('admin.audit.entity')}
          value={entity}
          options={[
            { value: '', label: t('admin.audit.anyEntity') },
            ...ENTITIES.map((value) => ({ value, label: t(`admin.audit.entities.${value}`) })),
          ]}
          onChange={(event) => {
            filtered(setEntity)(event.target.value);
          }}
        />
        <TextField
          label={t('admin.audit.from')}
          type="date"
          value={from}
          onChange={(event) => {
            filtered(setFrom)(event.target.value);
          }}
        />
        <TextField
          label={t('admin.audit.to')}
          type="date"
          value={to}
          onChange={(event) => {
            filtered(setTo)(event.target.value);
          }}
        />
      </div>
      {ownerId && (
        <p className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {t('admin.audit.forOne')}
          <Button
            variant="ghost"
            onClick={() => {
              setParams({});
            }}
          >
            {t('admin.audit.everyone')}
          </Button>
        </p>
      )}
      {log.isPending && <Skeleton className="h-40" />}
      {log.isError && (
        <LoadError onRetry={() => void log.refetch()}>
          {describeError(log.error, t, tError)}
        </LoadError>
      )}
      {log.data && (
        <>
          <Table
            caption={t('admin.nav.audit')}
            rows={log.data.items}
            rowKey={(item) => item.id}
            empty={t('admin.audit.none')}
            columns={[
              {
                key: 'at',
                header: t('admin.audit.when'),
                cell: (item) => when.format(new Date(item.at)),
              },
              {
                key: 'action',
                header: t('admin.audit.action'),
                cell: (item) => <code>{item.action}</code>,
              },
              {
                key: 'actor',
                header: t('admin.audit.who'),
                cell: (item) => item.actor_email ?? item.actor_id ?? t('admin.audit.system'),
              },
              {
                key: 'owner',
                header: t('admin.audit.whose'),
                cell: (item) => item.owner_email ?? item.owner_id ?? '',
              },
              {
                key: 'details',
                header: t('admin.audit.details'),
                cell: (item) => <Facts details={item.details} />,
              },
              { key: 'ip', header: t('admin.audit.ip'), cell: (item) => item.ip ?? '' },
            ]}
          />
          <Pager page={page} hasNext={log.data.has_next} onPage={setPage} />
        </>
      )}
    </div>
  );
}
