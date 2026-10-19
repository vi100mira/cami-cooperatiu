import type { MetadataRoute } from "next";

/** Manifiesto de la aplicación instalable. Next lo sirve en /manifest.webmanifest y lo enlaza desde la cabecera de la página. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Techo Común",
    short_name: "Techo Común",
    description: "Guía gratuita y sin ánimo de lucro para crear una cooperativa de vivienda en cesión de uso en España.",
    lang: "es",
    dir: "ltr",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Tema azul oscuro de la aplicación: la pantalla de arranque y la barra del sistema no hacen un destello claro.
    background_color: "#0b1324",
    theme_color: "#0b1324",
    categories: ["education", "lifestyle"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Calculadoras", short_name: "Calculadoras", description: "Cuota, presupuesto y terreno", url: "/#calc", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Oportunidades", short_name: "Oportunidades", description: "Buscar edificios y terrenos", url: "/#opor", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
      { name: "Documentos y modelos", short_name: "Documentos", description: "Modelos para la cooperativa", url: "/#docs", icons: [{ src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }] },
    ],
  };
}
