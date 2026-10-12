"use client";

import { Check, ChevronRight, LockOpen } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { Disco } from "@/components/Disco";
import { Resumen } from "@/components/ExerciseRow";
import { readError, type DayDetail, type ExerciseItem, apiFetch } from "@/lib/api";
import { estaHecho, summarize } from "@/lib/format";
import { cn } from "cn";
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
          <ol className="m-0 mt-4 grid list-none gap-2.5 p-0">
            {dia.exercises.map((e, i) => (
              <TarjetaEjercicio
                key={i}
                exercise={e}
                href={`/semanas/${id}/dia/${n}/entrenar?ejercicio=${i + 1}`}
                enCurso={i === enCurso}
                hecho={activa && estaHecho(e)}
              />
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

// Un ejercicio en la lista del día (decisión 47): solo el nombre grande, los números y, en el que
// está en curso, los discos de sus series. Tocarla entra al ejercicio, donde está el detalle.
function TarjetaEjercicio({
  exercise,
  href,
  enCurso,
  hecho,
}: {
  exercise: ExerciseItem;
  href: string;
  enCurso: boolean;
  hecho: boolean;
}) {
  return (
    <li>
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-2xl border-2 border-transparent bg-card px-4 py-3 no-underline hover:bg-muted",
          enCurso && "border-disco-tinta",
          hecho && "bg-card/60",
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-[1.35rem] leading-tight font-bold">{exercise.name}</span>
          <Resumen
            texto={summarize(exercise)}
            className={cn("font-heading text-lg leading-tight font-semibold", !enCurso && "text-muted-foreground")}
          />
          {enCurso && (
            <span className="mt-1.5 flex gap-1.5" aria-hidden="true">
              {exercise.sets.map((s, i) => (
                <Disco key={i} estado={s.real ? "hecho" : "pendiente"} className="size-6">
                  {i + 1}
                </Disco>
              ))}
            </span>
          )}
        </span>
        {hecho ? (
          <Disco estado="hecho" className="size-7">
            <Check className="size-4" aria-label="Hecho" />
          </Disco>
        ) : (
          <ChevronRight className="size-6 text-muted-foreground" aria-hidden="true" />
        )}
      </Link>
    </li>
  );
}
