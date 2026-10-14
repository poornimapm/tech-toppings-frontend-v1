import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { api, unwrap } from '@/core/api/client';
import type { components } from '@/core/api/schema';
import { userKeys } from '@/core/auth/queries';
import { useSession } from '@/core/auth/session-store';

type Schemas = components['schemas'];
export type AgentView = Schemas['AgentView'];
export type AgentRun = Schemas['RunOut'];
export type Proposal = Schemas['Proposal'];
export type ClientAction = Schemas['ClientAction'];
export type RunInput = Schemas['RunIn'];

/** Key of the router state that carries a client action to the module page it opens, so the
 *  page can act on its arguments: `useLocation().state?.[MODULE_ACTION]`. */
export const MODULE_ACTION = 'moduleAction';

export const agentKeys = {
  list: ['user', 'agents'] as const,
};

/** Agents and whether AI can run for this user right now (mode, reason, quota left). */
export function useAgents() {
  return useQuery({
    queryKey: agentKeys.list,
    queryFn: async () => (await unwrap(api.GET('/v1/agents'))).items,
  });
}

export function useAskAgent(agent: string) {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (body: RunInput) =>
      unwrap(api.POST('/v1/agents/{name}/runs', { params: { path: { name: agent } }, body })),
    // Quota and availability may have changed.
    onSettled: () => client.invalidateQueries({ queryKey: agentKeys.list }),
  });
}

/** Confirm (runs the change) or reject a proposal. A confirmed write may change any of the
 *  user's data, so everything under ['user'] is refreshed. */
export function useResolveProposal() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ id, confirm }: { id: string; confirm: boolean }) => {
      const options = { params: { path: { proposal_id: id } } };
      return unwrap(
        confirm
          ? api.POST('/v1/agents/proposals/{proposal_id}/confirm', options)
          : api.POST('/v1/agents/proposals/{proposal_id}/reject', options),
      );
    },
    onSuccess: (_proposal, { confirm }) =>
      confirm ? client.invalidateQueries({ queryKey: userKeys.all }) : undefined,
  });
}

/** Turn AI on for this account (the consent agents need), then refresh availability. */
export function useAiConsent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: () => unwrap(api.PATCH('/v1/me', { body: { ai_consent: true } })),
    onSuccess: async (user) => {
      useSession.getState().setUser(user);
      await client.invalidateQueries({ queryKey: agentKeys.list });
    },
  });
}
