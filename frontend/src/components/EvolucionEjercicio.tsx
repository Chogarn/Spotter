"use client";

import { useEffect, useState } from "react";

import { BuscarEjercicio } from "@/components/BuscarEjercicio";
import { InlineError } from "@/components/ErrorMessage";
import { readError, apiFetch, type ExerciseOption, type ExerciseTimeline } from "@/lib/api";
import { shortDate } from "@/lib/format";

const UNIDAD: Record<ExerciseTimeline["unit"], string> = { kg: "kg", reps: "reps", s: "s", min: "min" };
const QUE_MIDE: Record<ExerciseTimeline["unit"], string> = {
  kg: "Mayor peso levantado por semana",
  reps: "Más repeticiones en una serie, por semana",
  s: "Más segundos en una serie, por semana",
  min: "Minutos de la semana",
};

// Un color de fondo suave por rutina, en el orden en que aparecen (decisión 69).
const FONDOS = [
  { banda: "fill-disco-amarillo/25", pastilla: "bg-disco-amarillo/40" },
  { banda: "fill-disco-azul/15", pastilla: "bg-disco-azul/20" },
  { banda: "fill-disco-verde/20", pastilla: "bg-disco-verde/30" },
  { banda: "fill-disco-rojo/15", pastilla: "bg-disco-rojo/20" },
];

// "22/10": en el eje alcanza con día y mes (el año completo va en la versión para lectores).
function diaYMes(iso: string): string {
  const [, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}`;
}

function numero(v: number): string {
  return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
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

  if (ejercicios !== null && ejercicios.length === 0) return null;

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
  const unidad = UNIDAD[historial.unit];
  const puntos = historial.points;
  const valores = puntos.map((p) => p.value).filter((v): v is number => v !== null);

  if (valores.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">Todavía no registraste este ejercicio.</p>;
  }

  // Las rutinas, en el orden en que aparecen, cada una con su color de fondo.
  const rutinas: { id: number; nombre: string; semanas: number }[] = [];
  for (const p of puntos) {
    const existente = rutinas.find((r) => r.id === p.routine_id);
    if (existente) existente.semanas += 1;
    else rutinas.push({ id: p.routine_id, nombre: p.routine_name, semanas: 1 });
  }
  const colorDe = (rutinaId: number) => FONDOS[rutinas.findIndex((r) => r.id === rutinaId) % FONDOS.length];

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
  // Los puntos van parejos, en el orden de las fechas (dos semanas del mismo día no se pisan).
  const x = (i: number) =>
    puntos.length === 1 ? (izq + ancho - der) / 2 : izq + (i * (ancho - izq - der)) / (puntos.length - 1);
  const y = (v: number) => arriba + ((max - v) * (alto - arriba - abajo)) / (max - min);

  // Las franjas de fondo: una por tramo de semanas seguidas de la misma rutina.
  const franjas: { desde: number; hasta: number; rutinaId: number }[] = [];
  puntos.forEach((p, i) => {
    const ultima = franjas.at(-1);
    if (ultima && ultima.rutinaId === p.routine_id) ultima.hasta = i;
    else franjas.push({ desde: i, hasta: i, rutinaId: p.routine_id });
  });
  const bordeIzq = (f: { desde: number }) => (f.desde === 0 ? izq : (x(f.desde - 1) + x(f.desde)) / 2);
  const bordeDer = (f: { hasta: number }) =>
    f.hasta === puntos.length - 1 ? ancho - der : (x(f.hasta) + x(f.hasta + 1)) / 2;

  // Tramos de semanas seguidas con datos: un hueco corta la línea (no se inventa el valor).
  const tramos: { i: number; v: number }[][] = [];
  puntos.forEach((p, i) => {
    if (p.value === null) return;
    const anterior = tramos.at(-1);
    if (anterior && anterior.at(-1)!.i === i - 1) anterior.push({ i, v: p.value });
    else tramos.push([{ i, v: p.value }]);
  });
  const paso = max - min > 40 ? 10 : max - min > 8 ? 5 : 1;
  const lineasGuia = [
    Math.ceil(min / paso) * paso,
    Math.round((min + max) / 2 / paso) * paso,
    Math.floor(max / paso) * paso,
  ].filter((v, i, todos) => todos.indexOf(v) === i);
  const indiceRecord = puntos.findIndex((p) => p.value === historial.record);
  let ultimoConDato = -1;
  puntos.forEach((p, i) => {
    if (p.value !== null) ultimoConDato = i;
  });
  const mostrado = activo ?? (ultimoConDato >= 0 ? ultimoConDato : indiceRecord);
  const etiqueta = puntos[mostrado]?.value !== null ? mostrado : indiceRecord;
  // Para no amontonar las fechas, se muestra una de cada tanto (siempre la primera y la última).
  const cada = Math.ceil(puntos.length / 5);
  const mostrarFecha = (i: number) => i === 0 || i === puntos.length - 1 || i % cada === 0;

  const mejora =
    historial.weeks_with_data >= 2 && historial.first_value !== null && historial.last_value !== null
      ? historial.last_value - historial.first_value
      : null;
  const resumen = puntos
    .map(
      (p) =>
        `${p.week_start ? shortDate(p.week_start) : "semana"} (${p.routine_name}): ${
          p.value === null ? "sin registrar" : `${numero(p.value)} ${unidad}`
        }`,
    )
    .join(", ");

  return (
    <>
      <p className="mt-0 mb-1 text-sm text-muted-foreground">{QUE_MIDE[historial.unit]}</p>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="w-full"
        role="img"
        aria-label={`${historial.name}, ${QUE_MIDE[historial.unit].toLowerCase()}: ${resumen}.`}
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
            <text x={izq - 6} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
              {numero(v)}
            </text>
          </g>
        ))}
        {puntos.map((p, i) =>
          mostrarFecha(i) ? (
            <text key={p.week_id} x={x(i)} y={alto - 8} textAnchor="middle" className="fill-muted-foreground text-[10px]">
              {p.week_start ? diaYMes(p.week_start) : `S${p.number}`}
            </text>
          ) : null,
        )}
        {tramos.map((tramo, i) =>
          tramo.length > 1 ? (
            <polyline
              key={i}
              points={tramo.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")}
              fill="none"
              className="stroke-disco-tinta"
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null,
        )}
        {puntos.map((p, i) =>
          p.value === null ? null : (
            <g key={p.week_id}>
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r={i === indiceRecord ? 7 : 4.5}
                className={i === indiceRecord ? "fill-disco-amarillo stroke-disco-tinta" : "fill-disco-rojo stroke-card"}
                strokeWidth="2"
              />
              {/* Área para tocar, más grande que el punto. */}
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r="16"
                fill="transparent"
                onPointerEnter={() => setActivo(i)}
                onClick={() => setActivo(i)}
                className="cursor-pointer"
              />
            </g>
          ),
        )}
        {etiqueta >= 0 && puntos[etiqueta].value !== null && (
          <text
            x={x(etiqueta)}
            y={y(puntos[etiqueta].value!) - 12}
            textAnchor={x(etiqueta) > ancho * 0.7 ? "end" : x(etiqueta) < ancho * 0.3 ? "start" : "middle"}
            className="fill-foreground text-[11px] font-semibold"
          >
            {numero(puntos[etiqueta].value!)} {unidad}
            {etiqueta === indiceRecord ? " · récord" : ""}
          </text>
        )}
      </svg>

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {rutinas.map((r) => (
          <span key={r.id} className={`rounded-full px-2.5 py-0.5 text-xs ${colorDe(r.id).pastilla}`}>
            {r.nombre}
          </span>
        ))}
        {rutinas.length > 1 && (
          <span className="text-xs text-muted-foreground">El fondo cambia con cada rutina</span>
        )}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <Dato titulo="Récord" valor={`${numero(historial.record!)} ${unidad}`} />
        <Dato titulo="Semanas" valor={String(historial.weeks_with_data)} />
        <Dato
          titulo="Desde la primera"
          valor={mejora === null ? "—" : `${mejora > 0 ? "+" : ""}${numero(mejora)} ${unidad}`}
        />
      </div>

      {/* La misma información como tabla, para lectores de pantalla. */}
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
          {puntos.map((p) => (
            <tr key={p.week_id}>
              <td>{p.week_start ? shortDate(p.week_start) : `semana ${p.number}`}</td>
              <td>{p.routine_name}</td>
              <td>{p.value === null ? "sin registrar" : `${numero(p.value)} ${unidad}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
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
