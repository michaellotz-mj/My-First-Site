import { useState, type FormEvent } from 'react';
import { Check, Pencil, X } from 'lucide-react';

interface Props {
  value: string;
  struck?: boolean;
  className?: string;
  label: string;
  onSave: (value: string) => Promise<void>;
}

/** Text with a pencil button that switches to an inline rename input. */
export default function EditableText({ value, struck, className = '', label, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  async function save(e: FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (trimmed && trimmed !== value) await onSave(trimmed);
    setEditing(false);
  }

  if (editing) {
    return (
      <form onSubmit={save} className="flex min-w-0 flex-1 items-center gap-1">
        <input
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Escape' && setEditing(false)}
          aria-label={`Rename ${label}`}
          className="min-w-0 flex-1 rounded border border-blue-400 px-1 text-sm focus:outline-none"
        />
        <button type="submit" aria-label="Save" className="p-1 text-green-600">
          <Check size={16} />
        </button>
        <button type="button" aria-label="Cancel" onClick={() => setEditing(false)} className="p-1 text-slate-400">
          <X size={16} />
        </button>
      </form>
    );
  }

  return (
    <span className="group flex min-w-0 flex-1 items-center gap-1">
      <span className={`break-words ${struck ? 'text-slate-400 line-through' : ''} ${className}`}>{value}</span>
      <button
        type="button"
        aria-label={`Rename ${label}`}
        onClick={() => {
          setDraft(value);
          setEditing(true);
        }}
        className="p-1 text-slate-300 hover:text-slate-600 sm:opacity-0 sm:group-hover:opacity-100"
      >
        <Pencil size={14} />
      </button>
    </span>
  );
}
