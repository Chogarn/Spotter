import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera .next/standalone: una carpeta mínima lista para la imagen de producción.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
  // Encabezados de seguridad en todas las respuestas. Sin CSP a propósito: una estricta pide
  // nonces y renderizado dinámico, y choca con cacheComponents.
  async headers() {
    const seguridad = [
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ];
    // HSTS obliga al navegador a usar siempre HTTPS: solo en producción, no en localhost.
    if (process.env.NODE_ENV === "production") {
      seguridad.push({ key: "Strict-Transport-Security", value: "max-age=31536000" });
    }
    return [{ source: "/:path*", headers: seguridad }];
  },
};

export default nextConfig;
