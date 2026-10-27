"use client";

import { SelectorChip } from "@/components/SelectorPeriodo";
import { useEffect, useState } from "react";

import { BuscarEjercicio } from "@/components/BuscarEjercicio";
import { InlineError } from "@/components/ErrorMessage";
import { readError, apiFetch, type ExerciseOption, type ExerciseTimeline } from "@/lib/api";
import { curva } from "@/lib/curva";
import { shortDate } from "@/lib/format";

const UNIDAD: Record<ExerciseTimeline["unit"], string> = { kg: "kg", reps: "reps", s: "s", min: "min" };
const QUE_MIDE: Record<ExerciseTimeline["unit"], string> = {
  kg: "Mayor peso levantado por semana",
  reps: "Más repeticiones en una serie, por semana",
  s: "Más segundos en una serie, por semana",
  min: "Minutos de la semana",
};

// El fondo del gráfico es blanco para todas las rutinas (antes alternaba dos grises, decisión 69).
const FONDOS = [{ banda: "fill-transparent", pastilla: "bg-muted" }];

type Periodo = "semana" | "mes" | "anio";
const PERIODOS: { id: Periodo; nombre: string }[] = [
  { id: "semana", nombre: "Semana" },
  { id: "mes", nombre: "Mes" },
  { id: "anio", nombre: "Año" },
];

// Un punto de la curva: el momento, el mejor valor de ese tramo y de qué rutina salió.
type Punto = { t: number; value: number; etiqueta: string; routineId: number; routineName: string };

const DIA = 86_400_000;
const tiempo = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};

function numero(v: number): string {
  return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

// Agrupa las semanas con dato en el período elegido, quedándose con el mayor valor de cada tramo.
// Semana: una por fecha de inicio (dos semanas del mismo día se juntan); mes y año: por calendario.
function agrupar(historial: ExerciseTimeline, periodo: Periodo): Punto[] {
  const grupos = new Map<string, Punto>();
  for (const p of historial.points) {
    if (p.value === null || !p.week_start) continue;
    const f = new Date(tiempo(p.week_start));
    const anio = f.getUTCFullYear();
    const mes = f.getUTCMonth();
    const clave = periodo === "semana" ? p.week_start : periodo === "mes" ? `${anio}-${mes}` : String(anio);
    const t = periodo === "semana" ? tiempo(p.week_start) : periodo === "mes" ? Date.UTC(anio, mes, 15) : Date.UTC(anio, 6, 1);
    const etiqueta =
      periodo === "semana"
        ? shortDate(p.week_start)
        : periodo === "mes"
          ? new Date(t).toLocaleDateString("es-AR", { month: "long", year: "numeric", timeZone: "UTC" })
          : String(anio);
    const actual = grupos.get(clave);
    if (!actual || p.value > actual.value) {
      grupos.set(clave, { t, value: p.value, etiqueta, routineId: p.routine_id, routineName: p.routine_name });
    }
  }
  return [...grupos.values()].sort((a, b) => a.t - b.t);
}

// Progreso (decisión 69): la evolución de un ejercicio por fecha, acumulando TODAS las rutinas.
// No depende de la rutina elegida arriba: el "Press de banca" es el mismo en fuerza que en masa.
export function EvolucionEjercicio() {
  const [ejercicios, setEjercicios] = useState<ExerciseOption[] | null>(null);
  const [ejercicioId, setEjercicioId] = useState<number | null>(null);
  const [historial, setHistorial] = useState<ExerciseTimeline | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/exercises`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        const lista: ExerciseOption[] = await res.json();
        setEjercicios(lista);
        // El que apareció en más semanas: es el que más historia puede tener.
        const masSemanas = [...lista].sort((a, b) => b.weeks_count - a.weeks_count)[0];
        setEjercicioId(masSemanas?.id ?? null);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (ejercicioId === null) return;
    apiFetch(`/exercises/${ejercicioId}/history`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setHistorial(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [ejercicioId]);

  if (ejercicios !== null && ejercicios.length === 0) {
    return (
      <section className="rounded-2xl bg-card p-6 text-center">
        <p className="mt-0 mb-1 font-medium">Todavía no hay nada que mostrar</p>
        <p className="m-0 text-sm text-muted-foreground">
          Cuando registres tus primeras series, acá vas a ver cómo evoluciona cada ejercicio.
        </p>
      </section>
    );
  }

  return (
    <section className="mt-4 mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-2 font-heading text-xl font-bold">Evolución por ejercicio</h3>
      {ejercicios && <BuscarEjercicio ejercicios={ejercicios} elegido={ejercicioId} onElegir={setEjercicioId} />}
      {error && <InlineError>{error}</InlineError>}
      {historial && historial.exercise_id === ejercicioId && <Linea historial={historial} />}
    </section>
  );
}

function Linea({ historial }: { historial: ExerciseTimeline }) {
  const [activo, setActivo] = useState<number | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("semana");
  const unidad = UNIDAD[historial.unit];
  const puntos = agrupar(historial, periodo);

  if (historial.weeks_with_data === 0 || puntos.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">Todavía no registraste este ejercicio.</p>;
  }

  const valores = puntos.map((p) => p.value);
  const indiceRecord = valores.indexOf(Math.max(...valores));

  // Geometría: margen a la izquierda para los valores y abajo para las fechas.
  const ancho = 340;
  const alto = 190;
  const izq = 38;
  const der = 14;
  const arriba = 24;
  const abajo = 26;
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (min === max) {
    min = min * 0.9;
    max = max * 1.1 || 1;
  }
  const margen = (max - min) * 0.15;
  min = Math.max(0, min - margen);
  max = max + margen;

  // El eje es de tiempo real: la distancia entre puntos depende de los días que pasaron.
  const t0 = puntos[0].t;
  const t1 = puntos.at(-1)!.t;
  const x = (t: number) => (t1 === t0 ? (izq + ancho - der) / 2 : izq + ((t - t0) * (ancho - izq - der)) / (t1 - t0));
  const y = (v: number) => arriba + ((max - v) * (alto - arriba - abajo)) / (max - min);
  const xs = puntos.map((p) => x(p.t));
  const ys = puntos.map((p) => y(p.value));

  // Fondo por rutina, solo en la vista por semana: en mes y año se amontonaría.
  const franjas: { desde: number; hasta: number; rutinaId: number }[] = [];
  if (periodo === "semana") {
    puntos.forEach((p, i) => {
      const ultima = franjas.at(-1);
      if (ultima && ultima.rutinaId === p.routineId) ultima.hasta = i;
      else franjas.push({ desde: i, hasta: i, rutinaId: p.routineId });
    });
  }
  const rutinas: { id: number; nombre: string }[] = [];
  for (const p of puntos) {
    if (!rutinas.some((r) => r.id === p.routineId)) rutinas.push({ id: p.routineId, nombre: p.routineName });
  }
  const colorDe = (rutinaId: number) => FONDOS[rutinas.findIndex((r) => r.id === rutinaId) % FONDOS.length];
  const bordeIzq = (f: { desde: number }) => (f.desde === 0 ? izq : (xs[f.desde - 1] + xs[f.desde]) / 2);
  const bordeDer = (f: { hasta: number }) =>
    f.hasta === puntos.length - 1 ? ancho - der : (xs[f.hasta] + xs[f.hasta + 1]) / 2;

  const paso = max - min > 40 ? 10 : max - min > 8 ? 5 : 1;
  const lineasGuia = [
    Math.ceil(min / paso) * paso,
    Math.round((min + max) / 2 / paso) * paso,
    Math.floor(max / paso) * paso,
  ].filter((v, i, todos) => todos.indexOf(v) === i);

  // Marcas del eje de tiempo: hasta 5, parejas en el tiempo.
  const cantidad = t1 === t0 ? 1 : 5;
  const marcas = Array.from({ length: cantidad }, (_, i) => t0 + ((t1 - t0) * i) / Math.max(1, cantidad - 1));
  const textoMarca = (t: number) => {
    const f = new Date(t);
    if (periodo === "anio") return String(f.getUTCFullYear());
    if (periodo === "mes" || t1 - t0 > 200 * DIA) {
      return f.toLocaleDateString("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(".", "");
    }
    return `${f.getUTCDate()}/${f.getUTCMonth() + 1}`;
  };

  const mostrado = Math.min(activo ?? puntos.length - 1, puntos.length - 1);
  const p = puntos[mostrado];
  const mejora =
    historial.weeks_with_data >= 2 && historial.first_value !== null && historial.last_value !== null
      ? historial.last_value - historial.first_value
      : null;
  const resumen = puntos.map((q) => `${q.etiqueta} (${q.routineName}): ${numero(q.value)} ${unidad}`).join(", ");

  // Al pasar el dedo o el mouse por el gráfico, se elige el punto más cercano en horizontal.
  function elegir(e: React.PointerEvent<SVGSVGElement>) {
    const caja = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - caja.left) / caja.width) * ancho;
    let cerca = 0;
    xs.forEach((vx, i) => {
      if (Math.abs(vx - px) < Math.abs(xs[cerca] - px)) cerca = i;
    });
    setActivo(cerca);
  }

  const ancla = xs[mostrado] > ancho * 0.6 ? "end" : xs[mostrado] < ancho * 0.4 ? "start" : "middle";

  return (
    <>
      <div className="mb-1 flex items-start gap-3">
        <p className="mt-1 mb-0 flex-1 text-sm text-muted-foreground">
          {QUE_MIDE[historial.unit]}
          {periodo !== "semana" && ` · el mejor de cada ${periodo === "mes" ? "mes" : "año"}`}
        </p>
        <SelectorChip
          opciones={PERIODOS.map((o) => ({ id: o.id, texto: o.nombre }))}
          valor={periodo}
          etiqueta="Período"
          onElegir={(id) => {
            setPeriodo(id);
            setActivo(null);
          }}
        />
      </div>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="w-full touch-pan-y"
        role="img"
        aria-label={`${historial.name}, ${QUE_MIDE[historial.unit].toLowerCase()}: ${resumen}.`}
        onPointerMove={elegir}
        onPointerDown={elegir}
        onPointerLeave={() => setActivo(null)}
      >
        {franjas.map((f, i) => (
          <rect
            key={i}
            x={bordeIzq(f)}
            y={arriba - 8}
            width={bordeDer(f) - bordeIzq(f)}
            height={alto - arriba - abajo + 8}
            className={colorDe(f.rutinaId).banda}
          />
        ))}
        {lineasGuia.map((v, i) => (
          <g key={i}>
            <line x1={izq} x2={ancho - der} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth="1" />
            <text x={izq - 6} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[11px]">
              {numero(v)}
            </text>
          </g>
        ))}
        {marcas.map((t, i) => (
          <text
            key={i}
            x={x(t)}
            y={alto - 8}
            textAnchor={cantidad > 1 && i === 0 ? "start" : cantidad > 1 && i === cantidad - 1 ? "end" : "middle"}
            className="fill-muted-foreground text-[11px]"
          >
            {textoMarca(t)}
          </text>
        ))}
        {/* El área bajo la curva, hasta el eje X: da idea de algo completo. */}
        {puntos.length > 1 && (
          <path
            d={`${curva(xs, ys)} L ${xs.at(-1)!.toFixed(1)} ${alto - abajo} L ${xs[0].toFixed(1)} ${alto - abajo} Z`}
            className="fill-disco-verde/15 stroke-none"
          />
        )}
        {puntos.length > 1 && (
          <path
            d={curva(xs, ys)}
            fill="none"
            className="stroke-disco-verde"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {/* Sin círculos en cada dato: solo el récord y el punto que estás mirando. */}
        <circle cx={xs[indiceRecord]} cy={ys[indiceRecord]} r={5} className="fill-disco-verde stroke-card" strokeWidth="2" />
        {mostrado !== indiceRecord && (
          <circle cx={xs[mostrado]} cy={ys[mostrado]} r={4.5} className="fill-card stroke-disco-verde" strokeWidth="2.5" />
        )}
        <text x={xs[mostrado]} y={ys[mostrado] - 12} textAnchor={ancla} className="fill-foreground text-[11px] font-semibold">
          {numero(p.value)} {unidad}
          {mostrado === indiceRecord ? " · récord" : ""} · {p.etiqueta}
        </text>
      </svg>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Dato titulo="Récord" valor={`${numero(historial.record!)} ${unidad}`} />
        <Dato titulo="Semanas" valor={String(historial.weeks_with_data)} />
        <Dato
          titulo="Desde la primera"
          valor={mejora === null ? "—" : `${mejora > 0 ? "+" : ""}${numero(mejora)} ${unidad}`}
        />
      </div>

      {/* La misma información como tabla, para lectores de pantalla. Va dentro de una caja de 1 px:
          una tabla `sr-only` ignora el ancho de 1 px, mide lo que mide su texto (sin cortes de
          línea) y ensancha toda la página en el celular, la barra de abajo incluida. */}
      <div className="relative h-px w-px overflow-hidden">
        <table className="sr-only">
          <caption>{historial.name}</caption>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Rutina</th>
              <th>{QUE_MIDE[historial.unit]}</th>
            </tr>
          </thead>
          <tbody>
            {puntos.map((q) => (
              <tr key={q.t}>
                <td>{q.etiqueta}</td>
                <td>{q.routineName}</td>
                <td>{`${numero(q.value)} ${unidad}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function Dato({ titulo, valor }: { titulo: string; valor: string }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2">
      <p className="m-0 text-xs text-muted-foreground">{titulo}</p>
      <p className="m-0 font-heading text-xl font-bold">{valor}</p>
    </div>
  );
}
