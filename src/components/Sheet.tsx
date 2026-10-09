"use client";
import { useEffect, useRef } from "react";
import { TERMS } from "@/lib/content";
import { Rich } from "./Rich";

export default function Sheet({ term, onClose, onOpen }: { term: string | null; onClose: () => void; onOpen: (k: string) => void }) {
  const ref = useRef<HTMLElement>(null);
  const x = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!term) return;
    x.current?.focus();
    ref.current?.scrollTo(0, 0);
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "Tab" && ref.current) {
        const f = Array.from(ref.current.querySelectorAll<HTMLElement>("button,a[href]"));
        if (!f.length) return;
        const a = f[0], z = f[f.length - 1];
        if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); }
        else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
      }
    };
    document.addEventListener("keydown", key);
    return () => document.removeEventListener("keydown", key);
  }, [term, onClose]);
  const t = term ? TERMS[term] : null;
  if (!t) return null;
  return (
    <>
      <div className="sheet-bg" onClick={onClose} />
      <aside className="sheet" ref={ref} role="dialog" aria-modal="true" aria-labelledby="sh-t">
        <div className="sh-top"><span className="eyebrow">Ayuda</span><button className="x" ref={x} type="button" aria-label="Cerrar ayuda" onClick={onClose}>×</button></div>
        <h3 id="sh-t">{t.t}</h3>
        <div id="sh-b">{t.d.split("\n\n").map((p, i) => <p key={i}><Rich text={p} /></p>)}</div>
        <div className="chips">{(t.rel || []).map((r) => <button key={r} type="button" className="chip term" onClick={() => onOpen(r)}>{TERMS[r].t}</button>)}</div>
        {t.link && <div><a className="btn ghost sm" href={t.link[1]} target="_blank" rel="noopener noreferrer">{t.link[0]} ↗</a></div>}
      </aside>
    </>
  );
}
