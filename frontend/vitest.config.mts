import { defineConfig } from "vitest/config";

// Tests del frontend: solo funciones puras de src/lib por ahora, sin navegador.
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
