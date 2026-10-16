"use client";

import { ChevronRight, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { readError, type Routine, apiFetch } from "@/lib/api";
import { goalText, nombreDiceElObjetivo } from "@/lib/format";
import { DiscosSemana } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { IconoObjetivo } from "@/components/IconoObjetivo";
import { NuevaRutina } from "@/components/NuevaRutina";
import { Button } from "@/components/ui/button";
import { CargandoDiscos } from "@/components/Cargando";

export default function MisRutinasPage() {
  const [rutinas, setRutinas] = useState<Routine[] | null>(null);
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
      {/* Franja oscura como la de Inicio y Perfil, con los aros asomando (decisión 77). */}
      <section className="relative overflow-hidden bg-primary px-4 pt-8 pb-7 text-primary-foreground">
        <div className="relative z-10 mx-auto max-w-xl">
          <h1 className="my-0 text-5xl">Tus rutinas</h1>
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full border-[18px] border-disco-rojo"
        />
      </section>

      <div className="mx-auto w-full max-w-xl px-4 pt-5">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!rutinas && !error && <CargandoDiscos />}
      {rutinas && rutinas.length === 0 && (
        <p className="text-muted-foreground">
          Todavía no tenés rutinas. Creá la primera con el botón «+» de abajo: la IA la arma según tu nivel y tu
          objetivo.
        </p>
      )}
      {rutinas && rutinas.length > 0 && (
        <ul className="m-0 grid list-none gap-3 p-0">
          {rutinas.map((r) => (
            <li key={r.id}>
              <Link
                href={`/rutinas/${r.id}`}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 no-underline hover:bg-muted"
              >
                {/* El aro del ícono dice el estado: rojo = en curso, gris = lista para continuar (decisión 77). */}
                <IconoObjetivo objetivo={r.goal} tamano="md" aro={r.has_active_week ? "rojo" : "gris"} />
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-heading text-2xl leading-tight font-bold">{r.name}</span>
                  <span className="truncate text-sm text-muted-foreground">
                    {[
                      !nombreDiceElObjetivo(r.name, r.goal) && goalText[r.goal],
                      r.level,
                      `${r.week_count} ${r.week_count === 1 ? "semana" : "semanas"}`,
                      !r.has_active_week && "lista para continuar",
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                  {r.has_active_week && <span className="sr-only">en curso</span>}
                </span>
                {/* Los discos son los de la semana más nueva: la que está en curso, o la última cerrada. */}
                {r.last_week_day_states.length > 0 && <DiscosSemana estados={r.last_week_day_states} />}
                <ChevronRight className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {/* "Nueva rutina": botón redondo flotante abajo a la derecha, sobre la barra de navegación (su alto
          más su borde), siempre a la vista y a mano del pulgar. */}
      {rutinas && (
        <NuevaRutina hayActiva={rutinas.some((r) => r.has_active_week)}>
          {(abrir) => (
            <Button
              type="button"
              size="icon-lg"
              onClick={abrir}
              aria-label="Nueva rutina"
              className="fixed right-4 bottom-[calc(var(--alto-barra)+1px+1rem+env(safe-area-inset-bottom))] z-30 size-14 rounded-full shadow-lg"
            >
              <Plus className="size-6" aria-hidden="true" />
            </Button>
          )}
        </NuevaRutina>
      )}
      </div>
    </main>
  );
}
