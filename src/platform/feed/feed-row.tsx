import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import { cx } from '@/core/utils/cx';
import { relativeTime } from '@/core/utils/relative-time';

export interface FeedRowProps {
  text: ReactNode;
  /** When it happened (ISO); shown as "5 minutes ago". */
  at?: string | null;
  unread?: boolean;
  /** Things to do about this entry (buttons). */
  children?: ReactNode;
}

/** One entry of a feed: what happened, how long ago, and anything to do about it. The time
 *  sits beside the text where the row is wide, and under it where it is not (a phone, a
 *  dashboard card, a long translation), judged by the row's own width. */
export function FeedRow({ text, at, unread = false, children }: FeedRowProps) {
  const { t, i18n } = useTranslation();
  return (
    <li className="@container flex items-center gap-3 py-2.5 text-sm">
      {/* Unread is said in words and weight as well as with the dot, never by colour alone. */}
      {unread && (
        <span className="size-2 shrink-0 rounded-full bg-primary">
          <span className="sr-only">{t('inbox.unreadMark')}</span>
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5 @md:flex-row @md:items-center @md:justify-between @md:gap-3">
        <span className={cx('min-w-0', unread && 'font-semibold')}>{text}</span>
        {at && (
          <time dateTime={at} className="shrink-0 text-xs text-muted">
            {relativeTime(at, i18n.language)}
          </time>
        )}
      </span>
      {children && <span className="flex shrink-0 items-center">{children}</span>}
    </li>
  );
}
