import { EvolucionEjercicio } from "@/components/EvolucionEjercicio";
import { Franja } from "@/components/Franja";

// Evolución por ejercicio, por fecha y juntando todas las rutinas (decisión 69). Solo lectura.
export default function EjerciciosPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Franja titulo="Evolución por ejercicio" aros="azul" volver={{ href: "/progreso" }} compacta />
      <div className="mx-auto w-full max-w-xl px-4 pt-3">
        <EvolucionEjercicio />
      </div>
    </main>
  );
}
