"use client";

import { Pencil, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState, useTransition } from "react";

import { BotonDescanso, RelojCircular, useDescanso } from "@/components/Descanso";
import { Disco } from "@/components/Disco";
import { Flecha } from "@/components/Flecha";
import { DoneControl } from "@/components/DoneControl";
import { ErrorMessage } from "@/components/ErrorMessage";
import { SemanaPasada } from "@/components/SemanaPasada";
import { SetRow } from "@/components/SetRow";
import { Button } from "@/components/ui/button";
import { readError, type DayDetail, type ExerciseItem, type SetItem, apiFetch } from "@/lib/api";
import { differsFromPlan, estaHecho, realAsSet, setText, summarize } from "@/lib/format";
import { cn } from "cn";
import { Cargando } from "@/components/Cargando";

// Dónde va el usuario: el ejercicio y la serie que se muestran en grande.
type Posicion = { ej: number; serie: number };

// La entrada en calor (`mobility_notes`) va como un paso antes del primer ejercicio. No tiene
// series ni se guarda: no cuenta en los ejercicios hechos.
const CALOR = -1;

// Se da por hecha en cuanto hay algo registrado en el día.
function empezoElDia(dia: DayDetail): boolean {
  return dia.exercises.some((e) => estaHecho(e) || e.sets.some((s) => s.real));
}

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

// Dónde abrir: el ejercicio pedido (`?ejercicio=K`, desde la tarjeta del día); si no hay, la
// entrada en calor mientras el día no haya empezado, o el primero sin hacer. Null si no queda
// ninguno: se muestra el cierre del día.
function posicionInicial(dia: DayDetail, pedido: number | null, registra: boolean): Posicion | null {
  if (pedido !== null && pedido >= 0 && pedido < dia.exercises.length) {
    return { ej: pedido, serie: serieInicial(dia.exercises[pedido]) };
  }
  if (dia.mobility_notes && (!registra || !empezoElDia(dia))) return { ej: CALOR, serie: 0 };
  const ej = registra ? dia.exercises.findIndex((e) => !estaHecho(e)) : 0;
  return ej === -1 ? null : { ej, serie: serieInicial(dia.exercises[ej]) };
}

// Adentro del ejercicio (#57 y decisión 47): la serie que toca en grande, con el detalle (semana
// pasada, cómo hacerlo, por qué). Todo se guarda al tocar, con los mismos endpoints que el día;
// por eso salir y volver retoma donde quedó. Con la semana cerrada o el día completado, se ve
// en lectura.
export default function EntrenarView({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; n: string }>;
  searchParams: Promise<{ ejercicio?: string }>;
}) {
  const { id, n } = use(params);
  const { ejercicio: pedidoTexto } = use(searchParams);
  const pedido = pedidoTexto ? Number(pedidoTexto) - 1 : null;
  const [dia, setDia] = useState<DayDetail | null>(null);
  const [pos, setPos] = useState<Posicion | null>(null);
  const [error, setError] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const router = useRouter();
  // Al cerrar el día se va a Inicio; con la transición la pantalla no queda "trabajando" al volver.
  const [yendoAInicio, startTransition] = useTransition();
  const [corrigiendo, setCorrigiendo] = useState(false);

  useEffect(() => {
    apiFetch(`/weeks/${id}/days/${n}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        const leido: DayDetail = await res.json();
        setDia(leido);
        const registra = leido.week_status === "active" && leido.finished_at === null;
        setPos(posicionInicial(leido, pedido, registra));
      })
      .catch((e) => setError(e.message));
  }, [id, n, pedido]);

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
  if (!dia) return <Cargando />;

  const actual = dia;
  // Solo se registra en la semana activa y con el día abierto; si no, el ejercicio se ve en lectura.
  const registra = actual.week_status === "active" && actual.finished_at === null;

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
      const libre = d.exercises[pos.ej].sets.findIndex((s) => !s.real);
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
      if (estado) {
        setDia({ ...actual, finished_at: estado.finished_at });
        // Día cerrado: se vuelve a Inicio, donde aparece lo que toca después.
        startTransition(() => router.push("/"));
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setTrabajando(false);
    }
  }

  const total = actual.exercises.length;
  // En el cierre del día (sin ejercicio a la vista), "anterior" lleva al último ejercicio.
  const actualEj = pos ? pos.ej : total;
  const hayCalor = Boolean(actual.mobility_notes);
  const primero = hayCalor ? CALOR : 0;

  function irA(i: number) {
    setCorrigiendo(false);
    setPos(i === CALOR ? { ej: CALOR, serie: 0 } : { ej: i, serie: serieInicial(actual.exercises[i]) });
  }

  function nombreDe(i: number): string | undefined {
    return i === CALOR ? "Entrada en calor" : actual.exercises[i]?.name;
  }

  return (
    <main className="mx-auto max-w-xl px-4 pt-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Día {actual.day_index}
          {pos && (pos.ej === CALOR ? " · entrada en calor" : ` · ejercicio ${pos.ej + 1} de ${total}`)}
          {!registra && " · solo lectura"}
        </span>
        <Button size="icon-lg" variant="ghost" nativeButton={false} render={<Link href={volver} />} aria-label="Volver al día">
          <X />
        </Button>
      </div>
      {/* Una barra por ejercicio: rojo hecho, tinta el actual. Tocar una abre ese ejercicio; las
          flechas pasan al anterior o al siguiente en el orden del día, esté hecho o no. En los
          extremos la flecha no se muestra (sin dar la vuelta), pero guarda su lugar. */}
      <div className="mt-1 mb-4 flex items-center gap-1">
        <Flecha
          direccion="anterior"
          visible={actualEj > primero}
          disabled={trabajando}
          nombre={nombreDe(actualEj - 1)}
          onClick={() => irA(actualEj - 1)}
        />
        {hayCalor && (
          <button
            type="button"
            disabled={trabajando}
            onClick={() => irA(CALOR)}
            aria-label="Ir a Entrada en calor"
            aria-current={pos?.ej === CALOR ? "step" : undefined}
            className={cn(
              "h-2 flex-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              pos?.ej === CALOR ? "bg-disco-tinta" : empezoElDia(actual) ? "bg-disco-rojo" : "bg-border",
            )}
          />
        )}
        {actual.exercises.map((e, i) => (
          <button
            key={i}
            type="button"
            disabled={trabajando}
            onClick={() => irA(i)}
            aria-label={`Ir a ${e.name}`}
            aria-current={pos?.ej === i ? "step" : undefined}
            className={cn(
              "h-2 flex-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              pos?.ej === i ? "bg-disco-tinta" : estaHecho(e) ? "bg-disco-rojo" : "bg-border",
            )}
          />
        ))}
        <Flecha
          direccion="siguiente"
          visible={pos !== null && actualEj < total - 1}
          disabled={trabajando}
          nombre={nombreDe(actualEj + 1)}
          onClick={() => irA(actualEj + 1)}
        />
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {pos?.ej === CALOR ? (
        <EntradaEnCalor
          dia={actual}
          registra={registra}
          onEmpezar={() => {
            const siguiente = proximoEjercicio(actual, CALOR);
            setPos(siguiente === null ? null : { ej: siguiente, serie: serieInicial(actual.exercises[siguiente]) });
          }}
        />
      ) : pos ? (
        <Ejercicio
          dia={actual}
          pos={pos}
          registra={registra}
          trabajando={trabajando}
          corrigiendo={corrigiendo}
          onIrASerie={(serie) => {
            setCorrigiendo(false);
            setPos({ ej: pos.ej, serie });
          }}
          onCorregir={() => setCorrigiendo(true)}
          onTerminarCorreccion={() => setCorrigiendo(false)}
          onSerieGuardada={(s) => setDia((d) => (d ? conSerie(d, s) : d))}
          onEjercicioCambiado={(e) => {
            const nuevo = conEjercicio(actual, e);
            setDia(nuevo);
            setPos({ ej: pos.ej, serie: serieInicial(nuevo.exercises[pos.ej]) });
          }}
          onAvanzar={avanzar}
        />
      ) : (
        <section className="rounded-2xl bg-card p-5">
          {actual.finished_at === null ? (
            <>
              <h1 className="mt-0 text-4xl">Terminaste los {total} ejercicios</h1>
              <p className="text-muted-foreground">Cerrá el día para que cuente como hecho.</p>
              <Button size="lg" className="h-12 w-full text-base" type="button" onClick={completarDia} disabled={trabajando || yendoAInicio}>
                Día completado
              </Button>
            </>
          ) : (
            <>
              <h1 className="mt-0 text-4xl">Día completado</h1>
              <Button size="lg" className="h-12 w-full text-base" nativeButton={false} render={<Link href="/entrenar" />}>
                Ir a Entrenar
              </Button>
            </>
          )}
        </section>
      )}
    </main>
  );
}

// La entrada en calor en grande, como un ejercicio más pero sin series: el texto y un botón para
// pasar al primer ejercicio sin hacer.
function EntradaEnCalor({
  dia,
  registra,
  onEmpezar,
}: {
  dia: DayDetail;
  registra: boolean;
  onEmpezar: () => void;
}) {
  const siguiente = registra ? proximoEjercicio(dia, CALOR) : null;
  return (
    <>
      <h1 className="my-0 text-4xl">Entrada en calor</h1>
      <section className="mt-3 rounded-2xl bg-card p-5">
        <p className="m-0">{dia.mobility_notes}</p>
      </section>
      {registra && (
        <Button size="lg" className="mt-4 h-12 w-full text-base" type="button" onClick={onEmpezar}>
          Listo, empezar
        </Button>
      )}
      {siguiente !== null && (
        <p className="mt-4 rounded-xl bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">Después:</span> {dia.exercises[siguiente].name} ·{" "}
          {summarize(dia.exercises[siguiente])}
        </p>
      )}
    </>
  );
}

function Ejercicio({
  dia,
  pos,
  registra,
  trabajando,
  corrigiendo,
  onIrASerie,
  onCorregir,
  onTerminarCorreccion,
  onSerieGuardada,
  onEjercicioCambiado,
  onAvanzar,
}: {
  dia: DayDetail;
  pos: Posicion;
  registra: boolean;
  trabajando: boolean;
  corrigiendo: boolean;
  onIrASerie: (serie: number) => void;
  onCorregir: () => void;
  onTerminarCorreccion: () => void;
  onSerieGuardada: (s: SetItem) => void;
  onEjercicioCambiado: (e: ExerciseItem) => void;
  onAvanzar: () => void;
}) {
  const ejercicio = dia.exercises[pos.ej];
  const hecho = estaHecho(ejercicio);
  // Se registra serie por serie solo con el día abierto y el ejercicio sin cerrar.
  const enCurso = registra && !hecho;
  const siguiente = registra ? proximoEjercicio(dia, pos.ej) : null;

  return (
    <>
      <h1 className="my-0 text-4xl">{ejercicio.name}</h1>
      {hecho && <p className="mt-1 mb-0 text-sm text-muted-foreground">Ejercicio hecho</p>}

      {enCurso ? (
        <SerieEnGrande
          dia={dia}
          ejercicio={ejercicio}
          pos={pos}
          trabajando={trabajando}
          corrigiendo={corrigiendo}
          onIrASerie={onIrASerie}
          onCorregir={onCorregir}
          onTerminarCorreccion={onTerminarCorreccion}
          onSerieGuardada={onSerieGuardada}
          onAvanzar={onAvanzar}
        />
      ) : (
        // Hecho o en lectura: todas las series con lo que se registró.
        <section className="mt-3 rounded-2xl bg-card px-4 py-2">
          <ul className="m-0 list-none p-0">
            {ejercicio.sets.map((s, i) => (
              <SetRow key={i} kind={ejercicio.kind} index={i} set={s} />
            ))}
          </ul>
          <SemanaPasada ejercicio={ejercicio} />
        </section>
      )}

      {/* El detalle que antes estaba en la lista del día (decisión 47), plegado. */}
      <div className="mt-4 grid gap-2">
        {ejercicio.execution_notes && (
          <details className="rounded-xl bg-card px-4 py-2">
            <summary className="cursor-pointer py-1 font-medium">Cómo hacerlo</summary>
            <p className="mt-1 mb-1 text-sm">{ejercicio.execution_notes}</p>
          </details>
        )}
        {ejercicio.reason && (
          <details className="rounded-xl bg-card px-4 py-2">
            <summary className="cursor-pointer py-1 font-medium">Por qué está en tu rutina</summary>
            <p className="mt-1 mb-1 text-sm">{ejercicio.reason}</p>
          </details>
        )}
      </div>

      {/* Reabrir y deshacer el ejercicio; el tilde no hace falta (lo cierra el botón grande). */}
      {registra && (
        <div className="mt-3 flex items-center justify-end gap-2 text-sm text-muted-foreground">
          <DoneControl
            exercise={ejercicio}
            sinTilde
            edit={{ weekId: dia.week_id, dayIndex: dia.day_index, onChanged: onEjercicioCambiado }}
          />
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

function SerieEnGrande({
  dia,
  ejercicio,
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
  ejercicio: ExerciseItem;
  pos: Posicion;
  trabajando: boolean;
  corrigiendo: boolean;
  onIrASerie: (serie: number) => void;
  onCorregir: () => void;
  onTerminarCorreccion: () => void;
  onSerieGuardada: (s: SetItem) => void;
  onAvanzar: () => void;
}) {
  const descanso = useDescanso();
  // El descanso es de este ejercicio: se guarda con qué ejercicio lo arrancó y adónde volver.
  const clave = `${dia.week_id}-${dia.day_index}-${pos.ej}`;
  const href = `/semanas/${dia.week_id}/dia/${dia.day_index}/entrenar?ejercicio=${pos.ej + 1}`;
  const serie = ejercicio.sets[pos.serie];
  const real = serie.real ?? null;
  const mostrada = real ? realAsSet(real) : serie;
  const todas = ejercicio.sets.every((s) => s.real);
  const boton = !real ? "Serie hecha" : todas ? "Terminar ejercicio" : "Siguiente serie";
  const anterior = ejercicio.previous;

  // Mientras corre el descanso de este ejercicio, el círculo ocupa el lugar de la serie (decisión 48).
  if (descanso.corriendo?.clave === clave) {
    return <RelojCircular subtitulo={`Sigue la serie ${pos.serie + 1} de ${ejercicio.sets.length}`} />;
  }

  return (
    <>
      {descanso.terminado === clave && (
        <p role="status" className="mt-3 mb-0 rounded-xl bg-disco-amarillo px-4 py-2 text-center font-medium text-disco-tinta">
          Listo, siguiente serie
        </p>
      )}
      <section className="relative mt-3 rounded-2xl bg-card p-5 text-center">
        {/* El lápiz va en la esquina de la serie, lejos del botón grande (decisión 47). */}
        {!corrigiendo && (
          <Button
            size="icon-lg"
            variant="outline"
            className="absolute top-3 right-3"
            type="button"
            onClick={onCorregir}
            disabled={trabajando}
            aria-label={`Corregir la serie ${pos.serie + 1}`}
          >
            <Pencil />
          </Button>
        )}
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
          {/* El reloj lo arranca el usuario, nunca solo; sin descanso propuesto no aparece. */}
          {ejercicio.rest_seconds !== null && (
            <BotonDescanso segundos={ejercicio.rest_seconds} clave={clave} href={href} nombre={ejercicio.name} />
          )}
          <Button
            size="lg"
            className="h-12 flex-1 text-base"
            type="button"
            onClick={() => {
              descanso.olvidarAviso();
              onAvanzar();
            }}
            disabled={trabajando}
          >
            {trabajando ? "Guardando..." : boton}
          </Button>
        </div>
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
