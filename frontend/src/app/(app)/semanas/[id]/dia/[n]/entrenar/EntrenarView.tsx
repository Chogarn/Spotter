"use client";

import { Pencil, X } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { Disco } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SetRow } from "@/components/SetRow";
import { Button } from "@/components/ui/button";
import { readError, type DayDetail, type ExerciseItem, type SetItem, apiFetch } from "@/lib/api";
import { differsFromPlan, estaHecho, realAsSet, setText, summarize } from "@/lib/format";
import { cn } from "cn";

// Dónde va el usuario: el ejercicio y la serie que se muestran en grande.
type Posicion = { ej: number; serie: number };

// La primera serie sin registrar del ejercicio; si están todas, la última (falta cerrarlo).
function serieInicial(ejercicio: ExerciseItem): number {
  const libre = ejercicio.sets.findIndex((s) => !s.real);
  return libre === -1 ? ejercicio.sets.length - 1 : libre;
}

// El próximo ejercicio sin hacer, empezando después de `desde` y dando la vuelta. Null si no queda.
function proximoEjercicio(dia: DayDetail, desde: number): number | null {
  const total = dia.exercises.length;
  for (let paso = 1; paso <= total; paso++) {
    const i = (desde + paso) % total;
    if (!estaHecho(dia.exercises[i])) return i;
  }
  return null;
}

function posicionInicial(dia: DayDetail): Posicion | null {
  const ej = dia.exercises.findIndex((e) => !estaHecho(e));
  return ej === -1 ? null : { ej, serie: serieInicial(dia.exercises[ej]) };
}

// Modo entrenar (#57): un ejercicio a la vez, con la serie que toca en grande. Todo se guarda
// al tocar, con los mismos endpoints que la vista del día; por eso salir y volver retoma donde
// quedó (la posición se calcula con lo guardado).
export default function EntrenarView({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = use(params);
  const [dia, setDia] = useState<DayDetail | null>(null);
  const [pos, setPos] = useState<Posicion | null>(null);
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [corrigiendo, setCorrigiendo] = useState(false);

  useEffect(() => {
    apiFetch(`/weeks/${id}/days/${n}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        const leido: DayDetail = await res.json();
        setDia(leido);
        setPos(posicionInicial(leido));
      })
      .catch((e) => setError(e.message));
  }, [id, n]);

  const volver = `/semanas/${id}/dia/${n}`;

  if (error && !dia) {
    return (
      <main className="mx-auto max-w-xl px-4 pt-6">
        <ErrorMessage>{error}</ErrorMessage>
        <Button variant="outline" nativeButton={false} render={<Link href={volver} />}>
          Volver al día
        </Button>
      </main>
    );
  }
  if (!dia) return <main className="mx-auto max-w-xl px-4 pt-6">Cargando...</main>;

  // El modo solo existe en la semana activa y con el día abierto.
  if (dia.week_status !== "active" || dia.finished_at !== null) {
    return (
      <main className="mx-auto max-w-xl px-4 pt-6">
        <h1>Día {dia.day_index}</h1>
        <p className="text-muted-foreground">
          {dia.week_status !== "active"
            ? "Esta semana está cerrada: solo se puede mirar."
            : "Este día ya está completado. Para cambiar algo, reabrilo desde el día."}
        </p>
        <Button variant="outline" nativeButton={false} render={<Link href={volver} />}>
          Ir al día
        </Button>
      </main>
    );
  }

  const actual = dia;

  // Reemplaza en pantalla lo que devuelve el backend (una serie o un ejercicio entero).
  function conSerie(d: DayDetail, updated: SetItem): DayDetail {
    return {
      ...d,
      exercises: d.exercises.map((e) => ({
        ...e,
        sets: e.sets.map((s) => (s.id === updated.id ? updated : s)),
      })),
    };
  }
  function conEjercicio(d: DayDetail, updated: ExerciseItem): DayDetail {
    return { ...d, exercises: d.exercises.map((e) => (e.id === updated.id ? updated : e)) };
  }

  // Un POST sobre el día; si falla, deja el mensaje y devuelve null.
  async function llamar<T>(ruta: string): Promise<T | null> {
    const res = await apiFetch(`/weeks/${actual.week_id}/days/${actual.day_index}${ruta}`, {
      method: "POST",
    });
    if (!res.ok) {
      setError(await readError(res));
      return null;
    }
    return res.json();
  }

  // Cierra el ejercicio y pasa al siguiente sin hacer (o al final, si no queda ninguno).
  async function terminarEjercicio(d: DayDetail, ej: number) {
    const ejercicio = await llamar<ExerciseItem>(`/exercises/${d.exercises[ej].id}/done`);
    if (!ejercicio) return;
    const nuevo = conEjercicio(d, ejercicio);
    setDia(nuevo);
    const siguiente = proximoEjercicio(nuevo, ej);
    setPos(siguiente === null ? null : { ej: siguiente, serie: serieInicial(nuevo.exercises[siguiente]) });
  }

  // El botón grande: marca la serie, pasa a la siguiente o cierra el ejercicio, según toque.
  async function avanzar() {
    if (!pos) return;
    setError("");
    setTrabajando(true);
    try {
      let d = actual;
      const serie = d.exercises[pos.ej].sets[pos.serie];
      if (!serie.real) {
        const guardada = await llamar<SetItem>(`/sets/${serie.id}/done`);
        if (!guardada) return;
        d = conSerie(d, guardada);
        setDia(d);
      }
      const ejercicio = d.exercises[pos.ej];
      const libre = ejercicio.sets.findIndex((s) => !s.real);
      if (libre === -1) await terminarEjercicio(d, pos.ej);
      else setPos({ ej: pos.ej, serie: libre });
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setTrabajando(false);
    }
  }

  async function completarDia() {
    setError("");
    setTrabajando(true);
    try {
      const estado = await llamar<{ finished_at: string | null }>(`/complete`);
      if (estado) setDia({ ...actual, finished_at: estado.finished_at });
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setTrabajando(false);
    }
  }

  const total = actual.exercises.length;

  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Día {actual.day_index}
          {pos && ` · ejercicio ${pos.ej + 1} de ${total}`}
        </span>
        <Button size="icon-lg" variant="ghost" nativeButton={false} render={<Link href={volver} />} aria-label="Salir del modo entrenar">
          <X />
        </Button>
      </div>
      {/* Una barra por ejercicio: rojo hecho, tinta el actual. Tocar una sin hacer salta a ese ejercicio. */}
      <div className="mt-1 mb-4 flex gap-1">
        {actual.exercises.map((e, i) => (
          <button
            key={i}
            type="button"
            disabled={estaHecho(e) || trabajando}
            onClick={() => {
              setCorrigiendo(false);
              setPos({ ej: i, serie: serieInicial(e) });
            }}
            aria-label={`Ir a ${e.name}`}
            className={cn(
              "h-2 flex-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              estaHecho(e) ? "bg-disco-rojo" : pos?.ej === i ? "bg-disco-tinta" : "bg-border",
            )}
          />
        ))}
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {pos ? (
        <SerieActual
          dia={actual}
          pos={pos}
          trabajando={trabajando}
          corrigiendo={corrigiendo}
          onIrASerie={(serie) => {
            setCorrigiendo(false);
            setPos({ ej: pos.ej, serie });
          }}
          onCorregir={() => setCorrigiendo(true)}
          onTerminarCorreccion={() => setCorrigiendo(false)}
          onSerieGuardada={(s) => setDia((d) => (d ? conSerie(d, s) : d))}
          onAvanzar={avanzar}
        />
      ) : (
        <section className="rounded-2xl bg-card p-5">
          {actual.finished_at === null ? (
            <>
              <h1 className="mt-0 text-4xl">Terminaste los {total} ejercicios</h1>
              <p className="text-muted-foreground">Cerrá el día para que cuente como hecho.</p>
              <Button size="lg" className="h-12 w-full text-base" type="button" onClick={completarDia} disabled={trabajando}>
                Día completado
              </Button>
            </>
          ) : (
            <>
              <h1 className="mt-0 text-4xl">Día completado</h1>
              <Button size="lg" className="h-12 w-full text-base" nativeButton={false} render={<Link href="/" />}>
                Ir a Entrenar
              </Button>
            </>
          )}
        </section>
      )}
    </main>
  );
}

function SerieActual({
  dia,
  pos,
  trabajando,
  corrigiendo,
  onIrASerie,
  onCorregir,
  onTerminarCorreccion,
  onSerieGuardada,
  onAvanzar,
}: {
  dia: DayDetail;
  pos: Posicion;
  trabajando: boolean;
  corrigiendo: boolean;
  onIrASerie: (serie: number) => void;
  onCorregir: () => void;
  onTerminarCorreccion: () => void;
  onSerieGuardada: (s: SetItem) => void;
  onAvanzar: () => void;
}) {
  const ejercicio = dia.exercises[pos.ej];
  const serie = ejercicio.sets[pos.serie];
  const real = serie.real ?? null;
  const mostrada = real ? realAsSet(real) : serie;
  const todas = ejercicio.sets.every((s) => s.real);
  const boton = !real ? "Serie hecha" : todas ? "Terminar ejercicio" : "Siguiente serie";
  const siguiente = proximoEjercicio(dia, pos.ej);
  const anterior = ejercicio.previous;

  return (
    <>
      <h1 className="my-0 text-4xl">{ejercicio.name}</h1>
      <section className="mt-3 rounded-2xl bg-card p-5 text-center">
        <p className="m-0 text-sm text-muted-foreground">
          Serie {pos.serie + 1} de {ejercicio.sets.length}
          {real && " · hecha"}
        </p>
        <Medida kind={ejercicio.kind} serie={mostrada} />
        {real && differsFromPlan(serie, real) && (
          <p className="m-0 text-sm text-muted-foreground">tocaba {setText(ejercicio.kind, serie)}</p>
        )}
        {anterior && (
          <p className="mt-2 mb-0 text-sm text-muted-foreground">
            Semana pasada:{" "}
            {anterior[pos.serie] ? setText(ejercicio.kind, realAsSet(anterior[pos.serie]!)) : "sin registrar"}
          </p>
        )}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          {ejercicio.sets.map((s, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onIrASerie(i)}
              disabled={trabajando}
              aria-label={`Ir a la serie ${i + 1}`}
              aria-current={i === pos.serie ? "step" : undefined}
              className={cn(
                "rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                i === pos.serie && "ring-2 ring-disco-tinta ring-offset-2 ring-offset-card",
              )}
            >
              <Disco estado={s.real ? "hecho" : "pendiente"} className="size-9">
                {i + 1}
              </Disco>
            </button>
          ))}
        </div>
      </section>

      {corrigiendo ? (
        <ul className="mt-4 list-none rounded-2xl bg-card p-3">
          <SetRow
            key={`${pos.ej}-${pos.serie}`}
            kind={ejercicio.kind}
            index={pos.serie}
            set={serie}
            edit={{ weekId: dia.week_id, dayIndex: dia.day_index, onSaved: onSerieGuardada }}
            editarAlAbrir
            onTerminar={onTerminarCorreccion}
          />
        </ul>
      ) : (
        <div className="mt-4 flex gap-2">
          <Button
            size="icon-lg"
            variant="outline"
            className="size-12"
            type="button"
            onClick={onCorregir}
            disabled={trabajando}
            aria-label={`Corregir la serie ${pos.serie + 1}`}
          >
            <Pencil />
          </Button>
          <Button size="lg" className="h-12 flex-1 text-base" type="button" onClick={onAvanzar} disabled={trabajando}>
            {trabajando ? "Guardando..." : boton}
          </Button>
        </div>
      )}

      {siguiente !== null && siguiente !== pos.ej && (
        <p className="mt-4 rounded-xl bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Después:</span> {dia.exercises[siguiente].name} ·{" "}
          {summarize(dia.exercises[siguiente])}
        </p>
      )}
    </>
  );
}

// La serie en grande: repeticiones y kilos (en azul, el color de la carga), segundos o minutos.
function Medida({ kind, serie }: { kind: ExerciseItem["kind"]; serie: SetItem }) {
  const grande = "m-0 font-heading font-bold leading-none";
  if (kind === "cardio") return <p className={cn(grande, "my-2 text-7xl")}>{serie.duration_minutes} min</p>;
  if (kind === "isometric") return <p className={cn(grande, "my-2 text-7xl")}>{serie.duration_seconds} s</p>;
  return (
    <div className="my-2">
      <p className={cn(grande, "text-7xl")}>
        {serie.reps} <span className="text-3xl">reps</span>
      </p>
      {serie.target_weight_kg !== null && (
        <p className={cn(grande, "mt-1 text-4xl text-disco-azul")}>
          {serie.target_weight_kg.toLocaleString("es-AR")} kg
        </p>
      )}
    </div>
  );
}
