import { useEffect, useRef, type ReactNode, type RefObject } from 'react';

interface Props {
  /** Id of the heading inside that names the dialog. */
  labelledBy: string;
  onClose: () => void;
  /** Element to focus once open (otherwise the browser focuses the first control). */
  initialFocus?: RefObject<HTMLElement | null>;
  children: ReactNode;
}

/** Native modal dialog: Escape or clicking the backdrop calls onClose. */
export default function Modal({ labelledBy, onClose, initialFocus, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    // jsdom (tests) lacks showModal; fall back to a plain open dialog there.
    if (typeof dialog.showModal === 'function') dialog.showModal();
    else dialog.setAttribute('open', '');
    const target = initialFocus?.current;
    if (target) {
      target.focus();
      if (target instanceof HTMLTextAreaElement) target.setSelectionRange(target.value.length, target.value.length);
    }
  }, [initialFocus]);

  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      onClose={onClose}
      onCancel={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className="m-auto w-[min(36rem,calc(100vw-2rem))] rounded-xl bg-white p-0 text-slate-800 shadow-xl backdrop:bg-slate-900/40"
    >
      {children}
    </dialog>
  );
}
