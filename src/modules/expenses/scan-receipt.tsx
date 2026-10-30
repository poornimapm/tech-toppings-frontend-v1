import { useTranslation } from 'react-i18next';

import type { AgentRun, ClientAction } from '@/core/agents/queries';
import { useSession } from '@/core/auth/session-store';
import { ScanPhoto } from '@/core/scan/scan-photo';
import { formatMoney, toMinor } from '@/core/utils/money';
import { NS } from '@/modules/expenses/i18n';

/** The skill that reads a receipt, from its photo (AI) or its text (rules, or AI). */
export const SCAN_SKILL = 'scan-receipt';

/**
 * Scan a receipt into drafts on the same card as anything said or typed (the shared scan:
 * core/scan).
 */
export function ScanReceipt({
  onRead,
}: {
  /** Takes the drafts the scan handed over, marked as one receipt. */
  onRead: (actions: ClientAction[], receipt: string) => void;
}) {
  const { t, i18n } = useTranslation(NS);
  const currency = useSession((state) => state.user?.base_currency) ?? '';

  const describe = (run: AgentRun) => {
    if (run.message_code !== 'scan-receipt.ready') return null;
    const { total: paid } = run.message_params;
    const total = typeof paid === 'number' ? toMinor(String(paid), currency) : null;
    return t(total ? 'capture.scan.readWithTotal' : 'capture.scan.read', {
      count: Number(run.message_params.count ?? 0),
      total: total ? formatMoney(total, currency, i18n.language) : '',
    });
  };

  return (
    <ScanPhoto
      skill={SCAN_SKILL}
      texts={{
        button: t('capture.scan.button'),
        pick: t('capture.scan.pick'),
        sending: t('capture.scan.sending'),
        reading: t('capture.scan.reading'),
        progress: t('capture.scan.progress'),
        unreadable: t('capture.scan.unreadable'),
      }}
      describe={describe}
      onRead={(run) => {
        onRead(run.client_actions, run.id);
      }}
    />
  );
}
