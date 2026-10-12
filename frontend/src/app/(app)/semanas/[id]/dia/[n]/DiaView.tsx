"use client";

import { LockOpen } from "lucide-react";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { ExerciseRow } from "@/components/ExerciseRow";
import { readError, type DayDetail, type ExerciseItem, type SetItem, apiFetch } from "@/lib/api";
import { estaHecho } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";

export default function DiaView({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = use(params);
  const [dia, setDia] = useState<DayDetail | null>(null);
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);

  useEffect(() => {
    apiFetch(`/weeks/${id}/days/${n}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setDia(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id, n]);

  // Al guardar una serie, el backend devuelve esa serie actualizada: se reemplaza en pantalla.
  function serieGuardada(updated: SetItem) {
    setDia((actual) =>
      actual
        ? {
            ...actual,
            exercises: actual.exercises.map((e) => ({
              ...e,
              sets: e.sets.map((s) => (s.id === updated.id ? updated : s)),
            })),
          }
        : actual,
    );
  }

  // Al marcar o deshacer un ejercicio, el backend devuelve el ejercicio entero actualizado.
  function ejercicioCambiado(updated: ExerciseItem) {
    setDia((actual) =>
      actual
        ? { ...actual, exercises: actual.exercises.map((e) => (e.id === updated.id ? updated : e)) }
        : actual,
    );
  }

  async function cambiarDia(accion: "complete" | "reopen") {
    if (!dia) return;
    setError("");
    setTrabajando(true);
    try {
      const res = await apiFetch(`/weeks/${dia.week_id}/days/${dia.day_index}/${accion}`, {
        method: "POST",
      });
      if (res.ok) {
        const estado = await res.json();
        setDia((actual) => (actual ? { ...actual, finished_at: estado.finished_at } : actual));
      } else {
        setError(await readError(res));
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setTrabajando(false);
  }

  // Solo se registra en la semana activa; las cerradas quedan en lectura.
  const activa = dia?.week_status === "active";
  const completado = dia?.finished_at != null;
  const edit =
    dia && activa
      ? {
          weekId: dia.week_id,
          dayIndex: dia.day_index,
          locked: completado,
          onSetSaved: serieGuardada,
          onExerciseChanged: ejercicioCambiado,
        }
      : undefined;
  const hechos = dia ? dia.exercises.filter(estaHecho).length : 0;
  // El ejercicio en curso (el primero sin hacer) lleva un borde, solo mientras se puede registrar.
  const enCurso = dia && activa && !completado ? dia.exercises.findIndex((e) => !estaHecho(e)) : -1;

  return (
    <main className="mx-auto max-w-xl px-4 pt-6">
      <BackButton href={`/semanas/${id}`}>
        ← {dia ? `Semana ${dia.week_number}` : "Volver a la semana"}
      </BackButton>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!dia && !error && <p>Cargando...</p>}
      {dia && (
        <>
          <h1 className="mb-0 text-6xl">Día {dia.day_index}</h1>
          <p className="mt-1 text-muted-foreground">
            {dia.title} · ~{dia.minutes} min
          </p>
          {activa && (
            <div className="mb-4">
              <p className="mb-1 text-sm text-muted-foreground">
                {hechos} de {dia.exercises.length} ejercicios hechos
              </p>
              <div
                role="progressbar"
                aria-label="Ejercicios hechos"
                aria-valuemin={0}
                aria-valuemax={dia.exercises.length}
                aria-valuenow={hechos}
                className="h-2 overflow-hidden rounded-full bg-border"
              >
                <div
                  className="h-full rounded-full bg-disco-rojo transition-[width] motion-reduce:transition-none"
                  style={{ width: `${(hechos / Math.max(dia.exercises.length, 1)) * 100}%` }}
                />
              </div>
            </div>
          )}
          {dia.mobility_notes && <p className="text-sm">Movilidad: {dia.mobility_notes}</p>}
          <ol className="m-0 mt-4 grid gap-3 p-0">
            {dia.exercises.map((e, i) => (
              <ExerciseRow key={i} exercise={e} edit={edit} enCurso={i === enCurso} />
            ))}
          </ol>
          {activa && (
            <section className="mt-6">
              {completado ? (
                <div className="flex items-center gap-3">
                  <span className="flex-1 font-heading text-2xl font-bold">Día completado</span>
                  <Button
                    size="icon-lg"
                    variant="outline"
                    type="button"
                    onClick={() => cambiarDia("reopen")}
                    disabled={trabajando}
                    aria-label={`Reabrir el día ${dia.day_index}`}
                  >
                    <LockOpen />
                  </Button>
                </div>
              ) : (
                <Button
                  size="lg"
                  className="h-11 w-full text-base"
                  type="button"
                  onClick={() => cambiarDia("complete")}
                  disabled={trabajando}
                >
                  Día completado
                </Button>
              )}
            </section>
          )}
          <p>
            <small className="text-muted-foreground">Los pesos son orientativos. La app no da consejo médico.</small>
          </p>
        </>
      )}
    </main>
  );
}
