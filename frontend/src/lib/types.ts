// Mirrors the API's board shape (api/src/board.ts).
export type CategoryKey = 'work' | 'business' | 'other';

/** 1 = do first, 2 = important but not urgent (default), 3 = later. */
export type Urgency = 1 | 2 | 3;

export interface Activity {
  id: number;
  title: string;
  done: boolean;
}

export interface Subcategory {
  id: number;
  name: string;
  notes: string;
  /** On the Today list, and its place there. */
  today: boolean;
  todayPosition: number;
  urgency: Urgency;
  activities: Activity[];
}

export interface CategoryBoard {
  key: CategoryKey;
  label: string;
  subcategories: Subcategory[];
}
