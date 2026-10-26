"use client";

import { useState } from "react";

import { EvolucionEjercicio } from "@/components/EvolucionEjercicio";
import { RadarMusculos } from "@/components/RadarMusculos";
import { cn } from "cn";

const SECCIONES = [
  { id: "musculos", texto: "Músculos" },
  { id: "ejercicios", texto: "Ejercicios" },
] as const;

// Estadísticas en dos secciones: las series por músculo (radar) y la evolución de cada ejercicio.
export function EstadisticasView() {
  const [seccion, setSeccion] = useState<(typeof SECCIONES)[number]["id"]>("musculos");
  return (
    <>
      <div className="flex gap-1 rounded-full bg-muted p-1" role="group" aria-label="Qué ver">
        {SECCIONES.map((s) => (
          <button
            key={s.id}
            type="button"
            aria-pressed={seccion === s.id}
            onClick={() => setSeccion(s.id)}
            className={cn(
              "flex-1 rounded-full px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              seccion === s.id ? "bg-disco-tinta font-medium text-white" : "text-muted-foreground",
            )}
          >
            {s.texto}
          </button>
        ))}
      </div>
      {seccion === "musculos" ? <RadarMusculos /> : <EvolucionEjercicio />}
    </>
  );
}
