"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { readError, type RoutineDetail, apiFetch } from "@/lib/api";
import { goalText, nombreCorto, nombreDiceElObjetivo, statusText } from "@/lib/format";
import { DiscosSemana } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Franja } from "@/components/Franja";
import { cn } from "cn";
import { CargandoDiscos } from "@/components/Cargando";

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
          {/* Las semanas como tarjetas, de la más nueva a la más vieja. El estado lo dice el borde (oscuro
              = en curso) y los discos; el texto es para lectores de pantalla. */}
          <ul className="m-0 mt-5 grid list-none gap-2.5 p-0">
            {rutina.weeks.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/semanas/${s.id}`}
                  className={cn(
                    "flex items-center gap-3 rounded-2xl border-2 border-transparent bg-card px-4 py-3 no-underline hover:bg-muted",
                    s.status === "active" && "border-disco-tinta",
                  )}
                >
                  <span className="flex-1">
                    <span className="block font-heading text-[1.35rem] leading-tight font-bold">
                      Semana {s.number}
                      <span className="sr-only">
                        , {s.status === "active" ? "en curso" : s.status === "closed" ? "completada" : statusText[s.status]}
                      </span>
                    </span>
                    <span className="mt-2 block">
                      <DiscosSemana estados={s.day_states} />
                    </span>
                  </span>
                  <ChevronRight className="size-6 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
      </div>
    </main>
  );
}
