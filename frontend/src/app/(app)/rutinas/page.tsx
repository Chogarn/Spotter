"use client";

import { Plus } from "lucide-react";
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
    <main className="mx-auto max-w-xl px-4 pt-8 pb-24">
      <h1 className="mt-0 mb-4">Tus rutinas</h1>
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
                className="block rounded-2xl bg-card p-4 no-underline hover:bg-muted"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="flex min-w-0 items-center gap-3">
                    <IconoObjetivo objetivo={r.goal} />
                    <span className="font-heading text-2xl font-bold">{r.name}</span>
                  </span>
                  {/* Sin semana activa, la rutina queda "lista para continuar": se puede seguir al generar. */}
                  {r.has_active_week ? (
                    <span className="shrink-0 rounded-full bg-disco-rojo px-2.5 py-0.5 text-xs font-medium text-white">
                      en curso
                    </span>
                  ) : (
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                      lista para continuar
                    </span>
                  )}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {[
                    !nombreDiceElObjetivo(r.name, r.goal) && goalText[r.goal],
                    r.level,
                    `${r.week_count} ${r.week_count === 1 ? "semana" : "semanas"}`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
                {r.last_week_day_states.length > 0 && (
                  <span className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    {/* Los discos son los de la semana más nueva: la que está en curso, o la última cerrada. */}
                    {r.has_active_week ? "Semana en curso" : "Última semana"}
                    <DiscosSemana estados={r.last_week_day_states} />
                  </span>
                )}
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
    </main>
  );
}
