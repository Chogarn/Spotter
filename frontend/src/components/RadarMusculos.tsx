"use client";

import { useEffect, useState } from "react";

import { InlineError } from "@/components/ErrorMessage";
import { inicioDe, Navegador, useHoy, type Tramo } from "@/components/ResumenPeriodo";
import { SelectorPeriodo, usePeriodo } from "@/components/SelectorPeriodo";
import { cn } from "cn";
import { apiFetch, readError, type MuscleSets, type PeriodMuscles, type WeekMuscles } from "@/lib/api";

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

// Lo que el radar necesita, venga de la semana o de un día, un mes o un año.
type Vista = {
  subtitulo: string;
  minimum: number | null; // nulo: sin línea de mínimo (el día)
  anterior: string | null; // cómo se llama el período con el que se compara; nulo si no hay
  actual: string;
  terminado: boolean; // si el período ya pasó (cambia "faltan" por "faltaron")
  muscles: MuscleSets[];
};

const ANTERIOR = { day: "Día anterior", month: "Mes anterior", year: "Año anterior" } as const;
const ACTUAL = { day: "Este día", month: "Este mes", year: "Este año" } as const;

function deLaSemana(d: WeekMuscles): Vista {
  return {
    subtitulo: `Semana ${d.number} de ${d.routine_name} · series directas hechas`,
    minimum: d.minimum,
    anterior: d.has_previous ? "Semana pasada" : null,
    actual: "Esta semana",
    terminado: d.status !== "active",
    muscles: d.muscles,
  };
}

function deUnPeriodo(d: PeriodMuscles, hoy: string | null): Vista {
  return {
    subtitulo: "Series directas hechas, de todas tus rutinas",
    minimum: d.minimum,
    anterior: ANTERIOR[d.period],
    actual: ACTUAL[d.period],
    terminado: hoy !== null && d.end < hoy,
    muscles: d.muscles,
  };
}

// Progreso › Estadísticas: las series hechas por cada grupo grande, contra el mínimo de R3 (10 por
// semana, escalado al período) y contra el período anterior. Solo cuenta series directas. La
// semana es la última (con la anterior de su rutina); día, mes y año se recorren con las flechas.
export function RadarMusculos() {
  const [periodo, setPeriodo] = usePeriodo();
  return (
    <section className="mt-4 mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-2 font-heading text-xl font-bold">Series por músculo</h3>
      <SelectorPeriodo periodo={periodo} onElegir={setPeriodo} />
      {periodo === "week" ? <DeLaSemana /> : <DeUnPeriodo key={periodo} tramo={periodo} />}
    </section>
  );
}

function DeLaSemana() {
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
  if (vacio) return <Vacio />;
  if (!datos) return null;
  return <Radar vista={deLaSemana(datos)} />;
}

function DeUnPeriodo({ tramo }: { tramo: Tramo }) {
  const hoy = useHoy();
  const [ancla, setAncla] = useState<string | null>(null);
  const [datos, setDatos] = useState<PeriodMuscles | null>(null);
  const [error, setError] = useState("");
  const fecha = ancla ?? hoy;

  useEffect(() => {
    if (fecha === null) return;
    const tz = -new Date().getTimezoneOffset();
    apiFetch(`/progress/muscles?period=${tramo}&date=${fecha}&tz=${tz}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setDatos(await res.json());
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [fecha, tramo]);

  if (error) return <InlineError>{error}</InlineError>;
  if (fecha === null || datos === null || datos.start !== inicioDe(fecha, tramo)) return null;

  return (
    <>
      <Navegador
        tramo={tramo}
        fecha={fecha}
        puedeRetroceder={datos.first_date !== null && inicioDe(fecha, tramo) > inicioDe(datos.first_date, tramo)}
        puedeAvanzar={hoy !== null && inicioDe(fecha, tramo) < inicioDe(hoy, tramo)}
        onIr={setAncla}
      />
      {datos.muscles.every((m) => m.sets === 0 && !m.previous_sets) ? (
        <Vacio />
      ) : (
        <Radar vista={deUnPeriodo(datos, hoy)} />
      )}
    </>
  );
}

function Vacio() {
  return (
    <div className="rounded-xl bg-background p-4 text-center">
      <p className="mt-0 mb-1 font-medium">Todavía no hay series para mostrar</p>
      <p className="m-0 text-sm text-muted-foreground">
        Cuando completes un día, acá vas a ver cuántas series hiciste por músculo.
      </p>
    </div>
  );
}

function Radar({ vista }: { vista: Vista }) {
  const [activo, setActivo] = useState<number | null>(null);
  const grupos = vista.muscles;
  const total = grupos.length;
  const minimo = vista.minimum;
  // El borde del hexágono: el mínimo con aire, o lo mayor que se haya hecho.
  const maximo = Math.max((minimo ?? 4) * 1.4, ...grupos.flatMap((g) => [g.sets, g.previous_sets ?? 0]));
  const fraccion = (v: number) => v / maximo;
  const faltan = minimo === null ? [] : grupos.filter((g) => g.sets < minimo);
  const verbo = vista.terminado ? "faltaron" : "faltan";
  const corto = (g: MuscleSets) => minimo !== null && g.sets < minimo;

  const resumen = grupos
    .map(
      (g) =>
        `${NOMBRE[g.muscle] ?? g.muscle}: ${g.sets} series${vista.anterior === null || g.previous_sets === null ? "" : `, antes ${g.previous_sets}`}`,
    )
    .join("; ");

  return (
    <>
      <p className="mt-0 mb-1 text-sm text-muted-foreground">{vista.subtitulo}</p>
      <svg
        viewBox="0 0 340 290"
        className="w-full"
        role="img"
        aria-label={`Series hechas por músculo${minimo === null ? "" : ` contra el mínimo de ${minimo}`}. ${resumen}.`}
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
        {/* El mínimo de R3, a la vista (no hay en el día). */}
        {minimo !== null && (
          <polygon
            points={poligono(grupos.map((_, i) => punto(i, total, fraccion(minimo))))}
            className="fill-none stroke-disco-rojo"
            strokeWidth={1.5}
            strokeDasharray="5 4"
          />
        )}
        {vista.anterior !== null && (
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
          return (
            <g key={g.muscle}>
              <circle
                cx={px}
                cy={py}
                r={activo === i ? 6 : 4}
                className={cn("stroke-background", corto(g) ? "fill-disco-rojo" : "fill-disco-azul")}
                strokeWidth={2}
              />
              <text
                x={lx}
                y={ly + 4}
                textAnchor={ancla}
                fontSize={13}
                className={cn("fill-foreground", activo === i && "font-semibold")}
              >
                {NOMBRE[g.muscle] ?? g.muscle}
              </text>
              {/* Zona para pasar el mouse o tocar: el punto y el nombre del músculo. */}
              <circle
                cx={px}
                cy={py}
                r={16}
                fill="transparent"
                className="cursor-pointer"
                onPointerEnter={() => setActivo(i)}
                onPointerLeave={() => setActivo(null)}
                onClick={() => setActivo(activo === i ? null : i)}
              />
              <rect
                x={ancla === "start" ? lx - 2 : ancla === "end" ? lx - 78 : lx - 40}
                y={ly - 12}
                width={80}
                height={22}
                fill="transparent"
                className="cursor-pointer"
                onPointerEnter={() => setActivo(i)}
                onPointerLeave={() => setActivo(null)}
                onClick={() => setActivo(activo === i ? null : i)}
              />
            </g>
          );
        })}
        {activo !== null && <Globo vista={vista} indice={activo} />}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-xs bg-disco-azul" aria-hidden="true" />
          {vista.actual}
        </span>
        {vista.anterior !== null && (
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-xs bg-muted-foreground" aria-hidden="true" />
            {vista.anterior}
          </span>
        )}
        {minimo !== null && (
          <span className="flex items-center gap-1.5">
            <span className="w-3.5 border-t-2 border-dashed border-disco-rojo" aria-hidden="true" />
            Mínimo {minimo} series
          </span>
        )}
      </div>
      {minimo !== null && (
        <p className="mt-3 mb-0 rounded-xl bg-background px-3 py-2.5 text-sm">
          {faltan.length === 0
            ? `Llegaste al mínimo de ${minimo} series en los seis grupos.`
            : `Te ${verbo} series de ${faltan
                .map((g) => `${(NOMBRE[g.muscle] ?? g.muscle).toLowerCase()} (${g.sets} de ${minimo})`)
                .join(", ")}.`}
        </p>
      )}
    </>
  );
}

// El globo con la cantidad de series del músculo que se está mirando, cerca de su punto.
function Globo({ vista, indice }: { vista: Vista; indice: number }) {
  const g = vista.muscles[indice];
  const total = vista.muscles.length;
  const minimo = vista.minimum;
  const maximo = Math.max((minimo ?? 4) * 1.4, ...vista.muscles.flatMap((m) => [m.sets, m.previous_sets ?? 0]));
  const [px, py] = punto(indice, total, g.sets / maximo);
  const lineas = [
    `${g.sets} ${g.sets === 1 ? "serie" : "series"}`,
    ...(vista.anterior !== null && g.previous_sets !== null ? [`${vista.anterior}: ${g.previous_sets}`] : []),
    ...(minimo !== null ? [`Mínimo: ${minimo}`] : []),
  ];
  const ancho = 128;
  const alto = 12 + lineas.length * 16;
  const x = Math.min(Math.max(px - ancho / 2, 4), 340 - ancho - 4);
  // Arriba del punto; si no entra, abajo.
  const y = py - alto - 12 < 4 ? py + 12 : py - alto - 12;
  return (
    <g pointerEvents="none" role="tooltip">
      <rect x={x} y={y} width={ancho} height={alto} rx={8} className="fill-disco-tinta" />
      {lineas.map((t, i) => (
        <text
          key={i}
          x={x + ancho / 2}
          y={y + 18 + i * 16}
          textAnchor="middle"
          fontSize={i === 0 ? 13 : 11}
          fontWeight={i === 0 ? 600 : 400}
          className="fill-white"
        >
          {t}
        </text>
      ))}
    </g>
  );
}
