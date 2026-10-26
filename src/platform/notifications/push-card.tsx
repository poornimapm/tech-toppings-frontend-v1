import { BellRing } from 'lucide-react';
import { useEffect, useRef, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { PushDeniedError, PushNoWorkerError } from '@/core/push/browser';
import { useBrowserPush, usePushActions, usePushServer } from '@/core/push/queries';
import { cx } from '@/core/utils/cx';
import { Alert, Button, toast } from '@/design-system';
import { describeError } from '@/platform/auth/describe-error';

/**
 * Reminders on this device even with the app closed (Web Push, ADR-0018), for this browser
 * only: each device is turned on by the person holding it. Nothing shows where the server has
 * no keys for it. The state line is a live region, buttons keep focus while busy, and once on or
 * off focus moves to what comes next: a keyboard or screen reader user always hears the change.
 */
export function PushCard() {
  const { t } = useTranslation();
  const { t: tError } = useTranslation('errors');
  const server = usePushServer().data;
  const publicKey = server?.available ? server.public_key : null;
  const browser = useBrowserPush(publicKey).data;
  const { enable, disable, test } = usePushActions();
  const card = useRef<HTMLElement>(null);
  const row = useRef<HTMLDivElement>(null);
  const refocus = useRef(false);

  useEffect(() => {
    if (!refocus.current) return;
    refocus.current = false;
    const focused = document.activeElement;
    if (focused && focused !== document.body && !card.current?.contains(focused)) return; // moved on
    const next = row.current?.querySelector('button') ?? row.current?.querySelector('p');
    next?.focus();
  });

  if (!publicKey || !browser) return null;

  const toggling = enable.isPending || disable.isPending;
  /** A test also waits while it is turning on or off: the toggle settles first. */
  const testBusy = test.isPending || toggling;
  /** Earlier outcomes give way to a new action. One still running is kept: a reset would drop
   *  its toast or the focus move that follows it. */
  const begin = () => {
    [enable, disable, test].forEach((action) => {
      if (!action.isPending) action.reset();
    });
  };
  const settled = {
    onSettled: () => {
      refocus.current = true;
    },
  };
  const failure = enable.error ?? disable.error ?? test.error;
  const shownAsState = failure instanceof PushDeniedError || failure instanceof PushNoWorkerError;

  let state: string;
  let controls: ReactNode = null;
  if (!browser.supported) state = t('push.unsupported');
  else if (browser.permission === 'denied') state = t('push.blocked');
  else if (browser.subscribed) {
    state = t('push.on');
    controls = (
      <>
        <Button
          key="test"
          variant="secondary"
          aria-disabled={testBusy || undefined}
          onClick={() => {
            if (testBusy) return;
            begin();
            test.mutate(undefined, {
              onSuccess: ({ sent }) => {
                toast(t('push.testSent', { count: sent }), { tone: sent ? 'success' : 'danger' });
              },
            });
          }}
        >
          {t('push.test')}
        </Button>
        <Button
          key="off"
          variant="ghost"
          aria-disabled={toggling || undefined}
          onClick={() => {
            if (toggling) return;
            begin();
            disable.mutate(undefined, settled);
          }}
        >
          {t('push.turnOff')}
        </Button>
      </>
    );
  } else {
    if (enable.error instanceof PushNoWorkerError) state = t('push.noWorker');
    else if (enable.data === false) state = t('push.dismissed');
    else state = `${t('push.off')} ${t('push.explain')}`;
    controls = (
      <Button
        key="on"
        aria-disabled={toggling || undefined}
        onClick={() => {
          if (toggling) return;
          begin();
          enable.mutate(publicKey, settled);
        }}
      >
        {t('push.turnOn')}
      </Button>
    );
  }

  return (
    <section
      ref={card}
      aria-labelledby="push-title"
      className="rounded-3xl border border-border bg-glass p-4 shadow-sm backdrop-blur-xl"
    >
      <h2 id="push-title" className="mb-2 flex items-center gap-2 font-semibold">
        <BellRing aria-hidden="true" className="size-4" />
        {t('push.title')}
      </h2>
      {/* Mounted empty, so a failure put in later is announced. */}
      <Alert tone="danger" className="mb-2">
        {failure && !shownAsState ? describeError(failure, t, tError) : null}
      </Alert>
      <div ref={row} className="flex flex-wrap items-center gap-2">
        <p
          role="status"
          tabIndex={-1}
          className={cx('mr-auto text-sm focus:outline-none', !browser.subscribed && 'text-muted')}
        >
          {state}
        </p>
        {controls}
      </div>
    </section>
  );
}
