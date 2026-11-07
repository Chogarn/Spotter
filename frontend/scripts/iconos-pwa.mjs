// Genera los íconos PNG de la app instalable (PWA) a partir del ícono elegido: el disco rojo
// del logo sobre tinta (opción A, 2026-11-07). El fondo llega a los bordes, sin esquinas
// redondeadas: Android y el iPhone recortan el ícono con su propia forma. El disco queda
// dentro del círculo central del 80 %, que Android nunca recorta ("maskable").
// Uso (dentro del contenedor del frontend): node scripts/iconos-pwa.mjs
import sharp from "sharp";

const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#172033"/>
  <circle cx="32" cy="32" r="15" fill="none" stroke="#D7263D" stroke-width="9"/>
</svg>`);

const salidas = [
  ["public/icon-192.png", 192],
  ["public/icon-512.png", 512],
  ["src/app/apple-icon.png", 180],
];

for (const [archivo, lado] of salidas) {
  await sharp(svg, { density: 72 * (lado / 64) * 2 }).resize(lado, lado).png().toFile(archivo);
  console.log(`${archivo} (${lado} px)`);
}
