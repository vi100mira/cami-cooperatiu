"use client";
import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "dark" | "light";
const CLAVE = "camiTema";
const COLOR: Record<Tema, string> = { dark: "#0b1324", light: "#f2f5f9" };

/** Interruptor de tema. Por defecto, azul oscuro en todos los dispositivos; la elección se recuerda en este navegador. */
export function ThemeToggle() {
  const [tema, setTema] = useState<Tema>("dark");
  useEffect(() => { setTema(document.documentElement.dataset.theme === "light" ? "light" : "dark"); }, []);
  const cambiar = () => {
    const t: Tema = tema === "dark" ? "light" : "dark";
    setTema(t);
    document.documentElement.dataset.theme = t;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", COLOR[t]);
    try { localStorage.setItem(CLAVE, t); } catch { /* sin almacenamiento: vale solo para esta visita */ }
  };
  const oscuro = tema === "dark";
  return (
    <button type="button" onClick={cambiar} aria-pressed={oscuro} title={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      className="mt-3 inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-[13px] font-medium text-foreground outline-none transition hover:border-primary hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/40">
      {oscuro ? <Sun className="size-3.5" aria-hidden /> : <Moon className="size-3.5" aria-hidden />}
      {oscuro ? "Tema claro" : "Tema oscuro"}
    </button>
  );
}
