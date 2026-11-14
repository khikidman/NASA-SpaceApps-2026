"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { HudIcon } from "./hud-icon";

export function HudDialog({ open, title, eyebrow, onClose, children, className = "" }: {
  open: boolean;
  title: string;
  eyebrow: string;
  onClose(): void;
  children: ReactNode;
  className?: string;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (open && !element.open) element.showModal();
    else if (!open && element.open) element.close();
  }, [open]);

  return <dialog className={`hud-dialog ${className}`} ref={dialog} aria-label={title}
    onClose={() => {
      onClose();
      requestAnimationFrame(() => document.querySelector<HTMLCanvasElement>(".world-viewport canvas")?.focus({ preventScroll: true }));
    }}
    onClick={(event) => {
      if (event.target !== event.currentTarget) return;
      const bounds = event.currentTarget.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) event.currentTarget.close();
    }}>
    <header className="dialog-header"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div><button className="icon-button" type="button" aria-label={`Close ${title}`} onClick={() => dialog.current?.close()}><HudIcon name="close" /></button></header>
    <div className="dialog-content">{children}</div>
  </dialog>;
}
