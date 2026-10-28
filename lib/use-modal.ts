"use client";
import { useEffect, useRef } from "react";
export function useModal(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(close);
  useEffect(() => { closeRef.current = close; }, [close]);
  useEffect(() => {
    if (!open || !ref.current) return;
    const dialog = ref.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const controls = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]')).filter(el => el.getClientRects().length > 0);
    (controls()[0] ?? dialog).focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const elements = controls();
      const first = elements[0]; const last = elements[elements.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener("keydown", onKey);
    return () => { dialog.removeEventListener("keydown", onKey); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, [open]);
  return ref;
}
