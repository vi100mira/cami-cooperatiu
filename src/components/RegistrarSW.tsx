"use client";
import { useEffect } from "react";

/** Registra el service worker que permite instalar la aplicación y abrirla sin conexión. Solo en producción: en desarrollo estorbaría. */
export function RegistrarSW() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    const registrar = () => { navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => { /* sin service worker la aplicación funciona igual */ }); };
    if (document.readyState === "complete") registrar(); else window.addEventListener("load", registrar, { once: true });
    return () => window.removeEventListener("load", registrar);
  }, []);
  return null;
}
