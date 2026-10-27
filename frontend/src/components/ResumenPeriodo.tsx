"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ComoTeFueResumen } from "@/components/ComoTeFueResumen";
import { ErrorMessage } from "@/components/ErrorMessage";
import { CargandoDiscos } from "@/components/Cargando";
import { apiFetch, readError, type PeriodBucket, type PeriodSummary } from "@/lib/api";
import { cn } from "cn";

export type Tramo = "day" | "week" | "month" | "year";

// "2026-10-07" → "2026-10-08": las cuentas de fecha se hacen en UTC para no depender de la zona.
export function sumar(iso: string, tramo: Tramo, n: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, tramo === "day" ? d + n : tramo === "week" ? d + 7 * n : 1));
  if (tramo === "month") f.setUTCMonth(f.getUTCMonth() + n);
  if (tramo === "year") f.setUTCFullYear(f.getUTCFullYear() + n);
  return f.toISOString().slice(0, 10);
}

// El primer día del tramo al que pertenece la fecha, para comparar tramos entre sí.
export function inicioDe(iso: string, tramo: Tramo): string {
  if (tramo === "week") {
    // El lunes de esa semana (getUTCDay: 0 es domingo).
    const f = new Date(`${iso}T00:00:00Z`);
    f.setUTCDate(f.getUTCDate() - ((f.getUTCDay() + 6) % 7));
    return f.toISOString().slice(0, 10);
  }
  return tramo === "day" ? iso : tramo === "month" ? `${iso.slice(0, 7)}-01` : `${iso.slice(0, 4)}-01-01`;
}

function titulo(iso: string, tramo: Tramo): string {
  if (tramo === "day") return iso.split("-").reverse().join("/"); // 27/10/2026
  if (tramo === "week") {
    const lunes = inicioDe(iso, "week");
    const corto = (d: string) =>
      new Date(`${d}T00:00:00Z`).toLocaleDateString("es-AR", { day: "numeric", month: "short", timeZone: "UTC" }).replace(".", "");
    return `${corto(lunes)} al ${corto(sumar(lunes, "day", 6))}`;
  }
  const f = new Date(`${iso}T00:00:00Z`);
  const opciones: Intl.DateTimeFormatOptions =
    tramo === "month" ? { month: "long", year: "numeric" } : { year: "numeric" };
  const texto = f.toLocaleDateString("es-AR", { ...opciones, timeZone: "UTC" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// La fecha de hoy en el aparato de la persona. Solo se lee en el navegador (Next 16 con
// cacheComponents no deja leer la hora al preparar la página): antes de eso vale null.
function hoyLocal(): string {
  const f = new Date();
  return `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, "0")}-${String(f.getDate()).padStart(2, "0")}`;
}
const sinSuscripcion = () => () => {};

// Hoy, o null mientras se prepara la página.
export function useHoy(): string | null {
  return useSyncExternalStore<string | null>(sinSuscripcion, hoyLocal, () => null);
}

const num = (v: number) => Math.round(v).toLocaleString("es-AR");

// Las cifras de arriba que se pueden tocar para ver el gráfico de esa métrica (por día o por mes).
type Metrica = "days" | "sets" | "kg" | "cardio" | "min";
const METRICAS: Record<Metrica, { titulo: string; unidad: string; valor: (b: PeriodBucket) => number }> = {
  days: { titulo: "Días entrenados", unidad: "días", valor: (b) => b.days_trained },
  sets: { titulo: "Series hechas", unidad: "series", valor: (b) => b.sets_done },
  kg: { titulo: "Kilos movidos", unidad: "kg", valor: (b) => b.kg_moved },
  cardio: { titulo: "Minutos de cardio", unidad: "min", valor: (b) => b.cardio_minutes },
  min: { titulo: "Minutos entrenando", unidad: "min", valor: (b) => b.duration_minutes },
};

// Progreso › Resúmenes, cuando se elige Día, Mes o Año (la semana tiene su propio resumen).
// Histórico, de todas las rutinas; solo lectura.
export function ResumenPeriodo({ tramo, selector }: { tramo: Tramo; selector?: React.ReactNode }) {
  const hoy = useHoy();
  const [ancla, setAncla] = useState<string | null>(null);
  const [datos, setDatos] = useState<PeriodSummary | null>(null);
  const [error, setError] = useState("");
  const [metrica, setMetrica] = useState<Metrica>("sets");
  const fecha = ancla ?? hoy;

  useEffect(() => {
    if (fecha === null) return;
    const tz = -new Date().getTimezoneOffset();
    apiFetch(`/progress/period?period=${tramo}&date=${fecha}&tz=${tz}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setDatos(await res.json());
        setError("");
      })
      .catch((e) => setError(e.message));
  }, [fecha, tramo]);

  if (error) return <ErrorMessage>{error}</ErrorMessage>;
  if (fecha === null || datos === null || datos.start !== inicioDe(fecha, tramo)) {
    // Mientras carga, la fila con el botón del período se queda quieta y las flechas esperan.
    return (
      <>
        <Navegador tramo={tramo} fecha={fecha} puedeRetroceder={false} puedeAvanzar={false} onIr={setAncla} selector={selector} />
        <CargandoDiscos />
      </>
    );
  }

  const puedeAvanzar = hoy !== null && inicioDe(fecha, tramo) < inicioDe(hoy, tramo);
  const puedeRetroceder = datos.first_date !== null && inicioDe(fecha, tramo) > inicioDe(datos.first_date, tramo);
  const sinNada = datos.days_trained === 0;
  const cartas: { id: Metrica; valor: string; texto: string; azul?: boolean }[] = [
    ...(tramo !== "day" ? [{ id: "days" as const, valor: String(datos.days_trained), texto: "días entrenados" }] : []),
    { id: "sets", valor: `${datos.sets_done}/${datos.sets_planned}`, texto: "series hechas" },
    { id: "kg", valor: num(datos.kg_moved), texto: "kg movidos", azul: true },
    ...(datos.cardio_minutes > 0 ? [{ id: "cardio" as const, valor: String(datos.cardio_minutes), texto: "min de cardio" }] : []),
    ...(datos.duration_minutes !== null ? [{ id: "min" as const, valor: String(datos.duration_minutes), texto: "min entrenando" }] : []),
  ];

  return (
    <>
      <Navegador
        tramo={tramo}
        fecha={fecha}
        puedeRetroceder={puedeRetroceder}
        puedeAvanzar={puedeAvanzar}
        onIr={setAncla}
        selector={selector}
      />

      {sinNada ? (
        <section className="rounded-2xl bg-card p-6 text-center">
          <p className="mt-0 mb-1 font-medium">
            {tramo === "day" ? "No entrenaste este día" : tramo === "week" ? "No entrenaste esta semana" : tramo === "month" ? "No entrenaste este mes" : "No entrenaste este año"}
          </p>
          <p className="m-0 text-sm text-muted-foreground">Cuenta cada día que marcaste como completado.</p>
        </section>
      ) : (
        <>
          {tramo === "day" && (
            <>
              <h2 className="mt-3 mb-0 text-4xl">{datos.sessions.map((s) => `Día ${s.day_index}`).join(" · ")}</h2>
              <p className="mt-0 text-muted-foreground">Completado · lo que hiciste este día</p>
            </>
          )}
          <div className="mb-4 grid grid-cols-2 gap-2">
            {cartas.map((c, i) => (
              <Numero
                key={c.id}
                valor={c.valor}
                texto={c.texto}
                azul={c.azul}
                // "Días entrenados" va solo y ancho arriba; si lo de abajo queda impar, la última también.
                ancha={c.id === "days" || (i === cartas.length - 1 && (cartas.length - (cartas[0].id === "days" ? 1 : 0)) % 2 === 1)}
                activa={tramo !== "day" && metrica === c.id}
                onElegir={tramo === "day" ? undefined : () => setMetrica(c.id)}
              />
            ))}
          </div>

          {tramo !== "day" && datos.buckets.length > 0 && <Barras datos={datos} tramo={tramo} metrica={metrica} />}
          {tramo === "day" && <ComoTeFueResumen ejercicios={datos.results} vacio="Este día no registraste series." />}
        </>
      )}
    </>
  );
}

// ‹ Octubre de 2026 ›: las flechas del día, mes o año, con el título del período.
export function Navegador({
  tramo,
  fecha,
  puedeRetroceder,
  puedeAvanzar,
  onIr,
  selector,
}: {
  tramo: Tramo;
  fecha: string | null;
  puedeRetroceder: boolean;
  puedeAvanzar: boolean;
  onIr: (fecha: string) => void;
  // El botón del período, a la izquierda de las flechas (una sola fila).
  selector?: React.ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center gap-1">
      {selector}
      <button
          type="button"
          onClick={() => fecha && onIr(sumar(fecha, tramo, -1))}
          disabled={!puedeRetroceder || fecha === null}
          aria-label={tramo === "day" ? "Día anterior" : tramo === "week" ? "Semana anterior" : tramo === "month" ? "Mes anterior" : "Año anterior"}
          className="grid size-9 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-25"
        >
          <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <h2 className="m-0 flex-1 text-center text-xl leading-tight">{fecha === null ? "" : titulo(fecha, tramo)}</h2>
      <button
          type="button"
          onClick={() => fecha && onIr(sumar(fecha, tramo, 1))}
          disabled={!puedeAvanzar || fecha === null}
          aria-label={tramo === "day" ? "Día siguiente" : tramo === "week" ? "Semana siguiente" : tramo === "month" ? "Mes siguiente" : "Año siguiente"}
          className="grid size-9 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-25"
        >
          <ChevronRight className="size-5" aria-hidden="true" />
      </button>
    </div>
  );
}

// Un salto redondo (1, 2, 5 por una potencia de 10) para que el tope del gráfico dé unas 4 líneas guía.
function niceStep(mayor: number): number {
  const crudo = mayor / 2;
  const pot = 10 ** Math.floor(Math.log10(crudo));
  const f = crudo / pot;
  return Math.max(1, (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * pot);
}

// Una barra por día (mes) o por mes (año): las series hechas. Con referencia: líneas guía con su
// valor a la izquierda y, al pasar el mouse o tocar una barra, el día y la cantidad arriba.
function Barras({ datos, tramo, metrica }: { datos: PeriodSummary; tramo: Tramo; metrica: Metrica }) {
  const { titulo: nombreMetrica, unidad, valor } = METRICAS[metrica];
  const [activo, setActivo] = useState<number | null>(null);
  const mayor = Math.max(1, ...datos.buckets.map(valor));
  // El tope del gráfico: un número redondo por encima de la barra más alta.
  const paso = niceStep(mayor);
  let tope = Math.ceil(mayor / paso) * paso;
  if (tope % 2 !== 0) tope += paso; // par, para que la línea del medio sea un número entero
  const guias = [tope, tope / 2, 0];
  const cada = tramo === "month" ? 5 : 1;
  const porDia = tramo !== "year";
  const resumen = datos.buckets
    .filter((b) => valor(b) > 0)
    .map((b) => `${b.label}: ${num(valor(b))} ${unidad}`)
    .join(", ");
  const elegido = activo === null ? null : datos.buckets[activo];
  const nombre = (b: PeriodBucket) =>
    porDia
      ? new Date(`${b.start}T00:00:00Z`).toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        })
      : new Date(`${b.start}T00:00:00Z`).toLocaleDateString("es-AR", { month: "long", timeZone: "UTC" });

  return (
    <section className="mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-1 font-heading text-xl font-bold">
        {nombreMetrica} {porDia ? "por día" : "por mes"}
      </h3>
      <p className="mt-0 mb-3 min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {elegido
          ? `${nombre(elegido).replace(/^./, (c) => c.toUpperCase())}: ${num(valor(elegido))} ${unidad}`
          : "Tocá una barra para ver el detalle"}
      </p>
      <div role="img" aria-label={`${nombreMetrica} ${porDia ? "por día" : "por mes"}. ${resumen}.`}>
        <div className="flex">
          {/* Los valores de las líneas guía. */}
          <div className="relative mr-2 h-32 w-8 shrink-0 text-right text-[11px] text-muted-foreground" aria-hidden="true">
            {guias.map((g, i) => (
              <span key={i} className="absolute right-0 -translate-y-1/2" style={{ top: `${(i / 2) * 100}%` }}>
                {g}
              </span>
            ))}
          </div>
          <div className="relative h-32 flex-1">
            {guias.map((g, i) => (
              <div
                key={i}
                className="absolute inset-x-0 border-t border-border"
                style={{ top: `${(i / 2) * 100}%` }}
                aria-hidden="true"
              />
            ))}
            <div className="absolute inset-0 flex items-end gap-[3px]" onPointerLeave={() => setActivo(null)}>
              {datos.buckets.map((b, i) => (
                <div
                  key={b.start}
                  className="flex h-full flex-1 cursor-pointer items-end"
                  onPointerEnter={() => setActivo(i)}
                  onClick={() => setActivo(activo === i ? null : i)}
                >
                  <div
                    className={cn(
                      "w-full rounded-t-sm",
                      valor(b) === 0 ? "bg-transparent" : activo === i ? "bg-disco-rojo" : "bg-disco-azul",
                    )}
                    style={{ height: `${(valor(b) / tope) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="mt-1 ml-10 flex gap-[3px] text-[11px] text-muted-foreground" aria-hidden="true">
          {datos.buckets.map((b, i) => (
            <span key={b.start} className="flex-1 text-center">
              {i % cada === 0 || tramo === "year" ? b.label : ""}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function Numero({
  valor,
  texto,
  azul = false,
  activa = false,
  ancha = false,
  onElegir,
}: {
  valor: string;
  texto: string;
  azul?: boolean;
  activa?: boolean;
  ancha?: boolean;
  onElegir?: () => void;
}) {
  const clases = cn(
    "rounded-xl bg-card px-2 py-3 text-center",
    ancha && "col-span-2",
    onElegir && "cursor-pointer outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
    activa && "ring-2 ring-disco-tinta",
  );
  const contenido = (
    <>
      <p className={cn("m-0 font-heading text-3xl leading-none font-bold", azul && "text-disco-azul")}>{valor}</p>
      <p className="m-0 mt-1 text-xs text-muted-foreground">{texto}</p>
    </>
  );
  return onElegir ? (
    <button type="button" onClick={onElegir} aria-pressed={activa} className={clases}>
      {contenido}
    </button>
  ) : (
    <div className={clases}>{contenido}</div>
  );
}
