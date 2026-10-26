import { EvolucionEjercicio } from "@/components/EvolucionEjercicio";
import { Franja } from "@/components/Franja";
import { PestanasProgreso } from "@/components/PestanasProgreso";
import { RadarMusculos } from "@/components/RadarMusculos";

// Estadísticas: las series por músculo de la última semana (radar) y la evolución de cada
// ejercicio por fecha, juntando todas las rutinas (decisión 69). Solo lectura.
export default function Estadisticas() {
  return (
    <main className="flex flex-1 flex-col">
      <Franja titulo="Progreso" aros="azul" />
      <div className="mx-auto w-full max-w-xl px-4 pt-5">
      <PestanasProgreso actual="/progreso/estadisticas" />
      <RadarMusculos />
      <EvolucionEjercicio />
      </div>
    </main>
  );
}
