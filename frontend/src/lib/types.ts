// Mirrors the API's board shape (api/src/board.ts).
export type CategoryKey = 'work' | 'business' | 'other';

export interface Activity {
  id: number;
  title: string;
  done: boolean;
}

export interface Subcategory {
  id: number;
  name: string;
  notes: string;
  activities: Activity[];
}

export interface CategoryBoard {
  key: CategoryKey;
  label: string;
  subcategories: Subcategory[];
}
