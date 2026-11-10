import { Lightbulb, Luggage, Plus } from 'lucide-react';
import { useId, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Button, EmptyState, Meter } from '@/design-system';
import { Checklist } from '@/modules/travel/checklist';
import {
  useChecklist,
  useWaitingTicks,
  type ChecklistItem,
  type ChecklistState,
} from '@/modules/travel/checklist-api';
import { NS } from '@/modules/travel/i18n';
import { ItemForm } from '@/modules/travel/item-form';
import { SuggestDialog } from '@/modules/travel/suggest-dialog';
import { useTripContext } from '@/modules/travel/trip-context';
import { Waiting } from '@/modules/travel/waiting';

/**
 * The packing list, bag by bag in the order the app offers them, each with how much of it is
 * packed (from what is really on it: an item no longer needed doesn't count) and quantities.
 * Suggestions from the trip's activities and length are previewed before any is added.
 */
export function PackingTab() {
  const { t } = useTranslation(NS);
  const { trip, options } = useTripContext();
  const checklist = useChecklist(trip.id);
  const waiting = useWaitingTicks(trip.id);
  // Open: the item being edited (id null for a new one), or the suggestions.
  const [editing, setEditing] = useState<{ id: string | null } | null>(null);
  const [suggesting, setSuggesting] = useState(false);

  const packing = (checklist.data ?? []).filter((item) => item.bag !== null);
  const editingItem = editing?.id ? (packing.find((item) => item.id === editing.id) ?? null) : null;
  // A tick still waiting on this device counts as made.
  const stateOf = (item: ChecklistItem) => waiting.get(item.id) ?? item.state;
  const bags = options.bags
    .map((bag) => ({ bag, items: packing.filter((item) => item.bag === bag) }))
    .filter(({ items }) => items.length > 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button
          className="min-h-11"
          onClick={() => {
            setSuggesting(true);
          }}
        >
          <Lightbulb aria-hidden="true" className="size-4" />
          {t('packing.suggest')}
        </Button>
        <Button
          variant="secondary"
          className="min-h-11"
          onClick={() => {
            setEditing({ id: null });
          }}
        >
          <Plus aria-hidden="true" className="size-4" />
          {t('checklist.add')}
        </Button>
      </div>
      {!checklist.data ? (
        <Waiting query={checklist} failed={t('packing.loadError')} />
      ) : packing.length === 0 ? (
        <EmptyState icon={Luggage} title={t('packing.empty')} body={t('packing.emptyBody')} />
      ) : (
        <>
          <Packed states={packing.map(stateOf)} label={t('packing.all')} />
          {bags.map(({ bag, items }) => (
            <Bag
              key={bag}
              title={t(`bags.${bag}`)}
              items={items}
              states={items.map(stateOf)}
              onEdit={(item) => {
                setEditing({ id: item.id });
              }}
            />
          ))}
        </>
      )}
      {editing && (editing.id === null || editingItem) && (
        <ItemForm
          key={`${editing.id ?? 'new'}-${String(editingItem?.revision_no ?? 0)}`}
          item={editingItem}
          packing
          day={null}
          onClose={() => {
            setEditing(null);
          }}
          onReload={() => void checklist.refetch()}
        />
      )}
      {suggesting && (
        <SuggestDialog
          asked={{ day: null, packing: true }}
          onClose={() => {
            setSuggesting(false);
          }}
        />
      )}
    </div>
  );
}

function Bag({
  title,
  items,
  states,
  onEdit,
}: {
  title: string;
  items: ChecklistItem[];
  states: ChecklistState[];
  onEdit: (item: ChecklistItem) => void;
}) {
  const headingId = useId();
  return (
    <section
      aria-labelledby={headingId}
      className="space-y-3 rounded-2xl border border-border bg-surface p-4"
    >
      <h3 id={headingId} className="text-base font-semibold">
        {title}
      </h3>
      <Packed states={states} label={title} />
      <Checklist items={items} label={title} onEdit={onEdit} />
    </section>
  );
}

/** How much is packed: completed of those still needed. */
function Packed({ states, label }: { states: ChecklistState[]; label: string }) {
  const { t } = useTranslation(NS);
  const needed = states.filter((state) => state !== 'not_applicable').length;
  const packed = states.filter((state) => state === 'completed').length;
  if (needed === 0) return <p className="text-sm text-muted">{t('packing.nothingNeeded')}</p>;
  const words = t('packing.packed', { packed, needed });
  return (
    <div className="space-y-1">
      <p className="text-sm">{words}</p>
      <Meter
        value={packed}
        max={needed}
        label={t('packing.meter', { bag: label })}
        valueText={words}
      />
    </div>
  );
}
