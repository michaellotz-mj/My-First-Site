import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronRight, StickyNote, Sun } from 'lucide-react';
import AddForm from './AddForm';
import ConfirmDelete from './ConfirmDelete';
import EditableText from './EditableText';
import NotesDialog from './NotesDialog';
import { SortableItem, SortableList } from './Sortable';
import { api } from '../lib/api';
import { CATEGORY_STYLES } from '../lib/categoryStyles';
import { activityProgress } from '../lib/progress';
import type { CategoryKey, Subcategory } from '../lib/types';

/** Everything a card can change, supplied once by the page. */
export interface CardActions {
  mutate: (change: () => Promise<unknown>) => Promise<void>;
  onToggle: (id: number, done: boolean) => Promise<void>;
  onMoveActivity: (sub: Subcategory, activeId: number, overId: number) => void;
  onSaveNotes: (id: number, notes: string) => void;
  onSetToday: (id: number, today: boolean) => void;
}

export interface CardProps {
  sub: Subcategory;
  category: CategoryKey;
  actions: CardActions;
  /** Drag handle for reordering (in-progress cards only). */
  handle?: ReactNode;
  dragging?: boolean;
  /** Shown as a small tag, for cards in mixed lists (Today, Completed). */
  categoryLabel?: string;
  defaultOpen?: boolean;
}

export default function SubcategoryCard({
  sub,
  category,
  actions,
  handle,
  dragging,
  categoryLabel,
  defaultOpen = true,
}: CardProps) {
  const { mutate, onToggle, onMoveActivity, onSaveNotes, onSetToday } = actions;
  const [open, setOpen] = useState(defaultOpen);
  const [notesOpen, setNotesOpen] = useState(false);
  const hasNotes = sub.notes.trim() !== '';
  const progress = activityProgress(sub.activities);
  const styles = CATEGORY_STYLES[category];
  const percent = progress.total ? Math.round((progress.done / progress.total) * 100) : 0;

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-3 ${dragging ? 'shadow-lg ring-1 ring-slate-300' : 'shadow-sm'}`}
    >
      <div className="flex items-center gap-1">
        {handle}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-label={open ? `Collapse ${sub.name}` : `Expand ${sub.name}`}
          className="p-1 text-slate-400"
        >
          {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
        </button>
        <EditableText
          value={sub.name}
          struck={progress.complete}
          label={sub.name}
          className="font-medium"
          onSave={(name) => mutate(() => api.updateSubcategory(sub.id, { name }))}
        />
        <button
          type="button"
          aria-label={hasNotes ? `Notes for ${sub.name} (has notes)` : `Add notes for ${sub.name}`}
          title={hasNotes ? 'View notes' : 'Add notes'}
          onClick={() => setNotesOpen(true)}
          className={`shrink-0 rounded p-1 hover:bg-slate-100 ${hasNotes ? styles.text : 'text-slate-300 hover:text-slate-600'}`}
        >
          <StickyNote size={15} fill={hasNotes ? 'currentColor' : 'none'} fillOpacity={0.15} />
        </button>
        <button
          type="button"
          aria-label={sub.today ? `Remove ${sub.name} from Today` : `Add ${sub.name} to Today`}
          aria-pressed={sub.today}
          title={sub.today ? 'On Today – click to remove' : 'Add to Today'}
          onClick={() => onSetToday(sub.id, !sub.today)}
          className={`shrink-0 rounded p-1 hover:bg-slate-100 ${sub.today ? 'text-amber-500' : 'text-slate-300 hover:text-slate-600'}`}
        >
          <Sun size={15} fill={sub.today ? 'currentColor' : 'none'} fillOpacity={0.25} />
        </button>
        {notesOpen && (
          <NotesDialog
            title={sub.name}
            notes={sub.notes}
            onSave={(notes) => onSaveNotes(sub.id, notes)}
            onClose={() => setNotesOpen(false)}
          />
        )}
        <span className="shrink-0 text-xs text-slate-500 tabular-nums">
          {progress.done}/{progress.total}
        </span>
        <ConfirmDelete
          label={sub.name}
          question={
            sub.activities.length
              ? `Delete (${sub.activities.length} ${sub.activities.length === 1 ? 'activity' : 'activities'})?`
              : 'Delete?'
          }
          onConfirm={() => mutate(() => api.deleteSubcategory(sub.id))}
        />
      </div>
      <div className={`mt-2 flex items-center gap-2 ${handle ? 'ml-14' : 'ml-7'}`}>
        {categoryLabel && (
          <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${styles.pill}`}>
            {categoryLabel}
          </span>
        )}
        <div
          role="progressbar"
          aria-label={`${sub.name} progress`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent}
          className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100"
        >
          <div className={`h-full rounded-full transition-[width] ${styles.bar}`} style={{ width: `${percent}%` }} />
        </div>
      </div>

      {open && (
        <div className="mt-2 space-y-1 pl-7">
          <SortableList
            ids={sub.activities.map((a) => a.id)}
            nameOf={(id) => sub.activities.find((a) => a.id === id)?.title ?? 'activity'}
            onReorder={(activeId, overId) => onMoveActivity(sub, activeId, overId)}
          >
            <ul className="space-y-1">
              {sub.activities.map((a) => (
                <SortableItem
                  key={a.id}
                  id={a.id}
                  as="li"
                  handleLabel={`Reorder ${a.title}`}
                  disabled={sub.activities.length < 2}
                >
                  {(activityHandle, activityDragging) => (
                    <div
                      className={`flex items-center gap-2 rounded bg-white ${activityDragging ? 'shadow-md ring-1 ring-slate-200' : ''}`}
                    >
                      {activityHandle}
                      <input
                        type="checkbox"
                        checked={a.done}
                        onChange={() => onToggle(a.id, !a.done)}
                        aria-label={`Mark "${a.title}" ${a.done ? 'not done' : 'done'}`}
                        className={`h-4 w-4 shrink-0 ${styles.check}`}
                      />
                      <EditableText
                        value={a.title}
                        struck={a.done}
                        label={a.title}
                        className="text-sm"
                        onSave={(title) => mutate(() => api.updateActivity(a.id, { title }))}
                      />
                      <ConfirmDelete label={a.title} onConfirm={() => mutate(() => api.deleteActivity(a.id))} />
                    </div>
                  )}
                </SortableItem>
              ))}
            </ul>
          </SortableList>
          <AddForm
            placeholder="New activity"
            onAdd={(title) => mutate(() => api.createActivity(sub.id, title))}
          />
        </div>
      )}
    </div>
  );
}
