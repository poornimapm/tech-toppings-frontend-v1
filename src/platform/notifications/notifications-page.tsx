import { Check, CheckCheck, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router';

import { useFeedText } from '@/core/modules/feed-text';
import { useModuleTiles } from '@/core/modules/queries';
import {
  useChangeNotifications,
  useNotifications,
  useUnreadCount,
} from '@/core/notifications/queries';
import { Button } from '@/design-system';
import { FeedPage } from '@/platform/feed/feed-page';
import { FeedRow } from '@/platform/feed/feed-row';
import { pages } from '@/platform/shell/pages';
import { moduleHref } from '@/platform/welcome/module-style';

/** Everything the app has told the user: read it, follow it to its module, or clear it. */
export function NotificationsPage() {
  const { t } = useTranslation();
  const notifications = useNotifications();
  const unread = useUnreadCount().data ?? 0;
  const change = useChangeNotifications();
  const feedText = useFeedText();
  const { tiles } = useModuleTiles();

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
    >
      {(item) => {
        const text = feedText(item.type, item.params);
        const tile = tiles.find((candidate) => candidate.view.key === item.params.module);
        const markRead = () => {
          if (!item.read) change.mutate({ read: item.id });
        };
        return (
          <FeedRow
            key={item.id}
            at={item.at}
            unread={!item.read}
            text={
              tile ? (
                // A notice about a module leads to it, and following it counts as reading it.
                <Link
                  to={moduleHref(tile)}
                  onClick={markRead}
                  className="underline-offset-4 hover:underline"
                >
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
