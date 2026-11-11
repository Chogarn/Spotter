"use client";

import { ChevronDown, ChevronUp, Pause, Play, RotateCcw, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useRef, useState } from "react";

import { Confirmar } from "@/components/Confirmar";
import { PasoConReloj, PasoHecho } from "@/components/Cronometro";
import { ContadorSesion } from "@/components/ContadorSesion";
import { BotonDescanso, RelojCircular, useDescanso } from "@/components/Descanso";
import { Disco, DiscosSemana } from "@/components/Disco";
import { Festejo } from "@/components/Festejo";
import { InfoEjercicio } from "@/components/InfoEjercicio";
import { Flecha } from "@/components/Flecha";
import { DoneControl } from "@/components/DoneControl";
import { ErrorMessage } from "@/components/ErrorMessage";
import { usePeriodo } from "@/components/SelectorPeriodo";
import { SetRow } from "@/components/SetRow";
import { TablaSeries, cuerpoDeSerie, distintoDelPlan } from "@/components/TablaSeries";
import { Button } from "@/components/ui/button";
import { readError, type DayDetail, type DayState, type ExerciseItem, type SetItem, type WeekDetail, apiFetch } from "@/lib/api";
import { calorHecha, estaHecho, realAsSet, setText, summarize, tituloDia } from "@/lib/format";
import { borrarCronosDelDia } from "@/lib/cronometro";
import { cn } from "cn";
import { Cargando } from "@/components/Cargando";

// Dónde va el usuario: el ejercicio y la serie que se muestran en grande.
type Posicion = { ej: number; serie: number };

// La entrada en calor (`mobility_notes`) va como un paso antes del primer ejercicio. No tiene
// series ni cuenta en los ejercicios hechos; queda hecha al tocar "Finalizar" en su cronómetro,
// que guarda los minutos (decisión 122), o, como antes, en cuanto hay algo registrado (`calorHecha`).
const CALOR = -1;

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

// Dónde estaba la persona la última vez en este día (decisión 84): se guarda cada vez que cambia
// de ejercicio o de serie y se usa al volver. Va en el navegador, por semana y día.
function claveDePosicion(id: string, n: string): string {
  return `spotter_pos_${id}_${n}`;
}

function posicionGuardada(id: string, n: string, dia: DayDetail): Posicion | null {
  try {
    const crudo = localStorage.getItem(claveDePosicion(id, n));
    if (!crudo) return null;
    const p = JSON.parse(crudo) as Posicion;
    if (p.ej === CALOR) return dia.mobility_notes ? { ej: CALOR, serie: 0 } : null;
    const ejercicio = dia.exercises[p.ej];
    if (!ejercicio || !Number.isInteger(p.serie) || p.serie < 0 || p.serie >= ejercicio.sets.length) return null;
    return p;
  } catch {
    return null;
  }
}

// Dónde abrir: el ejercicio pedido (`?ejercicio=K`, desde la tarjeta del día); si no hay, donde se
// estaba la última vez (`guardada`); si tampoco, la entrada en calor mientras el día no haya
// empezado, o el primero sin hacer. Null si no queda ninguno: se muestra el cierre del día.
function posicionInicial(
  dia: DayDetail,
  pedido: number | null,
  registra: boolean,
  guardada: Posicion | null,
): Posicion | null {
  if (pedido !== null && pedido >= 0 && pedido < dia.exercises.length) {
    return { ej: pedido, serie: serieInicial(dia.exercises[pedido]) };
  }
  if (registra && guardada) return guardada;
  if (dia.mobility_notes && (!registra || !calorHecha(dia))) return { ej: CALOR, serie: 0 };
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
  // Recién se tocó "Día completado": se muestra el festejo en vez de ir directo al Resumen del día.
  const [festejo, setFestejo] = useState(false);
  // El recuadro que confirma "Reiniciar el día" (borra lo registrado; decisión 121).
  const [confirmarReinicio, setConfirmarReinicio] = useState(false);
  const router = useRouter();

  useEffect(() => {
    apiFetch(`/weeks/${id}/days/${n}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        const leido: DayDetail = await res.json();
        setDia(leido);
        const registra = leido.week_status === "active" && leido.finished_at === null;
        setPos(posicionInicial(leido, pedido, registra, posicionGuardada(id, n, leido)));
        // Abrir el modo entrenar es "Empezar día": desde acá corre el contador (decisión 82).
        // Es solo un dato, así que si falla no se interrumpe nada.
        if (registra && leido.started_at === null) {
          apiFetch(`/weeks/${id}/days/${n}/start`, { method: "POST" })
            .then(async (r) => {
              if (!r.ok) return;
              const estado: { started_at: string | null } = await r.json();
              setDia((d) => (d ? { ...d, started_at: estado.started_at } : d));
            })
            .catch(() => {});
        }
      })
      .catch((e) => setError(e.message));
  }, [id, n, pedido]);

  // Guarda dónde está la persona para volver ahí (decisión 84). Al terminar todos los ejercicios
  // (sin posición) se borra, y la próxima vez se calcula con lo registrado.
  const editable = dia !== null && dia.week_status === "active" && dia.finished_at === null;
  useEffect(() => {
    if (!editable) return;
    try {
      if (pos) localStorage.setItem(claveDePosicion(id, n), JSON.stringify(pos));
      else localStorage.removeItem(claveDePosicion(id, n));
    } catch {}
  }, [pos, editable, id, n]);

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

  // Guarda lo realizado en una serie con los números de la tabla; si falla, deja el mensaje.
  async function guardarSerie(serie: SetItem, valores: SetItem, kind: ExerciseItem["kind"]): Promise<SetItem | null> {
    const res = await apiFetch(`/weeks/${actual.week_id}/days/${actual.day_index}/sets/${serie.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpoDeSerie(kind, valores)),
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

  // El botón grande: marca la serie, pasa a la siguiente o cierra el ejercicio, según toque. Con
  // `valores` (lo cambiado en la tabla de series), la serie se guarda con esos números; sin ellos,
  // con lo planificado.
  async function avanzar(valores: SetItem | null): Promise<boolean> {
    if (!pos) return false;
    setError("");
    setTrabajando(true);
    try {
      let d = actual;
      const serie = d.exercises[pos.ej].sets[pos.serie];
      if (!serie.real) {
        const guardada = valores
          ? await guardarSerie(serie, valores, d.exercises[pos.ej].kind)
          : await llamar<SetItem>(`/sets/${serie.id}/done`);
        if (!guardada) return false;
        d = conSerie(d, guardada);
        setDia(d);
      }
      const libre = d.exercises[pos.ej].sets.findIndex((s) => !s.real);
      if (libre === -1) await terminarEjercicio(d, pos.ej);
      else setPos({ ej: pos.ej, serie: libre });
      return true;
    } catch {
      setError("No se pudo conectar con el servidor");
      return false;
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
        // Día cerrado: se muestra el festejo, que ofrece ver cómo te fue o ir a Inicio.
        setFestejo(true);
        setDia({ ...actual, finished_at: estado.finished_at });
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setTrabajando(false);
    }
  }

  // Pasa al primer ejercicio sin hacer después de `desde` (o al cierre del día).
  function seguirDesde(d: DayDetail, desde: number) {
    const siguiente = proximoEjercicio(d, desde);
    setPos(siguiente === null ? null : { ej: siguiente, serie: serieInicial(d.exercises[siguiente]) });
  }

  // "Finalizar" de la entrada en calor (decisión 122): guarda los minutos y sigue.
  async function finalizarCalor(minutos: number): Promise<boolean> {
    setError("");
    setTrabajando(true);
    try {
      const res = await apiFetch(`/weeks/${actual.week_id}/days/${actual.day_index}/warmup`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ minutes: minutos }),
      });
      if (!res.ok) {
        setError(await readError(res));
        return false;
      }
      const { warmup_minutes }: { warmup_minutes: number | null } = await res.json();
      const nuevo = { ...actual, warmup_minutes };
      setDia(nuevo);
      seguirDesde(nuevo, CALOR);
      return true;
    } catch {
      setError("No se pudo conectar con el servidor");
      return false;
    } finally {
      setTrabajando(false);
    }
  }

  // Detener, retomar y reiniciar el día (decisión 121). Devuelven el estado del reloj.
  type EstadoReloj = Pick<DayDetail, "finished_at" | "started_at" | "paused_at" | "paused_seconds">;
  async function cambiarReloj(accion: "pause" | "resume" | "restart") {
    setError("");
    setTrabajando(true);
    try {
      const estado = await llamar<EstadoReloj>(`/${accion}`);
      if (!estado) return;
      if (accion !== "restart") {
        setDia({ ...actual, ...estado });
        return;
      }
      // Reiniciar dejó el día sin empezar: se sale a Entrenar, donde vuelve a estar "Empezar".
      // Quedarse acá lo volvería a empezar (abrir el modo entrenar es "Empezar día").
      try {
        localStorage.removeItem(claveDePosicion(id, n));
      } catch {}
      borrarCronosDelDia(actual.week_id, actual.day_index);
      router.push("/entrenar");
    } catch {
      setError("No se pudo conectar con el servidor");
    } finally {
      setTrabajando(false);
    }
  }
  const pausado = Boolean(actual.paused_at);

  const total = actual.exercises.length;
  // En el cierre del día (sin ejercicio a la vista), "anterior" lleva al último ejercicio.
  const actualEj = pos ? pos.ej : total;
  const hayCalor = Boolean(actual.mobility_notes);
  const primero = hayCalor ? CALOR : 0;

  function irA(i: number) {
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
          {/* Un día recién completado de una semana activa queda en lectura, pero no hace falta decirlo. */}
          {!registra && !(actual.week_status === "active" && actual.finished_at !== null) && " · solo lectura"}
        </span>
        {registra && actual.started_at && (
          // El reloj del día con Detener o Retomar y Reiniciar al lado (decisión 121).
          <span className="flex items-center gap-1.5">
            {pausado && (
              <span className="rounded-full bg-disco-amarillo px-2 py-0.5 text-xs font-semibold text-disco-tinta">En pausa</span>
            )}
            <ContadorSesion
              desde={actual.started_at}
              pausa={actual.paused_seconds ?? 0}
              detenidoEn={actual.paused_at ?? null}
              className={cn("font-heading text-lg font-bold tabular-nums", pausado ? "text-muted-foreground" : "text-foreground")}
            />
            <Button
              size="icon"
              variant={pausado ? "default" : "outline"}
              className="rounded-full"
              type="button"
              disabled={trabajando}
              onClick={() => cambiarReloj(pausado ? "resume" : "pause")}
              aria-label={pausado ? "Retomar el día" : "Detener el día"}
            >
              {pausado ? <Play /> : <Pause />}
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full"
              type="button"
              disabled={trabajando}
              onClick={() => setConfirmarReinicio(true)}
              aria-label="Reiniciar el día"
            >
              <RotateCcw />
            </Button>
          </span>
        )}
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
              pos?.ej === CALOR ? "bg-disco-tinta" : calorHecha(actual) ? "bg-disco-verde" : "bg-border",
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
              pos?.ej === i ? "bg-disco-tinta" : estaHecho(e) ? "bg-disco-verde" : "bg-border",
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
          pausado={pausado}
          trabajando={trabajando}
          onFinalizar={finalizarCalor}
          // Saltar no la marca como hecha (decisión 122).
          onSaltar={() => seguirDesde(actual, CALOR)}
          onRetomar={() => cambiarReloj("resume")}
        />
      ) : pos ? (
        <Ejercicio
          dia={actual}
          pos={pos}
          registra={registra}
          trabajando={trabajando}
          pausado={pausado}
          onRetomar={() => cambiarReloj("resume")}
          onIrASerie={(serie) => setPos({ ej: pos.ej, serie })}
          onSerieGuardada={(s) => setDia((d) => (d ? conSerie(d, s) : d))}
          onEjercicioCambiado={(e) => {
            const nuevo = conEjercicio(actual, e);
            setDia(nuevo);
            setPos({ ej: pos.ej, serie: serieInicial(nuevo.exercises[pos.ej]) });
          }}
          onAvanzar={avanzar}
          // Saltar el cardio lo deja sin registrar (decisión 122).
          onSaltar={() => seguirDesde(actual, pos.ej)}
        />
      ) : (
        <section className="rounded-2xl bg-card p-5">
          {actual.finished_at === null ? (
            <>
              <h1 className="mt-0 text-4xl">Terminaste los {total} ejercicios</h1>
              <p className="text-muted-foreground">Cerrá el día para que cuente como hecho.</p>
              <Button size="xl" className="w-full" type="button" onClick={completarDia} disabled={trabajando}>
                Día completado
              </Button>
            </>
          ) : festejo ? (
            <FestejoDelDia dia={actual} />
          ) : (
            <CierreDelDia />
          )}
        </section>
      )}
      <Confirmar
        abierto={confirmarReinicio}
        titulo={`¿Reiniciar el Día ${actual.day_index}?`}
        texto="El día vuelve a como estaba antes de empezarlo: se borran las series y los ejercicios que marcaste y el reloj vuelve a cero. No se puede deshacer."
        accion="Reiniciar"
        onConfirmar={() => {
          setConfirmarReinicio(false);
          void cambiarReloj("restart");
        }}
        onCancelar={() => setConfirmarReinicio(false)}
      />
    </main>
  );
}

// Justo después de tocar "Día completado": el confeti de la semana completada, "Día N completado",
// el nombre del día, los días de la semana en discos y la duración (si se midió). Las series y los
// kilos quedan para el Resumen del día, al que se llega con "Ver cómo te fue".
function FestejoDelDia({ dia }: { dia: DayDetail }) {
  const router = useRouter();
  const [, setPeriodo] = usePeriodo();
  const [estados, setEstados] = useState<DayState[] | null>(null);

  useEffect(() => {
    apiFetch(`/weeks/${dia.week_id}`)
      .then(async (res) => {
        if (!res.ok) return;
        const semana: WeekDetail = await res.json();
        setEstados(semana.days.map((d) => d.state));
      })
      .catch(() => {});
  }, [dia.week_id]);

  const minutos =
    dia.started_at && dia.finished_at
      ? Math.round((new Date(dia.finished_at).getTime() - new Date(dia.started_at).getTime()) / 60000)
      : null;

  return (
    <div className="text-center">
      <Festejo />
      <h1 className="mt-0 mb-1 text-4xl">Día {dia.day_index} completado</h1>
      <p className="m-0 text-muted-foreground">
        {tituloDia(dia.title)}
        {minutos !== null && minutos > 0 && ` · ${minutos} min`}
      </p>
      <div className="mt-3 flex h-4 justify-center">{estados && <DiscosSemana estados={estados} />}</div>
      <Button
        size="xl"
        className="mt-5 w-full"
        type="button"
        onClick={() => {
          setPeriodo("day");
          router.push("/progreso/resumenes");
        }}
      >
        Ver cómo te fue
      </Button>
      <Button size="xl" variant="outline" className="mt-2 w-full" nativeButton={false} render={<Link href="/" />}>
        Ir a Inicio
      </Button>
    </div>
  );
}

// Al volver a un día ya completado se va al Resumen del día, en Resúmenes: es
// la misma pantalla que se ve después desde Inicio.
function CierreDelDia() {
  const router = useRouter();
  const [, setPeriodo] = usePeriodo();
  useEffect(() => {
    setPeriodo("day");
    router.replace("/progreso/resumenes");
  }, [router, setPeriodo]);
  return <Cargando />;
}

// "5 a 10 min de movilidad de cadera" → el tiempo en grande ("5 a 10 min") y lo que queda del texto
// ("Movilidad de cadera"), como la serie en grande. Si el texto no empieza con minutos, null: se
// muestra entero.
function tiempoDeCalor(texto: string | null): { tiempo: string; resto: string } | null {
  const m = texto?.trim().match(/^(\d+)(?:\s*(?:a|-|–)\s*(\d+))?\s*(?:minutos|min)\b\.?\s*(?:de\s+)?(.*)$/i);
  if (!m) return null;
  const resto = m[3].trim();
  return {
    tiempo: `${m[2] ? `${m[1]} a ${m[2]}` : m[1]} min`,
    resto: resto ? resto.charAt(0).toUpperCase() + resto.slice(1) : "",
  };
}

// La entrada en calor en grande, como un ejercicio más pero sin series: el tiempo planificado y el
// texto, con el cronómetro (decisión 122). Hecha, muestra los minutos que se midieron.
function EntradaEnCalor({
  dia,
  registra,
  pausado,
  trabajando,
  onFinalizar,
  onSaltar,
  onRetomar,
}: {
  dia: DayDetail;
  registra: boolean;
  pausado: boolean;
  trabajando: boolean;
  onFinalizar: (minutos: number) => Promise<boolean>;
  onSaltar: () => void;
  onRetomar: () => void;
}) {
  const hecha = calorHecha(dia);
  const siguiente = registra && !hecha ? proximoEjercicio(dia, CALOR) : null;
  const calor = tiempoDeCalor(dia.mobility_notes);
  const planificado = calor?.tiempo ?? null;
  const texto = calor ? calor.resto : dia.mobility_notes;
  return (
    <>
      <h1 className="my-0 text-4xl">Entrada en calor</h1>
      {hecha ? (
        <PasoHecho etiqueta="Hecha" minutos={dia.warmup_minutes ?? null} planificado={planificado} distinto={false} texto={texto} />
      ) : registra ? (
        <PasoConReloj
          dia={dia}
          paso="calor"
          planificado={planificado}
          texto={texto}
          pausado={pausado}
          trabajando={trabajando}
          onFinalizar={onFinalizar}
          onSaltar={onSaltar}
          onRetomar={onRetomar}
        />
      ) : (
        <section className="mt-3 rounded-2xl bg-card p-5 text-center">
          {calor ? (
            <>
              <p className="my-2 font-heading text-7xl leading-none font-bold">{calor.tiempo}</p>
              <p className="m-0 text-muted-foreground">{calor.resto}</p>
            </>
          ) : (
            <p className="m-0">{dia.mobility_notes}</p>
          )}
        </section>
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
  pausado,
  onRetomar,
  onIrASerie,
  onSerieGuardada,
  onEjercicioCambiado,
  onAvanzar,
  onSaltar,
}: {
  dia: DayDetail;
  pos: Posicion;
  registra: boolean;
  trabajando: boolean;
  pausado: boolean;
  onRetomar: () => void;
  onIrASerie: (serie: number) => void;
  onSerieGuardada: (s: SetItem) => void;
  onEjercicioCambiado: (e: ExerciseItem) => void;
  onAvanzar: (valores: SetItem | null) => Promise<boolean>;
  onSaltar: () => void;
}) {
  const ejercicio = dia.exercises[pos.ej];
  const hecho = estaHecho(ejercicio);
  // Se registra serie por serie solo con el día abierto y el ejercicio sin cerrar.
  const enCurso = registra && !hecho;
  // "Después" solo con el ejercicio en curso y si queda alguno más adelante: en el último no se da la
  // vuelta al primero, y en uno ya hecho no hace falta.
  const proximo = registra && !hecho ? proximoEjercicio(dia, pos.ej) : null;
  const siguiente = proximo !== null && proximo > pos.ej ? proximo : null;

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        {/* Altura fija de dos líneas, y la letra se achica si el nombre es largo: así el cuadro de la
            serie no sube ni baja de un ejercicio a otro según cuánto mida el título. */}
        <h1
          className={cn(
            "my-0 min-h-20",
            ejercicio.name.length <= 18 ? "text-4xl" : ejercicio.name.length <= 36 ? "text-3xl" : "text-2xl",
          )}
        >
          {ejercicio.name}
        </h1>
        <InfoEjercicio
          nombre={ejercicio.name}
          comoHacerlo={ejercicio.execution_notes}
          porQue={ejercicio.reason}
          className="mt-1.5"
        />
      </div>

      {enCurso && ejercicio.kind === "cardio" ? (
        // El cardio con cronómetro (decisión 122): "Finalizar" guarda los minutos medidos como lo
        // realizado de la serie.
        <PasoConReloj
          key={`${pos.ej}-${pos.serie}`}
          dia={dia}
          paso={`${pos.ej}-${pos.serie}`}
          planificado={`${ejercicio.sets[pos.serie].duration_minutes} min`}
          pausado={pausado}
          trabajando={trabajando}
          onFinalizar={(minutos) => onAvanzar({ ...ejercicio.sets[pos.serie], duration_minutes: minutos })}
          onSaltar={onSaltar}
          onRetomar={onRetomar}
        />
      ) : enCurso ? (
        <SerieEnGrande
          dia={dia}
          ejercicio={ejercicio}
          pos={pos}
          key={pos.ej}
          trabajando={trabajando}
          pausado={pausado}
          onRetomar={onRetomar}
          onIrASerie={onIrASerie}
          onSerieGuardada={onSerieGuardada}
          onAvanzar={onAvanzar}
        />
      ) : ejercicio.kind === "cardio" && hecho ? (
        <CardioHecho ejercicio={ejercicio} />
      ) : (
        // Hecho o en lectura: todas las series con lo que se registró.
        <section className="mt-3 rounded-2xl bg-card px-4 py-2">
          <ul className="m-0 list-none p-0">
            {ejercicio.sets.map((s, i) => (
              <SetRow key={i} kind={ejercicio.kind} index={i} set={s} />
            ))}
          </ul>
        </section>
      )}

      {/* "Cómo hacerlo" y "Por qué" están en el ícono de información de arriba (decisión 85). El
          esfuerzo y el dolor ya no se marcan acá: van en el comentario al cerrar la semana. */}

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

// El cardio ya hecho: los minutos realizados en grande (en azul si no son los planificados).
function CardioHecho({ ejercicio }: { ejercicio: ExerciseItem }) {
  const plan = ejercicio.sets.reduce((t, s) => t + (s.duration_minutes ?? 0), 0);
  const real = ejercicio.sets.reduce((t, s) => t + (s.real?.duration_minutes ?? s.duration_minutes ?? 0), 0);
  return <PasoHecho etiqueta="Hecho" minutos={real} planificado={`${plan} min`} distinto={real !== plan} />;
}

function SerieEnGrande({
  dia,
  ejercicio,
  pos,
  trabajando,
  pausado,
  onRetomar,
  onIrASerie,
  onSerieGuardada,
  onAvanzar,
}: {
  dia: DayDetail;
  ejercicio: ExerciseItem;
  pos: Posicion;
  trabajando: boolean;
  pausado: boolean;
  onRetomar: () => void;
  onIrASerie: (serie: number) => void;
  onSerieGuardada: (s: SetItem) => void;
  onAvanzar: (valores: SetItem | null) => void;
}) {
  const descanso = useDescanso();
  // La tabla de series arranca plegada en cada ejercicio (decisión 120).
  const [tablaAbierta, setTablaAbierta] = useState(false);
  // Al abrir la tabla, la página baja hasta "Serie hecha": si no, en un celular queda detrás del
  // botón redondo de la barra y hay que saber que se puede deslizar.
  const acciones = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!tablaAbierta) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    acciones.current?.scrollIntoView({ block: "end", behavior: quieto ? "auto" : "smooth" });
  }, [tablaAbierta]);
  // Lo cambiado en la tabla para las series sin hacer: se guarda recién con "Serie hecha".
  const [borrador, setBorrador] = useState<Record<number, SetItem>>({});
  // El descanso es de este ejercicio: se guarda con qué ejercicio lo arrancó y adónde volver.
  const clave = `${dia.week_id}-${dia.day_index}-${pos.ej}`;
  const href = `/semanas/${dia.week_id}/dia/${dia.day_index}/entrenar?ejercicio=${pos.ej + 1}`;
  const serie = ejercicio.sets[pos.serie];
  const real = serie.real ?? null;
  const mostrada = real ? realAsSet(real) : (borrador[pos.serie] ?? serie);
  const cambiada = distintoDelPlan(serie, mostrada);
  const todas = ejercicio.sets.every((s) => s.real);
  const boton = !real ? "Serie hecha" : todas ? "Terminar ejercicio" : "Siguiente serie";

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
      {/* Con el día detenido la serie se ve apagada y no se registra hasta retomar (decisión 121). */}
      <section className={cn("mt-3 rounded-2xl bg-card p-5 text-center", pausado && "opacity-55")} inert={pausado}>
        <Medida kind={ejercicio.kind} serie={mostrada} cambiada={cambiada} />
        {cambiada && <p className="m-0 text-sm text-muted-foreground">tocaba {setText(ejercicio.kind, serie)}</p>}
        {/* En el cardio (una sola vuelta, en minutos) los discos de serie no aportan nada. */}
        {ejercicio.kind !== "cardio" && (
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
        )}
        {/* Los números de todas las series, plegados debajo de los discos (decisión 120): reemplaza
            al lápiz. */}
        <div className="mt-4 border-t border-border pt-2 text-left">
          <button
            type="button"
            onClick={() => setTablaAbierta((a) => !a)}
            aria-expanded={tablaAbierta}
            className="flex w-full items-center justify-between rounded-lg py-1.5 font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <span>{ejercicio.kind === "strength" ? "Series · kilos y reps" : "Series"}</span>
            {tablaAbierta ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
          </button>
          {tablaAbierta && (
            <TablaSeries
              kind={ejercicio.kind}
              sets={ejercicio.sets}
              actual={pos.serie}
              borrador={borrador}
              onBorrador={(i, valores) => setBorrador((b) => ({ ...b, [i]: valores }))}
              weekId={dia.week_id}
              dayIndex={dia.day_index}
              onGuardada={onSerieGuardada}
              disabled={trabajando}
            />
          )}
        </div>
      </section>

      {pausado ? (
        <Button size="xl" className="mt-4 w-full" type="button" onClick={onRetomar} disabled={trabajando}>
          <Play /> Retomar
        </Button>
      ) : (
      // El margen de abajo deja a la vista la barra y el botón redondo que sobresale (unos 40 px).
      <div ref={acciones} className="mt-4 flex scroll-mb-[calc(var(--alto-barra)+2.5rem)] gap-2">
        {/* El reloj lo arranca el usuario, nunca solo; sin descanso propuesto no aparece. */}
        {ejercicio.rest_seconds !== null && (
          <BotonDescanso segundos={ejercicio.rest_seconds} clave={clave} href={href} nombre={ejercicio.name} />
        )}
        <Button
          size="xl"
          className="flex-1"
          type="button"
          onClick={() => {
            descanso.olvidarAviso();
            // Si la serie sin hacer se cambió en la tabla, se guarda con esos números.
            onAvanzar(!real && cambiada ? mostrada : null);
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
function Medida({ kind, serie, cambiada = false }: { kind: ExerciseItem["kind"]; serie: SetItem; cambiada?: boolean }) {
  const grande = cn("m-0 font-heading font-bold leading-none", cambiada && "text-disco-azul");
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
