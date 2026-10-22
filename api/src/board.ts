// Pure shaping of DB rows into the nested board the frontend renders.
import { CATEGORIES, type Category } from './validate';

export const CATEGORY_LABELS: Record<Category, string> = {
  work: 'Work',
  business: 'Business',
  other: 'Other',
};

export interface SubcategoryRow {
  id: number;
  category: Category;
  name: string;
  notes: string;
  position: number;
  today: boolean;
  today_position: number;
  urgency: number;
}

export interface ActivityRow {
  id: number;
  subcategory_id: number;
  title: string;
  done: boolean;
  position: number;
}

export interface Activity {
  id: number;
  title: string;
  done: boolean;
}

export interface Subcategory {
  id: number;
  name: string;
  notes: string;
  today: boolean;
  todayPosition: number;
  /** 1 = do first, 2 = important (default), 3 = later. */
  urgency: number;
  activities: Activity[];
}

export interface CategoryBoard {
  key: Category;
  label: string;
  subcategories: Subcategory[];
}

const byPosition = (a: { position: number; id: number }, b: { position: number; id: number }) =>
  a.position - b.position || a.id - b.id;

/** Always returns all three categories, in fixed order, even when empty. */
export function buildBoard(subs: SubcategoryRow[], acts: ActivityRow[]): CategoryBoard[] {
  const activitiesBySub = new Map<number, Activity[]>();
  for (const a of [...acts].sort(byPosition)) {
    const list = activitiesBySub.get(a.subcategory_id) ?? [];
    list.push({ id: a.id, title: a.title, done: a.done });
    activitiesBySub.set(a.subcategory_id, list);
  }
  return CATEGORIES.map((key) => ({
    key,
    label: CATEGORY_LABELS[key],
    subcategories: subs
      .filter((s) => s.category === key)
      .sort(byPosition)
      .map((s) => ({
        id: s.id,
        name: s.name,
        notes: s.notes,
        today: s.today,
        todayPosition: s.today_position,
        urgency: s.urgency,
        activities: activitiesBySub.get(s.id) ?? [],
      })),
  }));
}
