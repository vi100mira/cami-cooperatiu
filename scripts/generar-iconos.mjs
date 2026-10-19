// Genera los iconos de la aplicación instalable en public/icons a partir del dibujo de src/app/icon.svg
// (rombo con punto, como el azulejo de la cabecera). Usa `sharp`, que ya viene con Next.
//
// Uso:  node scripts/generar-iconos.mjs
//   icon-192.png / icon-512.png        iconos normales, con las esquinas redondeadas
//   icon-maskable-512.png              a sangre, con el dibujo en la zona segura (Android lo recorta en círculo, cuadrado, gota…)
//   apple-touch-icon.png               180×180 a sangre; iOS le pone él las esquinas
import { mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const AZUL = "#1f4fd6";
const dibujo = (escala) => `<g transform="translate(16 16) scale(${escala}) translate(-16 -16)"><path d="M16 5l11 11-11 11L5 16z" fill="none" stroke="#fff" stroke-width="2.4"/><circle cx="16" cy="16" r="3.2" fill="#fff"/></g>`;
const svg = (fondo, escala) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">${fondo}${dibujo(escala)}</svg>`;

const normal = svg(`<rect width="32" height="32" rx="8" fill="${AZUL}"/>`, 1);
const aSangre = (escala) => svg(`<rect width="32" height="32" fill="${AZUL}"/>`, escala);

const salida = new URL("../public/icons/", import.meta.url);
mkdirSync(salida, { recursive: true });
const png = (nombre, contenido, lado) => sharp(Buffer.from(contenido), { density: 600 }).resize(lado, lado).png({ compressionLevel: 9 }).toFile(fileURLToPath(new URL(nombre, salida)));

await Promise.all([
  png("icon-192.png", normal, 192),
  png("icon-512.png", normal, 512),
  png("icon-maskable-512.png", aSangre(0.72), 512), // el dibujo ocupa ~50 % del lado: dentro del círculo seguro del 80 %
  png("apple-touch-icon.png", aSangre(1), 180),
]);
console.log("Iconos generados en public/icons");
