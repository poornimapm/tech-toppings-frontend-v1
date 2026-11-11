import { MessageSquareText, Sparkles } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/design-system';
import { ChangeAiDialog } from '@/modules/travel/change-ai';
import { NS } from '@/modules/travel/i18n';
import { ItemsAiDialog } from '@/modules/travel/items-ai';
import type { Activity } from '@/modules/travel/plan-api';

/** Basic AI's help with one planned activity: prepare for it, or say what changed about it. */
export type ActivityTask = 'activity' | 'change';

const TASKS = [
  { task: 'activity', key: 'items', icon: Sparkles },
  { task: 'change', key: 'change', icon: MessageSquareText },
] as const;

/** The buttons that ask for it. `named`: each says which activity, where a list of them doesn't. */
export function ActivityAiButtons({
  activity,
  named = false,
  onAsk,
}: {
  activity: Activity;
  named?: boolean;
  onAsk: (task: ActivityTask) => void;
}) {
  const { t } = useTranslation(NS);
  return (
    <>
      {TASKS.map(({ task, key, icon: Icon }) => (
        <Button
          key={task}
          variant="secondary"
          className="min-h-11"
          aria-label={named ? t(`ai.${key}.label`, { title: activity.title }) : undefined}
          onClick={() => {
            onAsk(task);
          }}
        >
          <Icon aria-hidden="true" className="size-4" />
          {t(`ai.${key}.button`)}
        </Button>
      ))}
    </>
  );
}

/** The dialog for the task asked. */
export function ActivityAiDialog({
  task,
  activity,
  onClose,
  onReload,
}: {
  task: ActivityTask;
  activity: Activity;
  onClose: () => void;
  /** The activity changed elsewhere: the latest is asked for. */
  onReload: () => void;
}) {
  return task === 'activity' ? (
    <ItemsAiDialog activity={activity} onClose={onClose} />
  ) : (
    <ChangeAiDialog activity={activity} onClose={onClose} onReload={onReload} />
  );
}
