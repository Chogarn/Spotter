import { Suspense } from "react";

import { Calendario } from "@/components/Calendario";
import { CargandoDiscos } from "@/components/Cargando";
import { Franja } from "@/components/Franja";

// Calendario: los días en que se entrenó, desde el primero y juntando todas las rutinas. Solo lectura.
// El calendario lee la fecha de hoy (cambia con cada visita): por eso va dentro de un <Suspense>,
// para que no se calcule al preparar la página (cacheComponents).
export default function CalendarioPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Franja titulo="Calendario" aros="azul" volver={{ href: "/" }} compacta />
      <div className="mx-auto w-full max-w-xl px-4 pt-5">
      <Suspense fallback={<CargandoDiscos />}>
        <Calendario />
      </Suspense>
      </div>
    </main>
  );
}
