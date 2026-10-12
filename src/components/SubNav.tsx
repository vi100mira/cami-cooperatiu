"use client";
import type { ReactNode } from "react";
import { TabsList, TabsTrigger } from "./ui/tabs";

export interface SubItem { k: string; l: string; icono?: ReactNode; n?: number }

/** Menú de apartados dentro de una pestaña grande. Va dentro de un `Tabs`, con un `TabsContent` por apartado. */
export function SubNav({ id, label, items }: { id: string; label: string; items: SubItem[] }) {
  return (
    <TabsList id={id} aria-label={label} className="w-full scroll-mt-16 gap-1 rounded-full border bg-card p-1">
      {items.map((i) => (
        <TabsTrigger key={i.k} value={i.k} className="flex-1 justify-center gap-1 px-2 py-1.5 text-[12.5px] sm:flex-none sm:gap-1.5 sm:px-3.5 sm:text-[13px] max-sm:[&_svg]:hidden">
          {i.icono}{i.l}
          {i.n ? <span className="rounded-full bg-secondary px-1.5 text-[11px] font-bold text-foreground">{i.n}</span> : null}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
