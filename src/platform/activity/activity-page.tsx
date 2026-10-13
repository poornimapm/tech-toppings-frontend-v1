import { useTranslation } from 'react-i18next';

import { useActivity } from '@/core/activity/queries';
import { useFeedText } from '@/core/modules/feed-text';
import { FeedPage } from '@/platform/feed/feed-page';
import { FeedRow } from '@/platform/feed/feed-row';
import { pages } from '@/platform/shell/pages';

/** The user's own record of what they changed, newest first. */
export function ActivityPage() {
  const { t } = useTranslation();
  const activity = useActivity();
  const feedText = useFeedText();

  return (
    <FeedPage
      title={t('nav.activity')}
      subtitle={t('activity.subtitle')}
      query={activity}
      empty={{
        icon: pages.activity.icon,
        title: t('activity.empty.title'),
        body: t('activity.empty.body'),
      }}
      errorText={t('activity.loadError')}
    >
      {(item) => <FeedRow key={item.id} at={item.at} text={feedText(item.type, item.params)} />}
    </FeedPage>
  );
}
