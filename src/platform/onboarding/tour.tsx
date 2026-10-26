import { Bell, Command, House, Mic, SlidersHorizontal, type LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, Dialog } from '@/design-system';

/** Each step: what it is about, in the user's language (`tour.<key>.title|body`). */
const STEPS = [
  { key: 'home', icon: House },
  { key: 'palette', icon: Command },
  { key: 'voice', icon: Mic },
  { key: 'reminders', icon: Bell },
  { key: 'yours', icon: SlidersHorizontal },
] as const satisfies readonly { key: string; icon: LucideIcon }[];

/** A short first look round the app, one idea per step; skipping is always one press away. */
export function Tour({ onDone }: { onDone: () => void }) {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const step = STEPS[index] ?? STEPS[0];
  const Icon = step.icon;
  const last = index === STEPS.length - 1;

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onDone();
      }}
      header={
        <span className="grid size-12 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon aria-hidden="true" className="size-6" />
        </span>
      }
      title={t(`tour.${step.key}.title`)}
      description={t(`tour.${step.key}.body`)}
    >
      <div className="mt-6 flex flex-wrap items-center gap-2">
        <p className="mr-auto text-sm text-muted">
          {t('tour.progress', { step: index + 1, count: STEPS.length })}
        </p>
        {!last && (
          <Button variant="ghost" onClick={onDone}>
            {t('tour.skip')}
          </Button>
        )}
        {index > 0 && (
          <Button
            variant="secondary"
            onClick={() => {
              setIndex(index - 1);
            }}
          >
            {t('tour.back')}
          </Button>
        )}
        <Button
          onClick={() => {
            if (last) onDone();
            else setIndex(index + 1);
          }}
        >
          {last ? t('tour.done') : t('tour.next')}
        </Button>
      </div>
    </Dialog>
  );
}
