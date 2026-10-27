"use client";

import { useEffect, useState } from "react";

import { apiFetch, type Routine, type RoutineDetail, type WeekSummary } from "@/lib/api";

import { GenerarRutina } from "./GenerarRutina";

// Lo que se muestra cuando no hay una semana activa (decisión 66), igual en Inicio y en Entrenar:
// la última semana cerrada y dos opciones claras, "Generar la semana siguiente" (continúa esa
// rutina) y "Empezar una rutina nueva".

export type UltimaSemana = { rutina: Routine; semana: WeekSummary };

// La rutina más nueva y su última semana: es la que se continúa. `undefined` = cargando;
// `null` = no hay ninguna (nunca se generó una rutina).
export function useUltimaSemana(): UltimaSemana | null | undefined {
  const [ultima, setUltima] = useState<UltimaSemana | null | undefined>(undefined);

  useEffect(() => {
    async function cargar() {
      const res = await apiFetch(`/routines`);
      if (!res.ok) return setUltima(null);
      const lista: Routine[] = await res.json();
      const rutina = lista.find((r) => r.week_count > 0);
      if (!rutina) return setUltima(null);
      const det = await apiFetch(`/routines/${rutina.id}`);
      if (!det.ok) return setUltima(null);
      const detalle: RoutineDetail = await det.json();
      const semana = detalle.weeks[0]; // la más nueva
      setUltima(semana ? { rutina, semana } : null);
    }
    cargar().catch(() => setUltima(null));
  }, []);

  return ultima;
}

// Los botones. Sin ninguna rutina todavía, queda el "Generar rutina" de siempre. En Inicio no va
// "Empezar una rutina nueva" (`conRutinaNueva={false}`): ahí ya está la tarjeta "Nueva rutina".
export function OpcionesSiguiente({
  ultima,
  onConflict,
  conRutinaNueva = true,
}: {
  ultima: UltimaSemana | null;
  onConflict: () => void;
  conRutinaNueva?: boolean;
}) {
  if (!ultima) {
    return <GenerarRutina etiqueta="Generar rutina" onConflict={onConflict} />;
  }
  return (
    <div className="grid gap-2.5">
      <GenerarRutina etiqueta="Generar la semana siguiente" continuar={ultima.rutina.id} onConflict={onConflict} />
      {conRutinaNueva && (
        <GenerarRutina etiqueta="Empezar una rutina nueva" soloNueva variante="outline" onConflict={onConflict} />
      )}
    </div>
  );
}
