import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Genera .next/standalone: una carpeta mínima lista para la imagen de producción.
  output: "standalone",
  cacheComponents: true,
  partialPrefetching: true,
};

export default nextConfig;
