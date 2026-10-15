import { Suspense } from "react";

import { Calendario } from "@/components/Calendario";
import { CargandoDiscos } from "@/components/Cargando";
import { PestanasProgreso } from "@/components/PestanasProgreso";

// Calendario: los días en que se entrenó, desde el primero y juntando todas las rutinas. Solo lectura.
// El calendario lee la fecha de hoy (cambia con cada visita): por eso va dentro de un <Suspense>,
// para que no se calcule al preparar la página (cacheComponents).
export default function CalendarioPage() {
  return (
    <main className="mx-auto max-w-xl px-4 pt-8">
      <h1 className="mt-0 mb-3">Progreso</h1>
      <PestanasProgreso actual="/progreso/calendario" />
      <Suspense fallback={<CargandoDiscos />}>
        <Calendario />
      </Suspense>
    </main>
  );
}
