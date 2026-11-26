import { useEffect, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

const activeDialogStack: HTMLElement[] = [];

const isVisible = (node: HTMLElement) => node.getClientRects().length > 0;

/** Traps Tab focus inside an active visible modal/drawer and restores trigger focus on close. */
export function useDialogA11y(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
) {
  useEffect(() => {
    if (!active) return;
    const el = containerRef.current;
    if (!el || !isVisible(el)) return;

    const prevFocus =
      typeof document !== 'undefined'
        ? (document.activeElement as HTMLElement | null)
        : null;

    activeDialogStack.push(el);

    const getFocusable = () =>
      Array.from(el.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (node) => isVisible(node) || node === document.activeElement,
      );

    const focusables = getFocusable();
    if (focusables.length > 0) {
      focusables[0]!.focus();
    } else {
      el.focus();
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;
      if (!isVisible(el) || activeDialogStack[activeDialogStack.length - 1] !== el) {
        return;
      }
      const nodes = getFocusable();
      if (nodes.length === 0) {
        e.preventDefault();
        el.focus();
        return;
      }
      const first = nodes[0]!;
      const last = nodes[nodes.length - 1]!;
      const current = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (current === first || !el.contains(current)) {
          e.preventDefault();
          last.focus();
        }
      } else if (current === last || !el.contains(current)) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown, true);
    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      const idx = activeDialogStack.lastIndexOf(el);
      if (idx !== -1) activeDialogStack.splice(idx, 1);
      if (prevFocus && prevFocus.isConnected && isVisible(prevFocus)) {
        prevFocus.focus();
      }
    };
  }, [containerRef, active]);
}
