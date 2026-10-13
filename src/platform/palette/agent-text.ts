import type { TFunction } from 'i18next';

import type { AgentRun, Proposal } from '@/core/agents/queries';

/** Message codes come from skills at runtime, so their keys can't be checked at compile time. */
type LooseT = (key: string, options?: Record<string, unknown>) => string;

function code(t: TFunction, key: string, params: Record<string, unknown>): string {
  return (t as unknown as LooseT)(`agentMessages.${key}`, { ...params, defaultValue: '' });
}

/** Agent mode replies in words; static mode replies with a code the client translates. */
export function runMessage(t: TFunction, run: AgentRun): string {
  if (run.message) return run.message;
  return run.message_code ? code(t, run.message_code, run.message_params) : '';
}

export function proposalText(t: TFunction, proposal: Proposal): string {
  if (proposal.summary) return proposal.summary;
  const text = proposal.summary_code ? code(t, proposal.summary_code, proposal.summary_params) : '';
  return text || proposal.tool;
}
