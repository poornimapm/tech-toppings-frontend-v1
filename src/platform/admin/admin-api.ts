import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components, operations } from '@/core/api/schema';
import { userKeys } from '@/core/auth/queries';
import { moduleKeys } from '@/core/modules/queries';

type Schemas = components['schemas'];
export type AdminUser = Schemas['AdminUserOut'];
export type AdminUserDetail = Schemas['AdminUserDetail'];
export type AllowedEmail = Schemas['AllowedOut'];
export type AdminModule = Schemas['AdminModuleOut'];
export type AuditItem = Schemas['AuditOut'];
export type DbStats = Schemas['DbOut'];
export type UsersQuery = NonNullable<
  operations['list_users_v1_admin_users_get']['parameters']['query']
>;
export type AuditQuery = NonNullable<
  operations['list_audit_logs_v1_admin_audit_logs_get']['parameters']['query']
>;

/** What an admin reads is the signed-in user's data too (['user', 'admin', ...]): it goes
 *  with everything else when the account changes or signs out. */
const ADMIN = [...userKeys.all, 'admin'] as const;

/** The server's longest search words (users) and action filter (audit log). */
export const FILTER_LIMITS = { userSearch: 80, auditAction: 64 } as const;

export const adminKeys = {
  usage: (from: string, to: string) => [...ADMIN, 'usage', from, to] as const,
  db: [...ADMIN, 'db'] as const,
  users: [...ADMIN, 'users'] as const,
  usersPage: (query: UsersQuery) => [...ADMIN, 'users', 'list', query] as const,
  user: (id: string) => [...ADMIN, 'users', id] as const,
  allowlist: [...ADMIN, 'allowlist'] as const,
  modules: [...ADMIN, 'modules'] as const,
  audits: [...ADMIN, 'audit'] as const,
  audit: (query: AuditQuery) => [...ADMIN, 'audit', query] as const,
};

export function useUsage(from: string, to: string) {
  return useQuery({
    queryKey: adminKeys.usage(from, to),
    queryFn: () =>
      unwrap(api.GET('/v1/admin/analytics/usage', { params: { query: { from, to } } })),
    placeholderData: keepPreviousData,
  });
}

export function useDbStats() {
  return useQuery({
    queryKey: adminKeys.db,
    queryFn: () => unwrap(api.GET('/v1/admin/analytics/db')),
  });
}

export function useUsers(query: UsersQuery) {
  return useQuery({
    queryKey: adminKeys.usersPage(query),
    queryFn: () => unwrap(api.GET('/v1/admin/users', { params: { query } })),
    placeholderData: keepPreviousData,
  });
}

export function useAdminUser(id: string) {
  return useQuery({
    queryKey: adminKeys.user(id),
    queryFn: () =>
      unwrap(api.GET('/v1/admin/users/{user_id}', { params: { path: { user_id: id } } })),
  });
}

/** What an admin can do to someone else's account; each refreshes the users and the trail. */
export function useUserActions(id: string) {
  const queryClient = useQueryClient();
  const path = { params: { path: { user_id: id } } };
  const settled = async () => {
    await queryClient.invalidateQueries({ queryKey: adminKeys.users });
    await queryClient.invalidateQueries({ queryKey: adminKeys.audits });
  };
  return {
    change: useMutation({
      mutationFn: (body: Schemas['AdminUserPatch']) =>
        unwrap(api.PATCH('/v1/admin/users/{user_id}', { ...path, body })),
      onSettled: settled,
    }),
    revokeSessions: useMutation({
      mutationFn: () => unwrap(api.POST('/v1/admin/users/{user_id}/revoke-sessions', path)),
      onSettled: settled,
    }),
    resetPassword: useMutation({
      mutationFn: () => unwrap(api.POST('/v1/admin/users/{user_id}/reset-password', path)),
      onSettled: settled,
    }),
  };
}

export function useAllowlist() {
  return useQuery({
    queryKey: adminKeys.allowlist,
    queryFn: () => unwrap(api.GET('/v1/admin/allowed-emails')),
  });
}

/** Adding and removing: each refreshes the list and the trail. */
export function useAllowlistActions() {
  const queryClient = useQueryClient();
  const settled = async () => {
    await queryClient.invalidateQueries({ queryKey: adminKeys.allowlist });
    await queryClient.invalidateQueries({ queryKey: adminKeys.audits });
  };
  return {
    add: useMutation({
      mutationFn: (body: Schemas['AllowedIn']) =>
        unwrap(api.POST('/v1/admin/allowed-emails', { body })),
      onSettled: settled,
    }),
    remove: useMutation({
      mutationFn: (email: string) =>
        unwrap(api.DELETE('/v1/admin/allowed-emails/{email}', { params: { path: { email } } })),
      onSettled: settled,
    }),
  };
}

export function useAdminModules() {
  return useQuery({
    queryKey: adminKeys.modules,
    queryFn: () => unwrap(api.GET('/v1/admin/modules')),
  });
}

/** Change a module for everyone; `null` puts a field back to what the module ships with. */
export function useChangeModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, ...body }: { key: string } & Schemas['AdminModulePatch']) =>
      unwrap(api.PATCH('/v1/admin/modules/{key}', { params: { path: { key } }, body })),
    onSettled: async () => {
      await queryClient.invalidateQueries({ queryKey: adminKeys.modules });
      await queryClient.invalidateQueries({ queryKey: moduleKeys.list });
      await queryClient.invalidateQueries({ queryKey: adminKeys.audits });
    },
  });
}

export function useAuditLog(query: AuditQuery) {
  return useQuery({
    queryKey: adminKeys.audit(query),
    queryFn: () => unwrap(api.GET('/v1/admin/audit-logs', { params: { query } })),
    placeholderData: keepPreviousData,
  });
}
