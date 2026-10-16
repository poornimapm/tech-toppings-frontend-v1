import { Check, CheckCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useFeedText } from '@/core/modules/feed-text';
import {
  useChangeNotifications,
  useNotifications,
  useUnreadCount,
} from '@/core/notifications/queries';
import { Button } from '@/design-system';
import { FeedPage } from '@/platform/feed/feed-page';
import { FeedRow } from '@/platform/feed/feed-row';
import { useNoticeHref } from '@/platform/notifications/notice-href';
import { RemindersPanel } from '@/platform/notifications/reminders-panel';
import { pages } from '@/platform/shell/pages';

/** Everything the app has told the user: read it, follow it to its module, or clear it. What
 *  it will remind them of comes first. */
export function NotificationsPage() {
  const { t } = useTranslation();
  const notifications = useNotifications();
  const unread = useUnreadCount().data ?? 0;
  const change = useChangeNotifications();
  const feedText = useFeedText();
  const hrefOf = useNoticeHref();

  return (
    <FeedPage
      title={t('nav.notifications')}
      subtitle={unread > 0 ? t('inbox.unread', { count: unread }) : t('inbox.caughtUp')}
      query={notifications}
      empty={{
        icon: pages.notifications.icon,
        title: t('inbox.empty.title'),
        body: t('inbox.empty.body'),
      }}
      errorText={t('inbox.loadError')}
      action={
        unread > 0 && (
          <Button
            variant="secondary"
            disabled={change.isPending}
            onClick={() => {
              change.mutate({ readAll: true });
            }}
          >
            <CheckCheck aria-hidden="true" className="size-4" />
            {t('inbox.markAllRead')}
          </Button>
        )
      }
      lead={<RemindersPanel />}
    >
      {(item) => {
        const text = feedText(item.type, item.params);
        const href = hrefOf(item.type, item.params);
        const markRead = () => {
          if (!item.read) change.mutate({ read: item.id });
        };
        return (
          <FeedRow
            key={item.id}
            at={item.at}
            unread={!item.read}
            text={
              href ? (
                // A notice about a module leads to it, and following it counts as reading it.
                <Link to={href} onClick={markRead} className="underline-offset-4 hover:underline">
                  {text}
                </Link>
              ) : (
                text
              )
            }
          >
            {!item.read && (
              <Button variant="ghost" aria-label={t('inbox.markRead', { text })} onClick={markRead}>
                <Check aria-hidden="true" className="size-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              aria-label={t('inbox.remove', { text })}
              onClick={() => {
                change.mutate({ remove: item.id });
              }}
            >
              <X aria-hidden="true" className="size-4" />
            </Button>
          </FeedRow>
        );
      }}
    </FeedPage>
  );
}
