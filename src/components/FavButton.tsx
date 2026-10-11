"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { useGrupo } from "@/lib/grupo";
import type { Listing } from "@/lib/parse-fotocasa";
import type { Tipo } from "@/lib/favoritos";
import { cn } from "@/lib/utils";

/** Corazón de favorito de una oferta. Sin grupo identificado, lleva a la pestaña Grupo. */
export function FavButton({ l, tipo }: { l: Listing; tipo: Tipo }) {
  const g = useGrupo();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const dentro = g.estado === "miembro";
  const mio = dentro && g.esFavorito(l);
  const nombres = dentro ? g.quienes(l) : [];
  const etiqueta = !dentro ? "Entra a tu grupo para guardar favoritos" : mio ? "Quitar de favoritos" : "Marcar como favorito";
  const click = async () => {
    if (!dentro) { window.dispatchEvent(new CustomEvent("cami:goto", { detail: "grupo" })); return; }
    setBusy(true); setErr(null);
    setErr(await g.alternarFavorito(l, tipo));
    setBusy(false);
  };
  return (
    <div className="flex shrink-0 flex-col items-end gap-0.5">
      <button type="button" onClick={click} disabled={busy} aria-pressed={dentro ? mio : undefined} aria-label={etiqueta} title={etiqueta}
        className={cn("grid size-9 cursor-pointer place-items-center rounded-full border bg-card outline-none transition hover:border-destructive hover:text-destructive focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:opacity-60", mio ? "border-destructive text-destructive" : "text-muted-foreground")}>
        <Heart className={cn("size-[18px]", mio && "fill-current")} aria-hidden />
      </button>
      {nombres.length > 0 && <span className="max-w-[10rem] text-right text-[11.5px] leading-tight text-muted-foreground">♥ {nombres.join(", ")}</span>}
      {err && <span role="alert" className="max-w-[10rem] text-right text-[11.5px] leading-tight text-destructive">{err}</span>}
    </div>
  );
}
