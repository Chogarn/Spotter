"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { readError, type Routine, apiFetch } from "@/lib/api";
import { goalText, nombreDiceElObjetivo } from "@/lib/format";
import { DiscosSemana } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { GenerarRutina } from "@/components/GenerarRutina";
import { IconoObjetivo } from "@/components/IconoObjetivo";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
    <main className="mx-auto max-w-xl px-4 pt-8">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="my-0">Tus rutinas</h1>
        {rutinas && <NuevaRutina hayActiva={rutinas.some((r) => r.has_active_week)} />}
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!rutinas && !error && <CargandoDiscos />}
      {rutinas && rutinas.length === 0 && (
        <p className="text-muted-foreground">
          Todavía no tenés rutinas. Creá la primera con «Nueva rutina»: la IA la arma según tu nivel y tu
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
    </main>
  );
}

// "Nueva rutina" (decisión 50): la IA arma una rutina nueva (nivel y objetivo). Con una semana
// activa no se puede generar: el botón se ve igual y explica que primero hay que cerrarla.
function NuevaRutina({ hayActiva }: { hayActiva: boolean }) {
  const [avisando, setAvisando] = useState(false);
  if (!hayActiva) {
    return (
      <div className="flex flex-col items-end">
        <GenerarRutina etiqueta="Nueva rutina" soloNueva />
      </div>
    );
  }
  return (
    <>
      <Button type="button" onClick={() => setAvisando(true)}>
        Nueva rutina
      </Button>
      <AlertDialog open={avisando} onOpenChange={setAvisando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tenés una semana en curso</AlertDialogTitle>
            <AlertDialogDescription>
              Para empezar una rutina nueva, primero cerrá la semana en curso desde Entrenar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button nativeButton={false} render={<Link href="/entrenar" />}>
              Ir a Entrenar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
