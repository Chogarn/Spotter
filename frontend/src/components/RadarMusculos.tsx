"use client";

import { useEffect, useState } from "react";

import { InlineError } from "@/components/ErrorMessage";
import { apiFetch, readError, type WeekMuscles } from "@/lib/api";

const NOMBRE: Record<string, string> = {
  chest: "Pecho",
  back: "Espalda",
  shoulders: "Hombros",
  quadriceps: "Cuádriceps",
  hamstrings: "Isquios",
  glutes: "Glúteos",
};

// Geometría del hexágono: el centro, el radio hasta el borde y a qué distancia van los rótulos.
const CX = 170;
const CY = 145;
const RADIO = 92;
const RADIO_ROTULO = RADIO + 30;

function punto(i: number, total: number, fraccion: number, radio = RADIO): [number, number] {
  const angulo = -Math.PI / 2 + (i * 2 * Math.PI) / total;
  return [CX + radio * fraccion * Math.cos(angulo), CY + radio * fraccion * Math.sin(angulo)];
}

const poligono = (puntos: [number, number][]) => puntos.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");

// Progreso › Estadísticas: las series hechas en la última semana por cada grupo grande, contra el
// mínimo de R3 (10) y contra la semana cerrada anterior de la rutina. Solo cuenta series directas.
export function RadarMusculos() {
  const [datos, setDatos] = useState<WeekMuscles | null>(null);
  const [vacio, setVacio] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/weeks/muscles`)
      .then(async (res) => {
        if (res.status === 404) return setVacio(true);
        if (!res.ok) throw new Error(await readError(res));
        setDatos(await res.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) return <InlineError>{error}</InlineError>;
  if (vacio) {
    return (
      <section className="mt-4 mb-3 rounded-2xl bg-card p-6 text-center">
        <p className="mt-0 mb-1 font-medium">Todavía no hay series para mostrar</p>
        <p className="m-0 text-sm text-muted-foreground">
          Cuando tengas una semana, acá vas a ver cuántas series hiciste por músculo.
        </p>
      </section>
    );
  }
  if (!datos) return null;

  const grupos = datos.muscles;
  const total = grupos.length;
  const maximo = Math.max(14, ...grupos.flatMap((g) => [g.sets, g.previous_sets ?? 0]));
  const fraccion = (v: number) => v / maximo;
  const faltan = grupos.filter((g) => g.sets < datos.minimum);
  const verbo = datos.status === "active" ? "faltan" : "faltaron";

  const resumen = grupos
    .map(
      (g) =>
        `${NOMBRE[g.muscle] ?? g.muscle}: ${g.sets} series${g.previous_sets === null ? "" : `, antes ${g.previous_sets}`}`,
    )
    .join("; ");

  return (
    <section className="mt-4 mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-1 font-heading text-xl font-bold">Series por músculo</h3>
      <p className="mt-0 mb-1 text-sm text-muted-foreground">
        Semana {datos.number} de {datos.routine_name} · series directas hechas
      </p>
      <svg
        viewBox="0 0 340 290"
        className="w-full"
        role="img"
        aria-label={`Series hechas por músculo contra el mínimo de ${datos.minimum}. ${resumen}.`}
      >
        {[0.25, 0.5, 0.75, 1].map((f) => (
          <polygon
            key={f}
            points={poligono(grupos.map((_, i) => punto(i, total, f)))}
            className="fill-none stroke-border"
            strokeWidth={1}
          />
        ))}
        {grupos.map((_, i) => {
          const [x, y] = punto(i, total, 1);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} className="stroke-border" />;
        })}
        {/* El mínimo de R3, siempre a la vista. */}
        <polygon
          points={poligono(grupos.map((_, i) => punto(i, total, fraccion(datos.minimum))))}
          className="fill-none stroke-disco-rojo"
          strokeWidth={1.5}
          strokeDasharray="5 4"
        />
        {datos.has_previous && (
          <polygon
            points={poligono(grupos.map((g, i) => punto(i, total, fraccion(g.previous_sets ?? 0))))}
            className="fill-muted-foreground/15 stroke-muted-foreground"
            strokeWidth={2}
          />
        )}
        <polygon
          points={poligono(grupos.map((g, i) => punto(i, total, fraccion(g.sets))))}
          className="fill-disco-azul/15 stroke-disco-azul"
          strokeWidth={2.5}
        />
        {grupos.map((g, i) => {
          const [px, py] = punto(i, total, fraccion(g.sets));
          const [lx, ly] = punto(i, total, 1, RADIO_ROTULO);
          const ancla = Math.abs(lx - CX) < 5 ? "middle" : lx > CX ? "start" : "end";
          const corto = g.sets < datos.minimum;
          return (
            <g key={g.muscle}>
              <circle cx={px} cy={py} r={4} className="fill-disco-azul stroke-background" strokeWidth={2} />
              <text x={lx} y={ly - 3} textAnchor={ancla} fontSize={12} className="fill-muted-foreground">
                {NOMBRE[g.muscle] ?? g.muscle}
              </text>
              <text
                x={lx}
                y={ly + 13}
                textAnchor={ancla}
                fontSize={15}
                fontWeight={600}
                className={corto ? "fill-disco-rojo" : "fill-disco-azul"}
              >
                {g.sets}
                <tspan fontSize={11} fontWeight={400} className="fill-muted-foreground">
                  {" "}
                  {g.sets === 1 ? "serie" : "series"}
                </tspan>
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-xs bg-disco-azul" aria-hidden="true" />
          Esta semana
        </span>
        {datos.has_previous && (
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-muted-foreground" aria-hidden="true" />
            Semana pasada
          </span>
        )}
        <span className="flex items-center gap-1.5">
          <span className="w-3.5 border-t-2 border-dashed border-disco-rojo" aria-hidden="true" />
          Mínimo {datos.minimum} series
        </span>
      </div>
      <p className="mt-3 mb-0 rounded-xl bg-background px-3 py-2.5 text-sm">
        {faltan.length === 0
          ? `Llegaste al mínimo de ${datos.minimum} series en los seis grupos.`
          : `Te ${verbo} series de ${faltan
              .map((g) => `${(NOMBRE[g.muscle] ?? g.muscle).toLowerCase()} (${g.sets} de ${datos.minimum})`)
              .join(", ")}.`}
      </p>
    </section>
  );
}
