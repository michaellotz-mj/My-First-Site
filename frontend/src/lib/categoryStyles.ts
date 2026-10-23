import type { CategoryKey } from './types';

/** Per-category colours (full class names so Tailwind picks them up). */
export const CATEGORY_STYLES: Record<CategoryKey, { dot: string; pill: string; bar: string; check: string; text: string }> = {
  work: { dot: 'bg-work', pill: 'bg-work-soft text-work', bar: 'bg-work', check: 'accent-work', text: 'text-work' },
  business: { dot: 'bg-business', pill: 'bg-business-soft text-business', bar: 'bg-business', check: 'accent-business', text: 'text-business' },
  other: { dot: 'bg-other', pill: 'bg-other-soft text-other', bar: 'bg-other', check: 'accent-other', text: 'text-other' },
};
