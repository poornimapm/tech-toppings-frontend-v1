import { X } from 'lucide-react';
import { useId } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import type { components } from '@/core/api/schema';
import { useSession } from '@/core/auth/session-store';
import { useFeedText } from '@/core/modules/feed-text';
import { useChangeReminder, useReminders } from '@/core/reminders/queries';
import { todayIn } from '@/core/utils/dates';
import { relativeDay } from '@/core/utils/relative-time';
import { Button, LoadError, toast } from '@/design-system';
import { useNoticeHref } from '@/platform/notifications/notice-href';

type Reminder = components['schemas']['ReminderOut'];

/** How long a reminder can be put off from here, in days. */
const SNOOZES = [
  { key: 'tomorrow', days: 1 },
  { key: 'threeDays', days: 3 },
  { key: 'nextWeek', days: 7 },
] as const;

/** "Coming up": what the user will be, or has just been, reminded of, soonest due first. Each
 *  can be put off for a few days or dismissed. Out of the way while there is nothing to show. */
export function RemindersPanel() {
  const { t } = useTranslation();
  const reminders = useReminders();
  const headingId = useId();

  if (reminders.isPending || (reminders.isSuccess && reminders.data.length === 0)) return null;
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-3xl border border-border bg-glass px-5 py-4 shadow-sm backdrop-blur-xl"
    >
      <h2 id={headingId} tabIndex={-1} className="text-base font-semibold">
        {t('reminders.title')}
      </h2>
      {reminders.isError ? (
        <div className="mt-3">
          <LoadError onRetry={() => void reminders.refetch()}>{t('reminders.loadError')}</LoadError>
        </div>
      ) : (
        <>
          <ul role="list" className="divide-y divide-border">
            {reminders.data.map((item) => (
              <ReminderRow key={item.id} item={item} />
            ))}
          </ul>
          {reminders.hasNextPage && (
            <Button
              variant="secondary"
              disabled={reminders.isFetchingNextPage}
              onClick={() => void reminders.fetchNextPage()}
            >
              {t('actions.showMore')}
            </Button>
          )}
        </>
      )}
    </section>
  );
}

/** Where keyboard focus goes once a dismissed reminder has left: the next one, else the one
 *  before, else the panel's heading. Found before it leaves, while its neighbours are known. */
function focusAfterDismiss(row: Element | null): HTMLElement | null {
  const neighbour = row?.nextElementSibling ?? row?.previousElementSibling;
  return (
    neighbour?.querySelector<HTMLElement>('a, button') ??
    row?.closest('section')?.querySelector<HTMLElement>('h2') ??
    null
  );
}

/** One reminder: its text (leading to its record), when it is due, and what to do about it. */
function ReminderRow({ item }: { item: Reminder }) {
  const { t, i18n } = useTranslation();
  const feedText = useFeedText();
  const hrefOf = useNoticeHref();
  const change = useChangeReminder();
  const timeZone = useSession((state) => state.user?.timezone);
  const today = todayIn(timeZone);
  const when = (day: string) => relativeDay(day, today, i18n.language);
  const dayOf = (at: string) => todayIn(timeZone, new Date(at));
  const text = feedText(item.type, item.params);
  const href = hrefOf(item.type, item.params);
  const failed = () => toast(t('reminders.failed'), { tone: 'danger' });
  // The day it will be told; left unsaid once past (a catch-up has yet to tell it), where
  // "we'll remind you yesterday" would be wrong.
  const next = item.sent ? null : dayOf(item.remind_at);

  const snooze = (days: number) => {
    if (change.isPending) return;
    change.mutate(
      { snooze: { id: item.id, days } },
      {
        onSuccess: (saved) => {
          if (!saved) return; // a snooze always answers with the reminder
          toast(t('reminders.next', { when: when(dayOf(saved.remind_at)) }), { tone: 'success' });
        },
        onError: failed,
      },
    );
  };

  // Not mutate()'s callbacks: they never run, as this row has left by then (the list refetches
  // first). The promise settles all the same.
  const dismiss = (button: HTMLElement) => {
    if (change.isPending) return;
    const focusNext = focusAfterDismiss(button.closest('li'));
    void change.mutateAsync({ dismiss: item.id }).then(() => focusNext?.focus(), failed);
  };

  return (
    <li className="space-y-2 py-3 text-sm">
      <p className="font-medium">
        {href ? (
          <Link to={href} className="underline-offset-4 hover:underline">
            {text}
          </Link>
        ) : (
          text
        )}
      </p>
      <p className="text-xs text-muted">
        {t(item.due_on < today ? 'reminders.overdue' : 'reminders.due', {
          when: when(item.due_on),
        })}
        {next && next >= today && ` · ${t('reminders.next', { when: when(next) })}`}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <span aria-hidden="true" className="text-xs text-muted">
          {t('reminders.remindMe')}
        </span>
        {SNOOZES.map(({ key, days }) => (
          <Button
            key={key}
            variant="secondary"
            className="text-xs"
            aria-label={t(`reminders.snoozeLabel.${key}`, { text })}
            aria-disabled={change.isPending || undefined}
            onClick={() => {
              snooze(days);
            }}
          >
            {t(`reminders.snooze.${key}`)}
          </Button>
        ))}
        <Button
          variant="ghost"
          className="ml-auto text-xs"
          aria-label={t('reminders.dismiss', { text })}
          aria-disabled={change.isPending || undefined}
          onClick={(event) => {
            dismiss(event.currentTarget);
          }}
        >
          <X aria-hidden="true" className="size-4" />
          {t('actions.dismiss')}
        </Button>
      </div>
    </li>
  );
}
