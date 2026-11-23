// Pure placement rule for urgency changes. The frontend mirrors it in src/lib/progress.ts.

export interface Ranked {
  id: number;
  urgency: number;
  /** Finished items don't count as "more urgent" anchors (they show in Completed). */
  complete: boolean;
}

/**
 * New id order (top first) after `id` changes to `urgency`: it goes just below the last unfinished
 * item that is more urgent (lower number), or to the top if there is none. So a 1 goes to the top,
 * a 2 just below the 1s, a 3 just below the 2s. Everything else keeps its order.
 */
export function placeByUrgency(items: Ranked[], id: number, urgency: number): number[] {
  const others = items.filter((i) => i.id !== id);
  let at = 0;
  others.forEach((i, index) => {
    if (!i.complete && i.urgency < urgency) at = index + 1;
  });
  return [...others.slice(0, at).map((i) => i.id), id, ...others.slice(at).map((i) => i.id)];
}
