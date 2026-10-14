import { useTranslation } from 'react-i18next';

import type { AgentRun, Proposal } from '@/core/agents/queries';
import { textFor } from '@/core/modules/module-text';
import { useModuleRegistry } from '@/core/modules/registry';
import { fill } from '@/core/utils/fill';
import { withMoney } from '@/core/utils/money-params';

/** Message codes come from skills at runtime, so their keys can't be checked at compile time. */
type LooseT = (key: string, options?: Record<string, unknown>) => string;

/**
 * Words for what an agent run produced. Agent mode replies in sentences; static mode replies
 * with a code, worded by the module that owns the skill (its manifest's `strings.replies`) or,
 * for the shell's own skills, by `agentMessages.<code>`.
 */
export function useAgentText() {
  const { t, i18n } = useTranslation();
  const registry = useModuleRegistry();

  function coded(key: string, params: Record<string, unknown>): string {
    for (const definition of registry.all()) {
      const own = textFor(definition, i18n.language).replies?.[key];
      if (own) return fill(own, withMoney(params, i18n.language));
    }
    return (t as unknown as LooseT)(`agentMessages.${key}`, { ...params, defaultValue: '' });
  }

  return {
    runMessage(run: AgentRun): string {
      if (run.message) return run.message;
      return run.message_code ? coded(run.message_code, run.message_params) : '';
    },
    proposalText(proposal: Proposal): string {
      if (proposal.summary) return proposal.summary;
      const text = proposal.summary_code
        ? coded(proposal.summary_code, proposal.summary_params)
        : '';
      return text || proposal.tool;
    },
  };
}
