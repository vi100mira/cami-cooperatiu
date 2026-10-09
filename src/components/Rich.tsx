"use client";
import { createContext, useContext, Fragment } from "react";
export const HelpCtx = createContext<(k: string, from?: HTMLElement) => void>(() => {});
export const useHelp = () => useContext(HelpCtx);

export function Rich({ text }: { text: string }) {
  const open = useHelp();
  const parts: React.ReactNode[] = [];
  const re = /\{\{(\w+)\|([^}]+)\}\}/g;
  let last = 0, m: RegExpExecArray | null, i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) parts.push(<Fragment key={i++}>{text.slice(last, m.index)}</Fragment>);
    const k = m[1];
    parts.push(<button key={i++} type="button" className="t" onClick={(e) => open(k, e.currentTarget)}>{m[2]}</button>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(<Fragment key={i++}>{text.slice(last)}</Fragment>);
  return <>{parts}</>;
}
