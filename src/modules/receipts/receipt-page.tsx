import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useLocation, useNavigate, useParams } from 'react-router';

import { MODULE_ACTION, type ClientAction } from '@/core/agents/queries';
import { LoadError, Skeleton } from '@/design-system';
import { useReceipt, useReceiptOptions } from '@/modules/receipts/api';
import { draftOf, type BillDraft } from '@/modules/receipts/bill-draft';
import { NS } from '@/modules/receipts/i18n';
import { ReceiptForm } from '@/modules/receipts/receipt-form';

interface Taken {
  action: ClientAction;
  draft: BillDraft | null;
  /** How many have been taken: each starts the form afresh. */
  count: number;
}

/** A receipt to keep (`new`, maybe filled in from a bill the assistant read) or one kept
 *  (`:id`), in one form. */
export function ReceiptPage() {
  const { t } = useTranslation(NS);
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const receipt = useReceipt(id);
  const options = useReceiptOptions();
  const [taken, setTaken] = useState<Taken | null>(null);

  const handed = (location.state as { [MODULE_ACTION]?: ClientAction } | null)?.[MODULE_ACTION];
  if (handed && handed !== taken?.action) {
    // Taken once, in this render: the effect below then clears it from the history entry.
    setTaken({ action: handed, draft: draftOf(handed.arguments), count: (taken?.count ?? 0) + 1 });
  }
  const { pathname, search, hash } = location;
  useEffect(() => {
    // The bill is in the form now: the history entry forgets it, or a reload or Back would
    // fill a form with it again.
    if (handed) void navigate({ pathname, search, hash }, { replace: true, state: null });
  }, [handed, hash, navigate, pathname, search]);

  const loading = options.isPending || (id !== undefined && receipt.isPending);
  // Only a first load that failed: a background refetch that fails (a network blip, the receipt
  // just deleted) leaves the form and what was typed in it.
  const failed =
    (options.isError && !options.data) || (id !== undefined && receipt.isError && !receipt.data);
  return (
    <div className="mx-auto max-w-xl space-y-5">
      <Link
        to=".."
        relative="path"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-primary underline-offset-4 hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        {t('form.back')}
      </Link>
      <h1 className="text-3xl font-bold tracking-tight">
        {id ? t('form.editTitle') : t('form.newTitle')}
      </h1>
      {failed ? (
        <LoadError
          onRetry={() => {
            void options.refetch();
            if (id) void receipt.refetch();
          }}
        >
          {t('form.loadError')}
        </LoadError>
      ) : loading ? (
        <Skeleton className="h-96 rounded-3xl" />
      ) : (
        <ReceiptForm
          key={`${receipt.data?.id ?? 'new'}-${String(taken?.count ?? 0)}`}
          receipt={receipt.data ?? null}
          draft={id ? null : (taken?.draft ?? null)}
          options={options.data}
        />
      )}
    </div>
  );
}
