"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { cn } from "cn";
import { useEffect, useState } from "react";

import { readError, type Routine, apiFetch } from "@/lib/api";
import { nombreCorto } from "@/lib/format";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Franja } from "@/components/Franja";
import { IconoObjetivo } from "@/components/IconoObjetivo";
import { InfoRutina } from "@/components/InfoRutina";
import { CargandoDiscos } from "@/components/Cargando";

export default function MisRutinasPage() {
  const [rutinas, setRutinas] = useState<Routine[] | null>(null);
  // La rutina "activa" es la que se está haciendo: la más reciente con semanas, aunque su semana ya
  // esté cerrada (es la que se continúa, como en Inicio).
  const actualId = rutinas?.find((r) => r.week_count > 0)?.id ?? null;
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/routines`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setRutinas(await res.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main className="flex flex-1 flex-col pb-24">
      <Franja titulo="Tus rutinas" aros="rojo" />

      <div className="mx-auto w-full max-w-xl px-4 pt-5">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!rutinas && !error && <CargandoDiscos />}
      {rutinas && rutinas.length === 0 && (
        <p className="text-muted-foreground">
          Todavía no tenés rutinas. Creá la primera desde Inicio: la IA la arma según tu nivel y tu objetivo.
        </p>
      )}
      {rutinas && rutinas.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-1 gap-3 p-0">
          {rutinas.map((r) => (
            <li key={r.id} className="relative min-w-0">
              <Link
                href={`/rutinas/${r.id}`}
                className={cn(
                  "flex min-h-[5.75rem] items-center gap-3 rounded-2xl border-2 border-transparent bg-card py-3 pr-14 pl-3 no-underline hover:bg-muted",
                  r.id === actualId && "border-disco-tinta",
                )}
              >
                {/* El aro del ícono dice el estado: rojo = con semana en curso, gris = sin semana en curso (decisión 77). */}
                <IconoObjetivo objetivo={r.goal} tamano="md" aro={r.has_active_week ? "rojo" : "gris"} />
                {/* El nombre y el nivel: el estado lo dice el aro del ícono y el resto (días, estructura) se ve en
                    el ⓘ o al entrar a la rutina. */}
                <span className="sr-only">
                  {r.name}
                  {r.id === actualId ? ", activa" : ", terminada"}
                </span>
                <span className="flex min-w-0 flex-1 flex-col" aria-hidden="true">
                  <span className="line-clamp-2 font-heading text-2xl leading-tight font-bold break-words">
                    {nombreCorto(r.name)}
                  </span>
                  <span className="mt-2 flex items-center gap-3 text-sm text-muted-foreground">
                    <span className="truncate">{r.level}</span>
                    {r.id === actualId ? (
                      <span className="shrink-0 rounded-full bg-disco-amarillo px-2.5 py-0.5 text-xs font-medium text-disco-tinta">
                        Activa
                      </span>
                    ) : (
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">Terminada</span>
                    )}
                  </span>
                </span>
                <ChevronRight className="absolute right-4 bottom-4 size-5 text-muted-foreground" aria-hidden="true" />
              </Link>
              {/* El ⓘ va arriba a la derecha, fuera del enlace, y abre todos los datos de la rutina. */}
              <InfoRutina rutina={r} activa={r.id === actualId} className="absolute top-2 right-3" />
            </li>
          ))}
        </ul>
      )}

      </div>
    </main>
  );
}
