"use client";
import { Users } from "lucide-react";
import { useGrupo } from "@/lib/grupo";
import { Button } from "./ui/button";

const irAGrupo = () => window.dispatchEvent(new CustomEvent("cami:goto", { detail: "grupo" }));

/** Franja de la tarjeta «Tu cooperativa» que enlaza los datos locales con el grupo compartido de la pestaña Grupo. */
export function GrupoConexion() {
  const g = useGrupo();
  if (g.estado === "cargando" || !g.disponible) return null;
  const dentro = g.estado === "grupo" || g.estado === "miembro";
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-accent px-3.5 py-2.5 text-[13.5px]">
      <span className="flex min-w-0 items-start gap-2">
        <Users className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        {dentro
          ? <span>Conectada al grupo <b>«{g.grupo?.nombre}»</b>{g.miembro ? <> como <b>{g.miembro.nombre}</b></> : " (falta confirmar quién eres)"}. {g.miembro ? "Los favoritos y los datos de arriba (comunidad, ciudad, familias, barrio, centro de acción y distancia máxima) se comparten con el grupo; el nombre de la cooperativa y las cifras de las calculadoras se quedan en este navegador." : "Cuando confirmes quién eres, los favoritos y los datos de arriba (comunidad, ciudad, familias, barrio, centro de acción y distancia máxima) se compartirán con el grupo."}</span>
          : <span>¿Queréis compartir ofertas favoritas con el resto de personas? Entra a tu grupo o crea uno.</span>}
      </span>
      <Button size="sm" variant="outline" onClick={irAGrupo}>{dentro ? "Ver el grupo" : "Entrar o crear un grupo"}</Button>
    </div>
  );
}
