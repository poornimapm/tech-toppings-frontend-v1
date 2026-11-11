import { CloudOff, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { cx } from '@/core/utils/cx';
import { Badge, Button } from '@/design-system';
import {
  asSuggested,
  useRemoveItem,
  useTick,
  useWaitingTicks,
  type ChecklistItem,
  type ChecklistState,
} from '@/modules/travel/checklist-api';
import { NS } from '@/modules/travel/i18n';
import { useRemoval } from '@/modules/travel/removal';
import { StateControl } from '@/modules/travel/state-control';
import { useTripContext } from '@/modules/travel/trip-context';
import { useWords } from '@/modules/travel/words';

/**
 * Checklist or packing items, each with its four states. A tap saves at once, or waits on the
 * device with no network (and shows so); either way the new state is said aloud. An item can be
 * edited, or removed with a moment to take it back.
 */
export function Checklist({
  items,
  label,
  showBag = false,
  onEdit,
}: {
  items: ChecklistItem[];
  label: string;
  /** Say each item's bag (a day's list mixes them; a bag's own list doesn't). */
  showBag?: boolean;
  onEdit: (item: ChecklistItem) => void;
}) {
  const { t } = useTranslation(NS);
  const { trip } = useTripContext();
  const words = useWords();
  const tick = useTick(trip.id);
  const waiting = useWaitingTicks(trip.id);
  const remove = useRemoveItem();
  const removal = useRemoval(remove.mutateAsync);
  const [said, setSaid] = useState('');
  const nameOf = (item: ChecklistItem) =>
    words.item(item.title, item.suggestion_key, asSuggested(item));

  const onTick = (item: ChecklistItem, state: ChecklistState) => {
    const told = { title: nameOf(item), state: t(`checklist.states.${state}`) };
    tick.mutate(
      { item, state, label: `${told.title} · ${told.state}` },
      {
        onSuccess: (saved) => {
          setSaid(t(saved ? 'checklist.now' : 'checklist.nowWaiting', told));
        },
      },
    );
  };

  return (
    <>
      <ul role="list" aria-label={label} className="space-y-2">
        {items.map((item) => {
          const state = waiting.get(item.id) ?? item.state;
          const name = nameOf(item);
          const off = state === 'not_applicable';
          return (
            <li key={item.id} className="space-y-2 rounded-2xl border border-border bg-surface p-3">
              <div className="flex items-start gap-1">
                <div className="min-w-0 flex-1">
                  <p className={cx('font-medium break-words', off && 'text-muted line-through')}>
                    {name}
                    {item.quantity > 1 && (
                      <span className="font-normal text-muted">
                        {' '}
                        {t('checklist.quantity', { quantity: item.quantity })}
                      </span>
                    )}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {showBag && item.bag && <Badge>{t(`bags.${item.bag}`)}</Badge>}
                    {asSuggested(item) && <Badge tone="beta">{t('checklist.suggestion')}</Badge>}
                    {item.source === 'assistant' && (
                      <Badge tone="beta">{t('checklist.aiSuggestion')}</Badge>
                    )}
                    {waiting.has(item.id) && (
                      <Badge icon={<CloudOff aria-hidden="true" className="size-3" />}>
                        {t('checklist.waiting')}
                      </Badge>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  className="min-h-11 min-w-11"
                  aria-label={t('checklist.edit', { title: name })}
                  onClick={() => {
                    onEdit(item);
                  }}
                >
                  <Pencil aria-hidden="true" className="size-4" />
                </Button>
                <Button
                  variant="ghost"
                  className="min-h-11 min-w-11"
                  aria-label={t('checklist.remove', { title: name })}
                  onClick={() => void removal(item.id, t('checklist.removed', { title: name }))}
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
              <StateControl
                label={t('checklist.stateOf', { title: name })}
                value={state}
                disabled={tick.isPending && tick.variables.item.id === item.id}
                onChange={(next) => {
                  onTick(item, next);
                }}
              />
            </li>
          );
        })}
      </ul>
      <p role="status" className="sr-only">
        {said}
      </p>
    </>
  );
}
