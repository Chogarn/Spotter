"use client";

import { Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { readError, type RoutineDetail, apiFetch } from "@/lib/api";
import { goalText, nombreCorto, nombreDiceElObjetivo } from "@/lib/format";
import { DiscosSemana } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Franja } from "@/components/Franja";
import { cn } from "cn";
import { CargandoDiscos } from "@/components/Cargando";

// "26 oct": el día y el mes corto, sin pasar por la zona horaria.
function corta(iso: string): string {
  return new Date(`${iso.slice(0, 10)}T00:00:00Z`)
    .toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" })
    .replace(".", "");
}

// "26 oct – 1 nov" si ya cerró, o "Desde el 26 oct" si sigue abierta.
function fechas(inicio: string, cierre: string | null): string {
  return cierre ? `${corta(inicio)} – ${corta(cierre)}` : `Desde el ${corta(inicio)}`;
}

export default function RutinaView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [rutina, setRutina] = useState<RoutineDetail | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    apiFetch(`/routines/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setRutina(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id]);

  return (
    <main className="flex flex-1 flex-col">
      {/* Franja con el botón Volver y el nombre (decisión 77). */}
      <Franja
        compacta
        aros="rojo"
        volver={{ href: "/rutinas" }}
        titulo={rutina ? nombreCorto(rutina.name) : "Rutina"}
      />
      <div className="mx-auto w-full max-w-xl px-4 pt-5">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!rutina && !error && <CargandoDiscos />}
      {rutina && (
        <>
          {/* Los datos de la rutina como etiquetas, para que no se confunda con la lista de rutinas. */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              !nombreDiceElObjetivo(rutina.name, rutina.goal) && goalText[rutina.goal],
              rutina.level.charAt(0).toUpperCase() + rutina.level.slice(1),
            ]
              .filter(Boolean)
              .map((t) => (
                <span key={String(t)} className="rounded-full bg-card px-3 py-1 text-sm">
                  {t}
                </span>
              ))}
          </div>
          {/* Las semanas como tarjetas, de la más nueva a la más vieja: el título con su etiqueta de estado, las fechas, la etiqueta de estado y los discos de los días. */}
          <ul className="m-0 mt-5 grid list-none gap-2.5 p-0">
            {rutina.weeks.map((s) => {
              const enCurso = s.status === "active";
              const completada = s.status === "closed";
              return (
                <li key={s.id}>
                  <Link
                    href={`/semanas/${s.id}`}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border-2 border-transparent bg-card px-4 py-3.5 no-underline hover:bg-muted",
                      enCurso && "border-disco-tinta",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-heading text-[1.35rem] leading-tight font-bold">Semana {s.number}</span>
                        {(enCurso || completada) && (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
                              enCurso ? "bg-disco-amarillo text-disco-tinta" : "bg-disco-verde/15 text-disco-verde-texto",
                            )}
                          >
                            {completada && <Check className="size-3.5" aria-hidden="true" />}
                            {enCurso ? "En curso" : "Completada"}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 block text-sm text-muted-foreground">{fechas(s.week_start, s.closed_at)}</span>
                      <span className="mt-2 block">
                        <DiscosSemana estados={s.day_states} />
                      </span>
                    </span>
                    <ChevronRight className="size-6 shrink-0 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              );
            })}
          </ul>
        </>
      )}
      </div>
    </main>
  );
}
