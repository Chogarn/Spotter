"use client";

import { useState } from "react";

import { SelectorChip } from "@/components/SelectorPeriodo";
import { type Measurement } from "@/lib/api";
import { curva } from "@/lib/curva";
import { shortDate } from "@/lib/format";
import { cn } from "cn";

type Rango = "mes" | "anio" | "todo";
type Medida = "peso" | "grasa" | "imc";

const RANGOS: { id: Rango; texto: string }[] = [
  { id: "mes", texto: "Mes" },
  { id: "anio", texto: "Año" },
  { id: "todo", texto: "Todo" },
];

const MEDIDAS: Record<Medida, { texto: string; unidad: string; titulo: string }> = {
  peso: { texto: "Peso", unidad: "kg", titulo: "Evolución del peso" },
  grasa: { texto: "Grasa", unidad: "%", titulo: "Evolución de la grasa corporal" },
  imc: { texto: "IMC", unidad: "", titulo: "Evolución del IMC" },
};

const DIA = 86_400_000;
const tiempo = (iso: string) => {
  const [a, m, d] = iso.split("-").map(Number);
  return Date.UTC(a, m - 1, d);
};

function numero(v: number): string {
  return v.toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}

function valorDe(f: Measurement, medida: Medida): number | null {
  if (medida === "peso") return Number(f.weight_kg);
  if (medida === "grasa") return f.body_fat_pct === null ? null : Number(f.body_fat_pct);
  return f.bmi;
}

// La evolución del cuerpo: una curva continua por las mediciones, en una línea de tiempo con fechas
// reales. Se elige qué medida (peso, grasa o IMC) y cuánto tiempo mirar: el último mes, el último
// año o todo. La ventana termina en la última medición, no en hoy.
export function GraficoCuerpo({ filas }: { filas: Measurement[] }) {
  const [rango, setRango] = useState<Rango>("mes");
  const [medida, setMedida] = useState<Medida>("peso");
  const [activo, setActivo] = useState<number | null>(null);

  const hayGrasa = filas.some((f) => f.body_fat_pct !== null);
  const hayImc = filas.some((f) => f.bmi !== null);
  const medidas = (["peso", "grasa", "imc"] as Medida[]).filter(
    (m) => m === "peso" || (m === "grasa" && hayGrasa) || (m === "imc" && hayImc),
  );
  const m = medidas.includes(medida) ? medida : "peso";
  const { unidad, titulo } = MEDIDAS[m];

  const todos = [...filas]
    .reverse()
    .map((f) => ({ dia: f.measured_on, t: tiempo(f.measured_on), v: valorDe(f, m) }))
    .filter((p): p is { dia: string; t: number; v: number } => p.v !== null);

  if (todos.length === 0) {
    return <p className="m-0 text-sm text-muted-foreground">Cargá tu peso para ver cómo evoluciona.</p>;
  }

  const fin = todos.at(-1)!.t;
  const desde = rango === "mes" ? fin - 30 * DIA : rango === "anio" ? fin - 365 * DIA : -Infinity;
  const puntos = todos.filter((p) => p.t >= desde);

  const ancho = 340;
  const alto = 170;
  const izq = 46;
  const der = 14;
  const arriba = 22;
  const abajo = 26;
  const valores = puntos.map((p) => p.v);
  let min = Math.min(...valores);
  let max = Math.max(...valores);
  if (min === max) {
    min -= 1;
    max += 1;
  }
  const margen = (max - min) * 0.2;
  min -= margen;
  max += margen;

  // El eje es de tiempo real; la ventana "mes" y "año" siempre muestra su tramo completo.
  const t0 = rango === "todo" ? puntos[0].t : Math.max(desde, todos[0].t);
  const t1 = fin;
  const x = (t: number) => (t1 === t0 ? (izq + ancho - der) / 2 : izq + ((t - t0) * (ancho - izq - der)) / (t1 - t0));
  const y = (v: number) => arriba + ((max - v) * (alto - arriba - abajo)) / (max - min);
  const xs = puntos.map((p) => x(p.t));
  const ys = puntos.map((p) => y(p.v));
  const guias = [min + margen, (min + max) / 2, max - margen];

  const cantidad = t1 === t0 ? 1 : 5;
  const marcas = Array.from({ length: cantidad }, (_, i) => t0 + ((t1 - t0) * i) / Math.max(1, cantidad - 1));
  const textoMarca = (t: number) => {
    const f = new Date(t);
    if (t1 - t0 > 200 * DIA) {
      return f.toLocaleDateString("es-AR", { month: "short", year: "2-digit", timeZone: "UTC" }).replace(".", "");
    }
    return `${f.getUTCDate()}/${f.getUTCMonth() + 1}`;
  };

  const mostrado = Math.min(activo ?? puntos.length - 1, puntos.length - 1);
  const cambio = puntos.length >= 2 ? puntos.at(-1)!.v - puntos[0].v : null;
  const resumen = puntos.map((p) => `${shortDate(p.dia)}: ${numero(p.v)} ${unidad}`.trim()).join(", ");

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
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex gap-1.5" role="group" aria-label="Qué medida ver">
          {medidas.length > 1 &&
            medidas.map((id) => (
              <button
                key={id}
                type="button"
                aria-pressed={m === id}
                onClick={() => {
                  setMedida(id);
                  setActivo(null);
                }}
                className={cn(
                  "rounded-full px-3 py-1 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  m === id ? "bg-disco-tinta font-medium text-white" : "bg-muted text-muted-foreground",
                )}
              >
                {MEDIDAS[id].texto}
              </button>
            ))}
        </div>
        <SelectorChip
          opciones={RANGOS}
          valor={rango}
          etiqueta="Cuánto tiempo mirar"
          onElegir={(id) => {
            setRango(id);
            setActivo(null);
          }}
        />
      </div>
      <p className="mt-0 mb-1 text-sm text-muted-foreground">
        {cambio === null
          ? "Con una segunda medición en este tramo se ve el cambio."
          : cambio === 0
            ? "Sin cambios en este tramo."
            : `${cambio < 0 ? "Bajó" : "Subió"} ${numero(Math.abs(cambio))} ${unidad}`.trim() + " en este tramo."}
      </p>
      <svg
        viewBox={`0 0 ${ancho} ${alto}`}
        className="w-full touch-pan-y"
        role="img"
        aria-label={`${titulo}: ${resumen}.`}
        onPointerMove={elegir}
        onPointerDown={elegir}
        onPointerLeave={() => setActivo(null)}
      >
        {guias.map((v, i) => (
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
        {/* El área bajo la curva, hasta el eje X, como en la evolución por ejercicio. */}
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
        {/* Sin círculos en cada medición: solo la última y el punto que estás mirando. */}
        <circle
          cx={xs.at(-1)}
          cy={ys.at(-1)}
          r={5}
          className="fill-disco-verde stroke-card"
          strokeWidth="2"
        />
        {mostrado !== puntos.length - 1 && (
          <circle cx={xs[mostrado]} cy={ys[mostrado]} r={4.5} className="fill-card stroke-disco-verde" strokeWidth="2.5" />
        )}
        <text x={xs[mostrado]} y={ys[mostrado] - 12} textAnchor={ancla} className="fill-foreground text-[11px] font-semibold">
          {numero(puntos[mostrado].v)} {unidad} · {shortDate(puntos[mostrado].dia)}
        </text>
      </svg>
      {/* La misma información como tabla para lectores de pantalla, en una caja de 1 px (ver
          EvolucionEjercicio). */}
      <div className="relative h-px w-px overflow-hidden">
        <table className="sr-only">
          <caption>{titulo}</caption>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>{MEDIDAS[m].texto}</th>
            </tr>
          </thead>
          <tbody>
            {puntos.map((p) => (
              <tr key={p.dia}>
                <td>{shortDate(p.dia)}</td>
                <td>{numero(p.v)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
