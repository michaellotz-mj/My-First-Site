// Remembered UI choices (tab, completed-section view). Storage can be unavailable, so never throw.

export function loadChoice<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const saved = localStorage.getItem(key);
    return allowed.includes(saved as T) ? (saved as T) : fallback;
  } catch {
    return fallback;
  }
}

export function saveChoice(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Remembering is a convenience; ignore storage errors.
  }
}
