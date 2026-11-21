// Keyboard focus trap for modal dialogs (the site menu): Tab and Shift+Tab
// cycle through the dialog's controls and never reach the page behind it.

export const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type=hidden])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

/**
 * Where focus must go when Tab is pressed inside a trap.
 * `current` is the index of the focused element among the `count` focusable
 * ones (-1 when focus is on none of them, e.g. on the page behind).
 * Returns the index to focus, or null to let the browser move focus normally.
 */
export function trapTarget(count: number, current: number, backwards: boolean): number | null {
  if (count <= 0) return null;
  if (current < 0 || current >= count) return backwards ? count - 1 : 0;
  if (backwards && current === 0) return count - 1;
  if (!backwards && current === count - 1) return 0;
  return null;
}

/** Keeps a Tab keydown inside `container`. Returns true when it moved focus. */
export function trapTabKey(container: HTMLElement, event: KeyboardEvent): boolean {
  if (event.key !== "Tab") return false;
  const items = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => !el.closest("[inert]") && el.getClientRects().length > 0,
  );
  const active = document.activeElement as HTMLElement | null;
  const target = trapTarget(items.length, active ? items.indexOf(active) : -1, event.shiftKey);
  if (target === null) return false;
  event.preventDefault();
  items[target]?.focus();
  return true;
}
