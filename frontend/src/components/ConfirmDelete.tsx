import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';

interface Props {
  /** What is being deleted, for screen readers, e.g. `"Draft config"`. */
  label: string;
  /** Short question shown in place of the bin icon. */
  question?: string;
  onConfirm: () => void;
}

/** Bin icon that asks "Delete? Yes / No" inline before deleting. Works where browser pop-ups are blocked. */
export default function ConfirmDelete({ label, question = 'Delete?', onConfirm }: Props) {
  const [asking, setAsking] = useState(false);
  const noRef = useRef<HTMLButtonElement>(null);

  // Focus the safe choice so a stray Enter doesn't delete.
  useEffect(() => {
    if (asking) noRef.current?.focus();
  }, [asking]);

  if (!asking) {
    return (
      <button
        type="button"
        aria-label={`Delete ${label}`}
        onClick={() => setAsking(true)}
        className="shrink-0 p-1 text-slate-300 hover:text-red-600"
      >
        <Trash2 size={14} />
      </button>
    );
  }

  return (
    <span
      role="group"
      aria-label={`Confirm deleting ${label}`}
      onKeyDown={(e) => e.key === 'Escape' && setAsking(false)}
      className="flex shrink-0 items-center gap-1 text-xs"
    >
      <span className="text-slate-600">{question}</span>
      <button
        type="button"
        onClick={() => {
          setAsking(false);
          onConfirm();
        }}
        className="rounded bg-red-600 px-2 py-0.5 font-medium text-white hover:bg-red-700"
      >
        Yes
      </button>
      <button
        ref={noRef}
        type="button"
        onClick={() => setAsking(false)}
        className="rounded border border-slate-300 px-2 py-0.5 text-slate-700 hover:bg-slate-50"
      >
        No
      </button>
    </span>
  );
}
