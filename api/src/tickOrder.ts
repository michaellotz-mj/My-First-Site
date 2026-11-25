// Pure placement rule for ticking activities. The frontend mirrors it in src/lib/progress.ts.

export interface Tickable {
  id: number;
  done: boolean;
}

/**
 * New id order (top first) after activity `id` is ticked, unticked or added: the still-to-do activities
 * first, then the ticked ones, each group keeping its order, with `id` placed between the two groups.
 * So a tick lands at the top of the ticked ones, an untick (or a new activity) at the bottom of the
 * to-do ones, and any ticked activity sitting above the to-do ones (older data, or dragged) moves down.
 */
export function placeByDone(items: Tickable[], id: number): number[] {
  const others = items.filter((i) => i.id !== id);
  return [...others.filter((i) => !i.done).map((i) => i.id), id, ...others.filter((i) => i.done).map((i) => i.id)];
}
