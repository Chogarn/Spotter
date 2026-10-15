import { EvolucionEjercicio } from "@/components/EvolucionEjercicio";
import { PestanasProgreso } from "@/components/PestanasProgreso";

// Estadísticas: la evolución de cada ejercicio por fecha, juntando todas las rutinas
// (decisión 69). Solo lectura.
export default function Estadisticas() {
  return (
    <main className="mx-auto max-w-xl px-4 pt-8">
      <h1 className="mt-0 mb-3">Progreso</h1>
      <PestanasProgreso actual="/progreso/estadisticas" />
      <EvolucionEjercicio />
    </main>
  );
}
