import { Bot, Check, CircleAlert, Sparkles, X, Zap } from 'lucide-react';
import { m } from 'motion/react';
import { useTranslation } from 'react-i18next';

import { ApiError } from '@/core/api/api-error';
import { errorKey } from '@/core/i18n';
import {
  useAiConsent,
  useResolveProposal,
  type AgentRun,
  type Proposal,
} from '@/core/agents/queries';
import { Badge, Button, Skeleton } from '@/design-system';
import { proposalText, runMessage } from '@/platform/palette/agent-text';
import { useClientActions } from '@/platform/palette/client-actions';

function ProposalRow({ proposal }: { proposal: Proposal }) {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const resolve = useResolveProposal();
  const current = resolve.data ?? proposal;
  const failed = resolve.error instanceof ApiError ? resolve.error.code : current.error_code;
  const text = proposalText(t, proposal);

  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-bg/60 p-3">
      <Sparkles aria-hidden="true" className="size-4 shrink-0 text-primary" />
      <p className="min-w-0 flex-1 text-sm">{text}</p>
      {current.status === 'pending' && !failed ? (
        <div className="flex shrink-0 gap-1">
          <Button
            disabled={resolve.isPending}
            onClick={() => {
              resolve.mutate({ id: proposal.id, confirm: true });
            }}
          >
            <Check aria-hidden="true" className="size-4" />
            {t('agents.confirm')}
          </Button>
          <Button
            variant="ghost"
            aria-label={t('agents.rejectLabel', { change: text })}
            disabled={resolve.isPending}
            onClick={() => {
              resolve.mutate({ id: proposal.id, confirm: false });
            }}
          >
            <X aria-hidden="true" className="size-4" />
          </Button>
        </div>
      ) : (
        <Badge tone={failed ? 'locked' : current.status === 'confirmed' ? 'success' : 'neutral'}>
          {failed ? tError(errorKey(failed)) : t(`agents.status.${current.status}`)}
        </Badge>
      )}
    </li>
  );
}

export interface AssistantPanelProps {
  run: AgentRun | undefined;
  pending: boolean;
  error: unknown;
  onRetry: () => void;
  onClose: () => void;
}

/** The assistant's answer: its reply, proposed changes to confirm, and actions to open. */
export function AssistantPanel({ run, pending, error, onRetry, onClose }: AssistantPanelProps) {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const consent = useAiConsent();
  const clientAction = useClientActions();

  if (pending) {
    return (
      <div role="status" className="space-y-2 p-4">
        <p className="flex items-center gap-2 text-sm text-muted">
          <Bot aria-hidden="true" className="size-4 animate-pulse" />
          {t('agents.thinking')}
        </p>
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    );
  }
  if (error) {
    const code = error instanceof ApiError ? error.code : 'UNKNOWN';
    return (
      <div role="alert" className="space-y-3 p-4 text-sm">
        <p className="flex items-center gap-2 text-danger">
          <CircleAlert aria-hidden="true" className="size-4" />
          {tError(errorKey(code))}
        </p>
        <Button variant="secondary" onClick={onRetry}>
          {t('actions.retry')}
        </Button>
      </div>
    );
  }
  if (!run) return null;

  if (run.status === 'unavailable') {
    return (
      <div role="status" className="space-y-3 p-4 text-sm">
        <p className="font-medium">{t('agents.unavailable')}</p>
        {run.reason && <p className="text-muted">{t(`agents.reason.${run.reason}`)}</p>}
        {run.reason === 'consent' && (
          <div className="space-y-2 rounded-2xl border border-border bg-bg/60 p-3">
            <p className="text-muted">{t('agents.enableHint')}</p>
            <Button
              disabled={consent.isPending}
              onClick={() => {
                consent.mutate(undefined, { onSuccess: onRetry });
              }}
            >
              <Sparkles aria-hidden="true" className="size-4" />
              {t('agents.enable')}
            </Button>
          </div>
        )}
      </div>
    );
  }

  const actions = run.client_actions.map(clientAction).filter((action) => action !== null);
  const message = runMessage(t, run);
  return (
    <m.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      role="status"
      className="space-y-3 p-4"
    >
      <div className="flex flex-wrap items-center gap-2">
        {run.mode === 'agent' ? (
          <Badge tone="beta" icon={<Bot aria-hidden="true" className="size-3" />}>
            {t('agents.mode.agent')}
          </Badge>
        ) : (
          <Badge tone="soon" icon={<Zap aria-hidden="true" className="size-3" />}>
            {t('agents.mode.static')}
          </Badge>
        )}
        {run.mode === 'static' && run.reason && (
          <span className="text-xs text-muted">{t(`agents.reason.${run.reason}`)}</span>
        )}
      </div>
      {message && <p className="text-sm">{message}</p>}
      {run.status === 'incomplete' && (
        <p className="text-sm text-muted">{t('agents.incomplete')}</p>
      )}
      {run.proposals.length > 0 && (
        <ul className="space-y-2">
          {run.proposals.map((proposal) => (
            <ProposalRow key={proposal.id} proposal={proposal} />
          ))}
        </ul>
      )}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => (
            <Button
              key={action.label}
              variant="secondary"
              onClick={() => {
                action.run();
                onClose();
              }}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </m.div>
  );
}
