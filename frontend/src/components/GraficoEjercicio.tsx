"use client";

import { useEffect, useState } from "react";

import { InlineError } from "@/components/ErrorMessage";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { readError, apiFetch, type ExerciseHistory, type RoutineExercise } from "@/lib/api";

const UNIDAD: Record<ExerciseHistory["unit"], string> = { kg: "kg", reps: "reps", s: "s", min: "min" };
const QUE_MIDE: Record<ExerciseHistory["unit"], string> = {
  kg: "Mayor peso levantado por semana",
  reps: "Más repeticiones en una serie, por semana",
  s: "Más segundos en una serie, por semana",
  min: "Minutos de la semana",
};

function numero(v: number): string {
  return v.toLocaleString("es-AR", { maximumFractionDigits: 1 });
}

// Progreso (#62): la evolución de un ejercicio a lo largo de las semanas de la rutina. Una sola
// línea en azul (el color de la carga), un punto por semana con lo mejor realizado y el récord
// marcado. Las semanas sin registros no se unen ni se inventan.
export function GraficoEjercicio({ rutinaId }: { rutinaId: number }) {
  const [ejercicios, setEjercicios] = useState<RoutineExercise[] | null>(null);
  const [ejercicioId, setEjercicioId] = useState<number | null>(null);
  const [historial, setHistorial] = useState<ExerciseHistory | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/routines/${rutinaId}/exercises`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        const lista: RoutineExercise[] = await res.json();
        setEjercicios(lista);
        setEjercicioId(lista[0]?.id ?? null);
      })
      .catch((e) => setError(e.message));
  }, [rutinaId]);

  useEffect(() => {
    if (ejercicioId === null) return;
    apiFetch(`/routines/${rutinaId}/exercises/${ejercicioId}/history`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setHistorial(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [rutinaId, ejercicioId]);

  if (ejercicios !== null && ejercicios.length === 0) return null;

  return (
    <section className="mt-4 mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-2 font-heading text-xl font-bold">Evolución</h3>
      {ejercicios && (
        <NativeSelect
          aria-label="Ejercicio"
          className="mb-3 w-full"
          value={ejercicioId ?? ""}
          onChange={(e) => setEjercicioId(Number(e.target.value))}
        >
          {ejercicios.map((e) => (
            <NativeSelectOption key={e.id} value={e.id}>
              {e.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
      )}
      {error && <InlineError>{error}</InlineError>}
      {historial && historial.exercise_id === ejercicioId && <Linea historial={historial} />}
    </section>
  );
}

function Linea({ historial }: { historial: ExerciseHistory }) {
  const [activo, setActivo] = useState<number | null>(null);
  const unidad = UNIDAD[historial.unit];
  const puntos = historial.weeks;
  const valores = puntos.map((p) => p.value).filter((v): v is number => v !== null);

  if (valores.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">Todavía no registraste este ejercicio.</p>;
  }

  // Geometría: margen a la izquierda para los valores del eje y abajo para las semanas.
  const ancho = 320;
  const alto = 170;
  const izq = 36;
  const der = 14;
  const arriba = 22;
  const abajo = 24;
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (min === max) {
    min = min * 0.9;
    max = max * 1.1 || 1;
  }
  const margen = (max - min) * 0.15;
  min = Math.max(0, min - margen);
  max = max + margen;
  const x = (i: number) =>
    puntos.length === 1 ? (izq + ancho - der) / 2 : izq + (i * (ancho - izq - der)) / (puntos.length - 1);
  const y = (v: number) => arriba + ((max - v) * (alto - arriba - abajo)) / (max - min);

  // Tramos de semanas seguidas con datos: un hueco corta la línea (no se inventa el valor).
  const tramos: { i: number; v: number }[][] = [];
  puntos.forEach((p, i) => {
    if (p.value === null) return;
    const anterior = tramos.at(-1);
    if (anterior && anterior.at(-1)!.i === i - 1) anterior.push({ i, v: p.value });
    else tramos.push([{ i, v: p.value }]);
  });
  // Tres líneas guía en valores redondos (de a 1, 5 o 10 según el rango), para que el eje se lea fácil.
  const paso = max - min > 40 ? 10 : max - min > 8 ? 5 : 1;
  const lineasGuia = [
    Math.ceil(min / paso) * paso,
    Math.round((min + max) / 2 / paso) * paso,
    Math.floor(max / paso) * paso,
  ].filter((v, i, todos) => todos.indexOf(v) === i);
  const indiceRecord = puntos.findIndex((p) => p.value === historial.record);
  const mostrado = activo ?? puntos.length - 1;
  const etiqueta = puntos[mostrado]?.value !== null ? mostrado : indiceRecord;
  const resumen = puntos
    .map((p) => `semana ${p.number}: ${p.value === null ? "sin registrar" : `${numero(p.value)} ${unidad}`}`)
    .join(", ");

  return (
    <>
      <p className="mt-0 mb-1 text-sm text-muted-foreground">
        {QUE_MIDE[historial.unit]} · récord: <span className="font-medium text-foreground">{numero(historial.record!)} {unidad}</span>
      </p>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="w-full"
        role="img"
        aria-label={`${historial.name}, ${QUE_MIDE[historial.unit].toLowerCase()}: ${resumen}.`}
      >
        {lineasGuia.map((v, i) => (
          <g key={i}>
            <line x1={izq} x2={ancho - der} y1={y(v)} y2={y(v)} className="stroke-border" strokeWidth="1" />
            <text x={izq - 6} y={y(v) + 4} textAnchor="end" className="fill-muted-foreground text-[10px]">
              {numero(v)}
            </text>
          </g>
        ))}
        {puntos.map((p, i) => (
          <text key={p.week_id} x={x(i)} y={alto - 6} textAnchor="middle" className="fill-muted-foreground text-[10px]">
            S{p.number}
          </text>
        ))}
        {tramos.map((tramo, i) =>
          tramo.length > 1 ? (
            <polyline
              key={i}
              points={tramo.map((p) => `${x(p.i)},${y(p.v)}`).join(" ")}
              fill="none"
              className="stroke-disco-azul"
              strokeWidth="2"
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
                r={i === indiceRecord ? 6 : 4}
                className="fill-disco-azul stroke-card"
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
            y={y(puntos[etiqueta].value!) - 11}
            // Cerca de un borde, el texto se alinea hacia adentro para que no se corte.
            textAnchor={x(etiqueta) > ancho * 0.7 ? "end" : x(etiqueta) < ancho * 0.3 ? "start" : "middle"}
            className="fill-foreground text-[11px] font-semibold"
          >
            {numero(puntos[etiqueta].value!)} {unidad}
            {etiqueta === indiceRecord ? " · récord" : ""}
          </text>
        )}
      </svg>
      {/* La misma información como tabla, para lectores de pantalla. */}
      <table className="sr-only">
        <caption>{historial.name}</caption>
        <thead>
          <tr>
            <th>Semana</th>
            <th>{QUE_MIDE[historial.unit]}</th>
          </tr>
        </thead>
        <tbody>
          {puntos.map((p) => (
            <tr key={p.week_id}>
              <td>{p.number}</td>
              <td>{p.value === null ? "sin registrar" : `${numero(p.value)} ${unidad}`}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </>
  );
}
