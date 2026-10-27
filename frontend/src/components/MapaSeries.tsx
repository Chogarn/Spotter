"use client";

import { useEffect, useState } from "react";

import { InfoMapa } from "@/components/InfoMapa";
import { MapaMuscular, type Cuerpo, type Vista } from "@/components/MapaMuscular";
import { apiFetch, type MuscleSets } from "@/lib/api";
import { cn } from "cn";

// Qué piezas del dibujo pinta cada grupo de las estadísticas.
const PIEZAS: Record<string, string[]> = {
  chest: ["chest"],
  back: ["upper-back", "trapezius", "lower-back"],
  shoulders: ["deltoids"],
  quadriceps: ["quadriceps"],
  hamstrings: ["hamstring"],
  glutes: ["gluteal"],
  biceps: ["biceps"],
  triceps: ["triceps"],
  calves: ["calves"],
  core: ["abs", "obliques"],
  adductors: ["adductors"],
  forearm: ["forearm"],
  tibialis: ["tibialis"],
};

const CLAVE_CUERPO = "spotter_mapa_cuerpo";

// De 0 (sin series) a 4 (el 150 % del mínimo o más). Sin mínimo (un día), se mide contra el grupo
// que más hizo.
function nivel(series: number, referencia: number): number {
  if (series <= 0 || referencia <= 0) return 0;
  return Math.max(1, Math.ceil(Math.min(series / (referencia * 1.5), 1) * 4));
}

function cuerpoGuardado(): Cuerpo | null {
  try {
    const v = localStorage.getItem(CLAVE_CUERPO);
    return v === "masculino" || v === "femenino" ? v : null;
  } catch {
    return null;
  }
}

// Las mismas series del radar, sobre el cuerpo: cuanto más rojo, más series directas. El dibujo sale
// del sexo del perfil; solo quien eligió "otro" (o no lo cargó) puede elegir cuál ver.
export function MapaSeries({ muscles, minimum }: { muscles: MuscleSets[]; minimum: number | null }) {
  const [sexo, setSexo] = useState<string | null | undefined>(undefined);
  const [elegido, setElegido] = useState<Cuerpo>("masculino");
  const [vista, setVista] = useState<Vista>("frente");

  useEffect(() => {
    apiFetch("/profile")
      .then(async (res) => (res.ok ? ((await res.json()).sex ?? null) : null))
      .catch(() => null)
      .then((s) => {
        setElegido(cuerpoGuardado() ?? "masculino");
        setSexo(s);
      });
  }, []);

  if (sexo === undefined) return null;

  const elige = sexo !== "masculino" && sexo !== "femenino";
  const cuerpo: Cuerpo = sexo === "femenino" ? "femenino" : sexo === "masculino" ? "masculino" : elegido;
  // Los complementos se miden con la misma vara que los grupos grandes (no tienen mínimo propio).
  const referencia = minimum ?? Math.max(0, ...muscles.map((m) => m.sets));

  const intensidad: Record<string, number> = {};
  for (const m of muscles) {
    for (const pieza of PIEZAS[m.muscle] ?? []) intensidad[pieza] = nivel(m.sets, referencia);
  }
  const resumen = muscles.map((m) => `${m.muscle}: ${m.sets} series`).join("; ");

  function elegirCuerpo(c: Cuerpo) {
    setElegido(c);
    try {
      localStorage.setItem(CLAVE_CUERPO, c);
    } catch {
      /* sin almacenamiento, vale para esta visita */
    }
  }

  return (
    <div>
      {elige && (
        <div className="mb-2 flex gap-1 rounded-full bg-muted p-1" role="group" aria-label="Qué dibujo ver">
          {(["masculino", "femenino"] as Cuerpo[]).map((c) => (
            <button
              key={c}
              type="button"
              aria-pressed={cuerpo === c}
              onClick={() => elegirCuerpo(c)}
              className={cn(
                "flex-1 rounded-full px-3 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                cuerpo === c ? "bg-disco-tinta font-medium text-white" : "text-muted-foreground",
              )}
            >
              {c === "masculino" ? "Hombre" : "Mujer"}
            </button>
          ))}
        </div>
      )}
      <div>
        <MapaMuscular
          cuerpo={cuerpo}
          vista={vista}
          intensidad={intensidad}
          descripcion={`Series por músculo, vista de ${vista}. ${resumen}.`}
        />
        <div className="relative mt-3 flex items-center justify-center">
          <button
            type="button"
            onClick={() => setVista(vista === "frente" ? "espalda" : "frente")}
            className="rounded-full bg-muted px-4 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            Ver {vista === "frente" ? "espalda" : "frente"}
          </button>
          <InfoMapa className="absolute right-0" />
        </div>
      </div>
    </div>
  );
}
