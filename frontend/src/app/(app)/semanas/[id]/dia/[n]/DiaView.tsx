"use client";

import { Check, ChevronDown, LockOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { Disco } from "@/components/Disco";
import { DoneControl } from "@/components/DoneControl";
import { Flecha } from "@/components/Flecha";
import { Resumen } from "@/components/ExerciseRow";
import { SemanaPasada } from "@/components/SemanaPasada";
import { SetRow } from "@/components/SetRow";
import { readError, type DayDetail, type ExerciseItem, type SetItem, type WeekDetail, apiFetch } from "@/lib/api";
import { estaHecho, summarize } from "@/lib/format";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Franja } from "@/components/Franja";
import { CargandoDiscos } from "@/components/Cargando";

export default function DiaView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; n: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  const { id, n } = use(params);
  // Desde Rutinas el día es para mirar (decisión 53): no se registra ni se cierra; eso es en Entrenar.
  const desdeRutinas = use(searchParams).desde === "rutinas";
  const [dia, setDia] = useState<DayDetail | null>(null);
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  // La tarjeta desplegada (una por vez), o null si están todas cerradas.
  const [abierta, setAbierta] = useState<number | null>(null);
  const router = useRouter();
  // Los días de la semana (para pasar al anterior o al siguiente sin volver a la lista).
  const [dias, setDias] = useState<WeekDetail["days"]>([]);

  useEffect(() => {
    // Al cambiar de día se vacía lo anterior: no queda a la vista el día que se dejó.
    setDia(null);
    setAbierta(null);
    setError("");
    apiFetch(`/weeks/${id}/days/${n}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setDia(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id, n]);

  useEffect(() => {
    apiFetch(`/weeks/${id}`)
      .then(async (res) => {
        if (res.ok) setDias(((await res.json()) as WeekDetail).days);
      })
      .catch(() => {});
  }, [id]);

  // Ir a otro día de la misma semana, manteniendo "solo para mirar" si se llegó desde Rutinas.
  function irAlDia(numero: number) {
    router.push(`/semanas/${id}/dia/${numero}${desdeRutinas ? "?desde=rutinas" : ""}`);
  }

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

  // Al marcar, reabrir o deshacer un ejercicio, el backend devuelve el ejercicio entero.
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
  // Se registra y se cierra solo en la semana activa y llegando desde Entrenar.
  const editable = activa && !desdeRutinas;
  // El ejercicio en curso (el primero sin hacer) lleva un borde, solo mientras se puede registrar.
  const enCurso = dia && editable && !completado ? dia.exercises.findIndex((e) => !estaHecho(e)) : -1;

  const cuerpo = (
    <>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!dia && !error && <CargandoDiscos />}
      {dia && dias.length > 1 && (
        <div className="mt-3 flex items-center gap-2" role="navigation" aria-label="Días de la semana">
          {(() => {
            const actual = dias.findIndex((d) => d.day_index === dia.day_index);
            return (
              <>
                <Flecha
                  direccion="anterior"
                  que="Día"
                  visible={actual > 0}
                  nombre={dias[actual - 1]?.title}
                  onClick={() => irAlDia(dias[actual - 1].day_index)}
                />
                {dias.map((d, i) => (
                  <span
                    key={d.day_index}
                    aria-hidden="true"
                    className={cn("h-1.5 flex-1 rounded-full", i === actual ? "bg-disco-tinta" : "bg-border")}
                  />
                ))}
                <Flecha
                  direccion="siguiente"
                  que="Día"
                  visible={actual >= 0 && actual < dias.length - 1}
                  nombre={dias[actual + 1]?.title}
                  onClick={() => irAlDia(dias[actual + 1].day_index)}
                />
              </>
            );
          })()}
        </div>
      )}
      {dia && (
        <>
          {/* grid-cols-1 limita la columna al ancho de la pantalla: sin eso, el texto cortado de la
              entrada en calor (en una sola línea) la estira y las tarjetas se desbordan. */}
          <ol className="m-0 mt-4 grid list-none grid-cols-1 gap-2.5 p-0">
            {dia.mobility_notes && (
              <TarjetaCalor
                texto={dia.mobility_notes}
                abierta={abierta === CALOR}
                onAlternar={() => setAbierta((a) => (a === CALOR ? null : CALOR))}
              />
            )}
            {dia.exercises.map((e, i) => (
              <TarjetaEjercicio
                key={i}
                exercise={e}
                dia={dia}
                registra={editable && !completado}
                abierta={abierta === i}
                onAlternar={() => setAbierta((a) => (a === i ? null : i))}
                enCurso={i === enCurso}
                onSerieGuardada={serieGuardada}
                onEjercicioCambiado={ejercicioCambiado}
              />
            ))}
          </ol>
          {editable && (
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
                  size="xl"
                  className="w-full"
                  type="button"
                  onClick={() => cambiarDia("complete")}
                  disabled={trabajando}
                >
                  Día completado
                </Button>
              )}
            </section>
          )}
          {/* Con la semana cerrada o desde Rutinas, el mismo cierre pero sin candado: solo se mira. */}
          {!editable && (
            <section className="mt-6">
              <span className={cn("font-heading text-2xl font-bold", !completado && "text-muted-foreground")}>
                {completado ? "Día completado" : "Día sin completar"}
              </span>
              {activa && !completado && (
                <p className="mt-1 mb-0">
                  <small className="text-muted-foreground">
                    Para registrarlo, andá a <Link href="/entrenar">Entrenar</Link>.
                  </small>
                </p>
              )}
            </section>
          )}
          <p>
            <small className="text-muted-foreground">Los pesos son orientativos. La app no da consejo médico.</small>
          </p>
        </>
      )}
    </>
  );

  // Siempre lleva la franja con el botón Volver (decisión 79): amarilla si se llega desde Entrenar
  // (vuelve a Entrenar) y roja si es desde Rutinas, para mirar (vuelve a la semana). Solo el modo
  // entrenar, que se abre con "Empezar día", va sin franja.
  return (
    <main className="flex flex-1 flex-col">
      <Franja
        compacta
        aros={desdeRutinas ? "rojo" : "amarillo"}
        volver={{ href: desdeRutinas ? `/semanas/${id}` : "/entrenar" }}
        titulo={`Día ${n}`}
        subtitulo={dia ? `${dia.title} · ~${dia.minutes} min` : undefined}
      />
      <div className="mx-auto w-full max-w-xl px-4 pt-5">{cuerpo}</div>
    </main>
  );
}

// La entrada en calor (`mobility_notes`) como la primera tarjeta de la lista (decisión 56): se
// despliega igual que un ejercicio, pero solo con el texto; no tiene series ni cuenta como hecha.
const CALOR = -1;

function TarjetaCalor({ texto, abierta, onAlternar }: { texto: string; abierta: boolean; onAlternar: () => void }) {
  return (
    <li className="rounded-2xl border-2 border-transparent bg-card">
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierta}
        aria-controls="entrada-en-calor"
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-[1.35rem] leading-tight font-bold">Entrada en calor</span>
          {!abierta && (
            <span className="block truncate font-heading text-lg leading-tight font-semibold text-muted-foreground">
              {texto}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn("size-6 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", abierta && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {abierta && (
        <p id="entrada-en-calor" className="m-0 px-4 pb-4">
          {texto}
        </p>
      )}
    </li>
  );
}

// Un ejercicio en la lista del día (decisión 47): cerrada, solo el nombre grande, los números y,
// en el que está en curso, los discos. Tocarla la despliega ahí mismo (una por vez) con lo
// demás: las series (disco para marcar y lápiz para corregir), semana pasada, cómo hacerlo, por
// qué y los botones del ejercicio. El modo entrenar se abre con "Empezar día N" desde Entrenar.
function TarjetaEjercicio({
  exercise,
  dia,
  registra,
  abierta,
  onAlternar,
  enCurso,
  onSerieGuardada,
  onEjercicioCambiado,
}: {
  exercise: ExerciseItem;
  dia: DayDetail;
  registra: boolean;
  abierta: boolean;
  onAlternar: () => void;
  enCurso: boolean;
  onSerieGuardada: (s: SetItem) => void;
  onEjercicioCambiado: (e: ExerciseItem) => void;
}) {
  const hecho = estaHecho(exercise);
  // Las series se registran con el día abierto y el ejercicio sin cerrar.
  const seriesAbiertas = registra && !hecho;
  const idDetalle = `ejercicio-${exercise.id ?? exercise.name}`;

  return (
    <li
      className={cn(
        "rounded-2xl border-2 border-transparent bg-card",
        enCurso && "border-disco-tinta",
        registra && hecho && !abierta && "bg-card/60",
      )}
    >
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierta}
        aria-controls={idDetalle}
        className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="min-w-0 flex-1">
          <span className="block font-heading text-[1.35rem] leading-tight font-bold">{exercise.name}</span>
          <Resumen
            texto={summarize(exercise)}
            className={cn("font-heading text-lg leading-tight font-semibold", !enCurso && !abierta && "text-muted-foreground")}
          />
          {enCurso && !abierta && (
            <span className="mt-1.5 flex gap-1.5" aria-hidden="true">
              {exercise.sets.map((s, i) => (
                <Disco key={i} estado={s.real ? "hecho" : "pendiente"} className="size-6">
                  {i + 1}
                </Disco>
              ))}
            </span>
          )}
        </span>
        {registra && hecho && (
          <Disco estado="hecho" className="size-7">
            <Check className="size-4" aria-label="Hecho" />
          </Disco>
        )}
        <ChevronDown
          className={cn("size-6 shrink-0 text-muted-foreground transition-transform motion-reduce:transition-none", abierta && "rotate-180")}
          aria-hidden="true"
        />
      </button>

      {abierta && (
        <div id={idDetalle} className="px-4 pb-4">
          <ul className="m-0 list-none p-0">
            {exercise.sets.map((s, i) => (
              <SetRow
                key={i}
                kind={exercise.kind}
                index={i}
                set={s}
                edit={
                  seriesAbiertas
                    ? { weekId: dia.week_id, dayIndex: dia.day_index, onSaved: onSerieGuardada }
                    : undefined
                }
              />
            ))}
          </ul>
          <SemanaPasada ejercicio={exercise} />
          {exercise.execution_notes && (
            <details className="border-t border-border py-1">
              <summary className="cursor-pointer py-1.5 font-medium">Cómo hacerlo</summary>
              <p className="mt-0 mb-2 text-sm">{exercise.execution_notes}</p>
            </details>
          )}
          {exercise.reason && (
            <details className="border-t border-border py-1">
              <summary className="cursor-pointer py-1.5 font-medium">Por qué está en tu rutina</summary>
              <p className="mt-0 mb-2 text-sm">{exercise.reason}</p>
            </details>
          )}
          {registra && (
            <div className="mt-2 flex justify-end">
              <DoneControl
                exercise={exercise}
                edit={{ weekId: dia.week_id, dayIndex: dia.day_index, onChanged: onEjercicioCambiado }}
              />
            </div>
          )}
        </div>
      )}
    </li>
  );
}
