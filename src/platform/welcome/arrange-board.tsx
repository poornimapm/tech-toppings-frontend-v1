import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type Announcements,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  rectSortingStrategy,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import type { ModuleTile } from '@/core/modules/types';
import { cx } from '@/core/utils/cx';
import { accentStyle } from '@/platform/welcome/module-style';
import { ModuleIcon, ModuleStatusBadge } from '@/platform/welcome/module-visuals';

interface SortableTileProps {
  tile: ModuleTile;
  index: number;
  count: number;
  onMove: (index: number, offset: -1 | 1) => void;
  onToggleVisible: (tile: ModuleTile) => void;
}

const iconButton =
  'grid size-9 place-items-center rounded-full text-muted transition-colors hover:bg-bg hover:text-text disabled:opacity-30 disabled:hover:bg-transparent';

function SortableTile({ tile, index, count, onMove, onToggleVisible }: SortableTileProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: tile.view.key,
  });
  const name = tile.text.name;
  const hidden = !tile.view.enabled;

  return (
    // The sortable item moves (transform); the card inside wiggles, so the two never fight.
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cx('relative', isDragging && 'z-20')}
    >
      <div
        style={{ ...accentStyle(tile), animationDelay: `${-index * 90}ms` }}
        className={cx(
          'flex items-center gap-3 rounded-2xl border bg-glass p-3 backdrop-blur-xl',
          isDragging
            ? 'scale-[1.03] border-primary shadow-2xl shadow-primary/20'
            : 'border-border shadow-sm motion-safe:animate-wiggle',
          hidden && 'opacity-60',
        )}
      >
        <button
          type="button"
          className={cx(iconButton, 'cursor-grab touch-none active:cursor-grabbing')}
          {...attributes}
          {...listeners}
          aria-label={t('welcome.dragHandle', { name })}
        >
          <GripVertical aria-hidden="true" className="size-5" />
        </button>
        <ModuleIcon tile={tile} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{name}</p>
          <ModuleStatusBadge tile={tile} />
        </div>
        <div className="flex items-center">
          <button
            type="button"
            className={iconButton}
            aria-label={t('welcome.moveEarlier', { name })}
            disabled={index === 0}
            onClick={() => {
              onMove(index, -1);
            }}
          >
            <ChevronLeft aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label={t('welcome.moveLater', { name })}
            disabled={index === count - 1}
            onClick={() => {
              onMove(index, 1);
            }}
          >
            <ChevronRight aria-hidden="true" className="size-5" />
          </button>
          <button
            type="button"
            className={iconButton}
            aria-label={t(hidden ? 'welcome.show' : 'welcome.hide', { name })}
            onClick={() => {
              onToggleVisible(tile);
            }}
          >
            {hidden ? (
              <EyeOff aria-hidden="true" className="size-5" />
            ) : (
              <Eye aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>
    </li>
  );
}

export interface ArrangeBoardProps {
  tiles: ModuleTile[];
  onArrange: (keys: string[]) => void;
  onToggleVisible: (tile: ModuleTile) => void;
}

/** "Customize" mode: drag (pointer, touch or keyboard) or use the arrow buttons to reorder. */
export function ArrangeBoard({ tiles, onArrange, onToggleVisible }: ArrangeBoardProps) {
  const { t } = useTranslation();
  const keys = tiles.map((tile) => tile.view.key);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const nameOf = (id: UniqueIdentifier) =>
    tiles.find((tile) => tile.view.key === id)?.text.name ?? String(id);
  const positionOf = (id: UniqueIdentifier | undefined) =>
    id === undefined ? 0 : keys.indexOf(String(id)) + 1;
  const announcements: Announcements = {
    onDragStart: ({ active }) => t('welcome.dnd.picked', { name: nameOf(active.id) }),
    onDragOver: ({ active, over }) =>
      t('welcome.dnd.over', { name: nameOf(active.id), position: positionOf(over?.id) }),
    onDragEnd: ({ active, over }) =>
      t('welcome.dnd.dropped', { name: nameOf(active.id), position: positionOf(over?.id) }),
    onDragCancel: ({ active }) => t('welcome.dnd.cancelled', { name: nameOf(active.id) }),
  };

  function onDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id) return;
    onArrange(arrayMove(keys, keys.indexOf(String(active.id)), keys.indexOf(String(over.id))));
  }

  function onMove(index: number, offset: -1 | 1) {
    onArrange(arrayMove(keys, index, index + offset));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        announcements,
        screenReaderInstructions: { draggable: t('welcome.dnd.instructions') },
      }}
    >
      <SortableContext items={keys} strategy={rectSortingStrategy}>
        <ul role="list" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {tiles.map((tile, index) => (
            <SortableTile
              key={tile.view.key}
              tile={tile}
              index={index}
              count={tiles.length}
              onMove={onMove}
              onToggleVisible={onToggleVisible}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
