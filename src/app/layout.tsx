import type { Metadata, Viewport } from "next";
import "./globals.css";
import { RegistrarSW } from "@/components/RegistrarSW";

export const metadata: Metadata = {
  title: "Techo Común",
  description: "Guía gratuita y sin ánimo de lucro para crear una cooperativa de vivienda en cesión de uso en España.",
  applicationName: "Techo Común",
  // Al instalarla en iPhone o iPad: nombre bajo el icono y barra de estado negra, que combina con el tema oscuro.
  appleWebApp: { capable: true, title: "Techo Común", statusBarStyle: "black" },
  icons: { icon: "/icon.svg", apple: "/icons/apple-touch-icon.png" },
};
// Tema azul oscuro por defecto en todos los dispositivos (no sigue el ajuste del sistema); el interruptor guarda la elección. themeColor tiñe la barra del navegador móvil.
export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#0b1324", colorScheme: "dark" };

// Se ejecuta antes de pintar para que quien eligió el tema claro no vea un destello oscuro.
const TEMA = `try{if(localStorage.getItem("camiTema")==="light"){document.documentElement.dataset.theme="light";var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute("content","#f2f5f9")}}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,700;12..96,800&family=IBM+Plex+Mono:wght@400;500&family=Instrument+Sans:wght@400;500;600&display=swap" rel="stylesheet" />
      </head>
      <body>{children}<RegistrarSW /></body>
    </html>
  );
}
