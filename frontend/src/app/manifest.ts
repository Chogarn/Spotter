import type { MetadataRoute } from "next";

// La ficha de la app instalable (PWA): con esto Chrome ofrece "Instalar app" y el teléfono la abre
// a pantalla completa, sin la barra del navegador. No instala código: el ícono abre la web, que se
// sigue cargando del servidor (se actualiza sola con cada despliegue). Íconos de 192 y 512 px
// (los pide Chrome), generados con scripts/iconos-pwa.mjs; el disco cabe en la zona que Android
// no recorta, así que el mismo dibujo sirve de "maskable".
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Spotter",
    short_name: "Spotter",
    description: "Entrenador de gimnasio con IA que arma tu semana según tu progreso real.",
    lang: "es",
    start_url: "/",
    scope: "/",
    display: "standalone",
    // Tinta: el color de la franja de arriba (elegido por el usuario el 2026-11-07).
    background_color: "#172033",
    theme_color: "#172033",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
