"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ComoTeFueResumen } from "@/components/ComoTeFueResumen";
import { ErrorMessage } from "@/components/ErrorMessage";
import { CargandoDiscos } from "@/components/Cargando";
import { apiFetch, readError, type PeriodBucket, type PeriodSummary } from "@/lib/api";
import { cn } from "cn";

export type Tramo = "day" | "month" | "year";

// "2026-10-07" → "2026-10-08": las cuentas de fecha se hacen en UTC para no depender de la zona.
export function sumar(iso: string, tramo: Tramo, n: number): string {
  const [a, m, d] = iso.split("-").map(Number);
  const f = new Date(Date.UTC(a, m - 1, tramo === "day" ? d + n : 1));
  if (tramo === "month") f.setUTCMonth(f.getUTCMonth() + n);
  if (tramo === "year") f.setUTCFullYear(f.getUTCFullYear() + n);
  return f.toISOString().slice(0, 10);
}

// El primer día del tramo al que pertenece la fecha, para comparar tramos entre sí.
export function inicioDe(iso: string, tramo: Tramo): string {
  return tramo === "day" ? iso : tramo === "month" ? `${iso.slice(0, 7)}-01` : `${iso.slice(0, 4)}-01-01`;
}

function titulo(iso: string, tramo: Tramo): string {
  const f = new Date(`${iso}T00:00:00Z`);
  const opciones: Intl.DateTimeFormatOptions =
    tramo === "day"
      ? { weekday: "long", day: "numeric", month: "long", year: "numeric" }
      : tramo === "month"
        ? { month: "long", year: "numeric" }
        : { year: "numeric" };
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

// Progreso › Resúmenes, cuando se elige Día, Mes o Año (la semana tiene su propio resumen).
// Histórico, de todas las rutinas; solo lectura.
export function ResumenPeriodo({ tramo }: { tramo: Tramo }) {
  const hoy = useHoy();
  const [ancla, setAncla] = useState<string | null>(null);
  const [datos, setDatos] = useState<PeriodSummary | null>(null);
  const [error, setError] = useState("");
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
  if (fecha === null || datos === null || datos.start !== inicioDe(fecha, tramo)) return <CargandoDiscos />;

  const puedeAvanzar = hoy !== null && inicioDe(fecha, tramo) < inicioDe(hoy, tramo);
  const puedeRetroceder = datos.first_date !== null && inicioDe(fecha, tramo) > inicioDe(datos.first_date, tramo);
  const sinNada = datos.days_trained === 0;

  return (
    <>
      <Navegador
        tramo={tramo}
        fecha={fecha}
        puedeRetroceder={puedeRetroceder}
        puedeAvanzar={puedeAvanzar}
        onIr={setAncla}
      />

      {sinNada ? (
        <section className="rounded-2xl bg-card p-6 text-center">
          <p className="mt-0 mb-1 font-medium">
            {tramo === "day" ? "No entrenaste este día" : tramo === "month" ? "No entrenaste este mes" : "No entrenaste este año"}
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
          <div
            className={cn(
              "mb-4 grid gap-2",
              datos.cardio_minutes > 0 || datos.duration_minutes !== null ? "grid-cols-2" : "grid-cols-3",
            )}
          >
            {tramo !== "day" && <Numero valor={String(datos.days_trained)} texto="días entrenados" />}
            <Numero valor={`${datos.sets_done}/${datos.sets_planned}`} texto="series hechas" />
            <Numero valor={num(datos.kg_moved)} texto="kg movidos" azul />
            {datos.cardio_minutes > 0 && <Numero valor={String(datos.cardio_minutes)} texto="min de cardio" />}
            {datos.duration_minutes !== null && <Numero valor={String(datos.duration_minutes)} texto="min entrenando" />}
          </div>

          {tramo === "day" ? (
            <ComoTeFueResumen ejercicios={datos.results} vacio="Este día no registraste series." />
          ) : (
            <>
              {datos.buckets.length > 0 && <Barras datos={datos} tramo={tramo} />}
              <Dias datos={datos} />
              <Ejercicios datos={datos} />
            </>
          )}
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
}: {
  tramo: Tramo;
  fecha: string;
  puedeRetroceder: boolean;
  puedeAvanzar: boolean;
  onIr: (fecha: string) => void;
}) {
  return (
    <div className="mt-1 mb-3 flex items-center gap-1">
      <button
          type="button"
          onClick={() => onIr(sumar(fecha, tramo, -1))}
          disabled={!puedeRetroceder}
          aria-label={tramo === "day" ? "Día anterior" : tramo === "month" ? "Mes anterior" : "Año anterior"}
          className="grid size-10 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-25"
        >
          <ChevronLeft className="size-6" aria-hidden="true" />
      </button>
      <h2 className="m-0 flex-1 text-center text-2xl">{titulo(fecha, tramo)}</h2>
      <button
          type="button"
          onClick={() => onIr(sumar(fecha, tramo, 1))}
          disabled={!puedeAvanzar}
          aria-label={tramo === "day" ? "Día siguiente" : tramo === "month" ? "Mes siguiente" : "Año siguiente"}
          className="grid size-10 place-items-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-25"
        >
          <ChevronRight className="size-6" aria-hidden="true" />
      </button>
    </div>
  );
}

// Una barra por día (mes) o por mes (año): las series hechas. Con referencia: líneas guía con su
// valor a la izquierda y, al pasar el mouse o tocar una barra, el día y la cantidad arriba.
function Barras({ datos, tramo }: { datos: PeriodSummary; tramo: Tramo }) {
  const [activo, setActivo] = useState<number | null>(null);
  const mayor = Math.max(1, ...datos.buckets.map((b) => b.sets_done));
  // El tope del gráfico: un número redondo por encima de la barra más alta.
  const paso = mayor <= 10 ? 5 : mayor <= 40 ? 10 : mayor <= 100 ? 20 : 50;
  const tope = Math.ceil(mayor / paso) * paso;
  const guias = [tope, tope / 2, 0];
  const cada = tramo === "month" ? 5 : 1;
  const resumen = datos.buckets
    .filter((b) => b.sets_done > 0)
    .map((b) => `${b.label}: ${b.sets_done} series`)
    .join(", ");
  const elegido = activo === null ? null : datos.buckets[activo];
  const nombre = (b: PeriodBucket) =>
    tramo === "month"
      ? new Date(`${b.start}T00:00:00Z`).toLocaleDateString("es-AR", {
          weekday: "long",
          day: "numeric",
          month: "long",
          timeZone: "UTC",
        })
      : new Date(`${b.start}T00:00:00Z`).toLocaleDateString("es-AR", { month: "long", timeZone: "UTC" });

  return (
    <section className="mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-1 font-heading text-xl font-bold">Series hechas {tramo === "month" ? "por día" : "por mes"}</h3>
      <p className="mt-0 mb-3 min-h-5 text-sm text-muted-foreground" aria-live="polite">
        {elegido
          ? `${nombre(elegido).replace(/^./, (c) => c.toUpperCase())}: ${elegido.sets_done} ${elegido.sets_done === 1 ? "serie" : "series"}${
              elegido.days_trained > 0 && tramo === "year" ? ` en ${elegido.days_trained} ${elegido.days_trained === 1 ? "día" : "días"}` : ""
            }`
          : "Tocá una barra para ver el detalle"}
      </p>
      <div role="img" aria-label={`Series hechas ${tramo === "month" ? "por día" : "por mes"}. ${resumen}.`}>
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
                      b.sets_done === 0 ? "bg-transparent" : activo === i ? "bg-disco-rojo" : "bg-disco-azul",
                    )}
                    style={{ height: `${(b.sets_done / tope) * 100}%` }}
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

// Una sección de lista que se pliega tocando el título y, abierta, muestra las primeras filas y
// "Ver todos" para el resto.
function ListaPlegable({
  titulo,
  total,
  limite = 5,
  abiertaAlInicio = false,
  children,
}: {
  titulo: string;
  total: number;
  limite?: number;
  abiertaAlInicio?: boolean;
  children: (visibles: number) => React.ReactNode;
}) {
  const [abierta, setAbierta] = useState(abiertaAlInicio);
  const [todos, setTodos] = useState(false);
  const visibles = todos ? total : Math.min(total, limite);
  return (
    <section className="mb-3 rounded-2xl bg-card p-4">
      <button
        type="button"
        onClick={() => setAbierta((a) => !a)}
        aria-expanded={abierta}
        className="flex w-full items-center justify-between text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <h3 className="m-0 font-heading text-xl font-bold">
          {titulo} <span className="text-base font-normal text-muted-foreground">({total})</span>
        </h3>
        <ChevronDown className={cn("size-5 transition-transform", abierta && "rotate-180")} aria-hidden="true" />
      </button>
      {abierta && (
        <>
          <div className="mt-2">{children(visibles)}</div>
          {total > limite && (
            <button
              type="button"
              onClick={() => setTodos((t) => !t)}
              className="mt-2 w-full rounded-xl bg-muted px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {todos ? "Ver menos" : `Ver todos (${total})`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

// Los días que se completaron: cada uno enlaza al día, para mirarlo.
function Dias({ datos }: { datos: PeriodSummary }) {
  return (
    <ListaPlegable titulo={datos.period === "day" ? "Rutina" : "Días entrenados"} total={datos.sessions.length}>
      {(visibles) => (
        <ul className="m-0 list-none p-0">
          {datos.sessions.slice(0, visibles).map((s) => (
            <li key={`${s.week_id}-${s.day_index}`} className="border-t border-border first:border-t-0">
              <Link
                href={`/semanas/${s.week_id}/dia/${s.day_index}?desde=rutinas`}
                className="flex items-center gap-3 py-2 text-foreground no-underline"
              >
                <span className="w-10 shrink-0 font-heading text-lg font-semibold text-muted-foreground">
                  {Number(s.local_date.slice(8))}/{Number(s.local_date.slice(5, 7))}
                </span>
                <span className="min-w-0 flex-1 font-heading text-lg leading-tight font-semibold">
                  Día {s.day_index}
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ul>
      )}
    </ListaPlegable>
  );
}

// Los ejercicios con más series del período, con su mejor peso.
function Ejercicios({ datos }: { datos: PeriodSummary }) {
  if (datos.exercises.length === 0) return null;
  return (
    <ListaPlegable titulo="Ejercicios" total={datos.exercises.length}>
      {(visibles) => (
        <ul className="m-0 list-none p-0">
          {datos.exercises.slice(0, visibles).map((e) => (
            <li key={e.name} className="flex items-baseline gap-3 border-t border-border py-2 first:border-t-0">
              <span className="min-w-0 flex-1 font-heading text-lg leading-tight font-semibold">{e.name}</span>
              <span className="shrink-0 text-sm text-muted-foreground">
                {e.sets_done} {e.sets_done === 1 ? "serie" : "series"}
                {e.best_weight_kg !== null && ` · hasta ${num(e.best_weight_kg)} kg`}
              </span>
            </li>
          ))}
        </ul>
      )}
    </ListaPlegable>
  );
}

function Numero({ valor, texto, azul = false }: { valor: string; texto: string; azul?: boolean }) {
  return (
    <div className="rounded-xl bg-card px-2 py-3 text-center">
      <p className={cn("m-0 font-heading text-3xl leading-none font-bold", azul && "text-disco-azul")}>{valor}</p>
      <p className="m-0 mt-1 text-xs text-muted-foreground">{texto}</p>
    </div>
  );
}
