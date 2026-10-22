import type { Urgency } from '../lib/types';

export const URGENCY_LABELS: Record<Urgency, string> = {
  1: 'Do first',
  2: 'Important, not urgent',
  3: 'Can wait',
};

const COLOURS: Record<Urgency, string> = {
  1: 'bg-red-100 text-red-700 ring-red-200',
  2: 'bg-amber-100 text-amber-800 ring-amber-200',
  3: 'bg-slate-100 text-slate-500 ring-slate-200',
};

interface Props {
  urgency: Urgency;
  /** Sub-category name, for the accessible label. */
  name: string;
  /** Omit for a read-only badge. */
  onChange?: (urgency: Urgency) => void;
}

/**
 * Small 1 / 2 / 3 badge. When editable, a transparent native <select> sits on top, so the phone's
 * own picker opens and keyboard users get a normal dropdown, while only the number shows.
 */
export default function UrgencyBadge({ urgency, name, onChange }: Props) {
  const badge = (
    <span
      aria-hidden={onChange ? true : undefined}
      className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-semibold ring-1 tabular-nums ${COLOURS[urgency]}`}
    >
      {urgency}
    </span>
  );
  if (!onChange) {
    return (
      <span className="shrink-0" title={`Urgency ${urgency}: ${URGENCY_LABELS[urgency]}`}>
        {badge}
        <span className="sr-only">Urgency {urgency}</span>
      </span>
    );
  }
  return (
    <span
      className="relative inline-flex shrink-0 rounded-full focus-within:outline-2 focus-within:outline-offset-1 focus-within:outline-brand"
      title={`Urgency ${urgency}: ${URGENCY_LABELS[urgency]}. Click to change.`}
    >
      {badge}
      <select
        value={urgency}
        onChange={(e) => onChange(Number(e.target.value) as Urgency)}
        aria-label={`Urgency for ${name}`}
        className="absolute inset-0 cursor-pointer appearance-none opacity-0"
      >
        {([1, 2, 3] as const).map((u) => (
          <option key={u} value={u}>
            {u} – {URGENCY_LABELS[u]}
          </option>
        ))}
      </select>
    </span>
  );
}
