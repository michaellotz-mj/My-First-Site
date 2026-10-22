import { useRef, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import Modal from './Modal';

const MAX_NOTES = 10000;

interface Props {
  /** Sub-category name, shown as the dialog heading. */
  title: string;
  notes: string;
  onSave: (notes: string) => void;
  onClose: () => void;
}

/** Modal notes editor. Save keeps the text; Cancel, Escape or clicking outside discards changes. */
export default function NotesDialog({ title, notes, onSave, onClose }: Props) {
  const textRef = useRef<HTMLTextAreaElement>(null);
  const [draft, setDraft] = useState(notes);
  const changed = draft !== notes;

  function save(e: FormEvent) {
    e.preventDefault();
    if (changed) onSave(draft);
    onClose();
  }

  return (
    <Modal labelledBy="notes-title" onClose={onClose} initialFocus={textRef}>
      <form onSubmit={save} className="flex flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Notes</p>
            <h2 id="notes-title" className="break-words text-lg font-semibold">
              {title}
            </h2>
          </div>
          <button type="button" aria-label="Close without saving" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700">
            <X size={18} />
          </button>
        </div>
        <textarea
          id="notes-text"
          ref={textRef}
          value={draft}
          maxLength={MAX_NOTES}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) save(e);
          }}
          rows={10}
          placeholder="Links, contacts, decisions, anything worth keeping with this sub-category…"
          aria-label={`Notes for ${title}`}
          className="w-full resize-y rounded-md border border-slate-300 p-2 text-sm leading-relaxed focus:border-brand focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-slate-400 tabular-nums">
            {draft.length > MAX_NOTES * 0.9 ? `${draft.length.toLocaleString()} / ${MAX_NOTES.toLocaleString()}` : ''}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!changed}
              className="rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-40"
            >
              Save
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
