import { useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';

interface Props {
  placeholder: string;
  onAdd: (value: string) => Promise<void>;
}

/** Single-line input that submits on Enter and clears on success. */
export default function AddForm({ placeholder, onAdd }: Props) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || busy) return;
    setBusy(true);
    try {
      await onAdd(trimmed);
      setValue('');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm focus:border-blue-500 focus:outline-none"
      />
      <button
        type="submit"
        disabled={!value.trim() || busy}
        aria-label={placeholder}
        className="rounded-md p-1 text-blue-600 hover:bg-blue-50 disabled:text-slate-300"
      >
        <Plus size={18} />
      </button>
    </form>
  );
}
