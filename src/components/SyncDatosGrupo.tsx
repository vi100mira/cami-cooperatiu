"use client";
import { useEffect, useRef } from "react";
import { useGrupo, type DatosCoop } from "@/lib/grupo";
import { useStore } from "@/lib/store";

/**
 * Mantiene al día los datos de «Tu cooperativa» (región, ciudad, familias, barrio, centro de acción y distancia máxima) entre el navegador y el grupo.
 * Al identificarte manda el grupo si ya tiene datos; si no los tiene, se guardan los tuyos. Después, cada cambio se guarda
 * en el grupo (gana el último que escribe). Los ingresos, el capital y el nombre de la cooperativa se quedan en el navegador.
 */
export function SyncDatosGrupo() {
  const g = useGrupo(); const { s, set, ready } = useStore();
  const { estado, datosCoop, guardarDatosCoop } = g;
  const conciliado = useRef(false);
  const ultimo = useRef<string | null>(null);
  const local: DatosCoop = { region: s.group.region, ciudad: s.group.ciudad, familias: s.group.fam, barrio: s.group.barrio, centro: s.group.centro ?? "", radio: s.group.radio ?? 0 };
  const clave = JSON.stringify(local);

  // Al identificarte, una sola vez por conexión: el grupo manda si ya tiene datos.
  useEffect(() => {
    if (estado !== "miembro") { conciliado.current = false; ultimo.current = null; return; }
    if (!ready || datosCoop === undefined || conciliado.current) return;
    conciliado.current = true;
    if (datosCoop) {
      ultimo.current = JSON.stringify(datosCoop);
      // Los datos guardados antes de existir el centro y el radio no los traen: ahí se respeta lo que haya en este navegador.
      set((x) => ({ ...x, group: { ...x.group, region: datosCoop.region, ciudad: datosCoop.ciudad, fam: datosCoop.familias, barrio: datosCoop.barrio, centro: datosCoop.centro ?? x.group.centro, radio: datosCoop.radio ?? x.group.radio } }));
    }
  }, [estado, ready, datosCoop, set]);

  // Quien no administra no decide el número de familias: si el grupo cambia, lo adopta.
  useEffect(() => {
    if (estado !== "miembro" || !conciliado.current || !datosCoop || g.miembro?.esAdmin) return;
    if (datosCoop.familias !== s.group.fam) set((x) => ({ ...x, group: { ...x.group, fam: datosCoop.familias } }));
  }, [estado, datosCoop, g.miembro?.esAdmin, s.group.fam, set]);

  // Cada cambio local se guarda en el grupo, con una pequeña espera para no escribir letra a letra.
  useEffect(() => {
    if (estado !== "miembro" || !conciliado.current || clave === ultimo.current) return;
    const t = setTimeout(async () => { if ((await guardarDatosCoop(JSON.parse(clave))) === null) ultimo.current = clave; }, 800);
    return () => clearTimeout(t);
  }, [estado, clave, guardarDatosCoop, datosCoop]);

  return null;
}
