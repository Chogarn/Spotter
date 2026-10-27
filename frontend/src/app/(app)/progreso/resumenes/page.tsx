"use client";

import { Franja } from "@/components/Franja";
import { ResumenPeriodo } from "@/components/ResumenPeriodo";
import { SelectorPeriodo, usePeriodo } from "@/components/SelectorPeriodo";

// Progreso › Resúmenes: Día, Semana, Mes o Año. Todos por fecha, juntando todas las rutinas. Solo lectura.
export default function Resumenes() {
  const [periodo, setPeriodo] = usePeriodo();

  return (
    <main className="flex flex-1 flex-col">
      <Franja titulo="Resúmenes" aros="azul" volver={{ href: "/" }} compacta />
      <div className="mx-auto w-full max-w-xl px-4 pt-5">
        <ResumenPeriodo key={periodo} tramo={periodo} selector={<SelectorPeriodo periodo={periodo} onElegir={setPeriodo} />} />
      </div>
    </main>
  );
}
