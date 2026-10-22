import type { CSSProperties, ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';

interface ListProps {
  ids: number[];
  /** Called once on drop with the dragged id and the id it was dropped on. */
  onReorder: (activeId: number, overId: number) => void;
  /** Item name for screen-reader announcements, e.g. "Picked up Draft config". */
  nameOf: (id: number) => string;
  children: ReactNode;
}

/** A vertical drag-and-drop list. Items are dragged by their handle (mouse, touch or keyboard). */
export function SortableList({ ids, onReorder, nameOf, children }: ListProps) {
  const sensors = useSensors(
    // A small distance keeps a click on the handle from counting as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function onDragEnd({ active, over }: DragEndEvent) {
    if (over && active.id !== over.id) onReorder(Number(active.id), Number(over.id));
  }

  const name = (id: string | number) => nameOf(Number(id));
  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      accessibility={{
        screenReaderInstructions: {
          draggable: 'To reorder, press Space, use the up and down arrow keys to move, then press Space again to drop. Escape cancels.',
        },
        announcements: {
          onDragStart: ({ active }) => `Picked up ${name(active.id)}.`,
          onDragOver: ({ active, over }) => (over ? `${name(active.id)} is over ${name(over.id)}.` : undefined),
          onDragEnd: ({ active, over }) =>
            over ? `Dropped ${name(active.id)} at the position of ${name(over.id)}.` : `Dropped ${name(active.id)}.`,
          onDragCancel: ({ active }) => `Cancelled. ${name(active.id)} is back where it was.`,
        },
      }}
    >
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

interface ItemProps {
  id: number;
  /** Accessible name for the handle, e.g. "Reorder Draft config". */
  handleLabel: string;
  /** Hide the handle (e.g. a list of one). The item still renders. */
  disabled?: boolean;
  className?: string;
  /** Element to render: `li` inside a list, `div` otherwise. */
  as?: 'div' | 'li';
  /** Renders the item; place `handle` where the grip should appear. */
  children: (handle: ReactNode, dragging: boolean) => ReactNode;
}

export function SortableItem({ id, handleLabel, disabled, className = '', as: Tag = 'div', children }: ItemProps) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });
  const style: CSSProperties = { transform: CSS.Transform.toString(transform), transition };

  const handle = disabled ? null : (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={handleLabel}
      className="shrink-0 cursor-grab touch-none rounded p-1 text-slate-300 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
    >
      <GripVertical size={16} />
    </button>
  );

  return (
    <Tag ref={setNodeRef} style={style} className={`${className} ${isDragging ? 'relative z-10' : ''}`}>
      {children(handle, isDragging)}
    </Tag>
  );
}
