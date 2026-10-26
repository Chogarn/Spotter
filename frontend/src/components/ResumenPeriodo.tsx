"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { ErrorMessage } from "@/components/ErrorMessage";
import { CargandoDiscos } from "@/components/Cargando";
import { apiFetch, readError, type PeriodSummary } from "@/lib/api";
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

          {datos.buckets.length > 0 && <Barras datos={datos} tramo={tramo} />}
          <Dias datos={datos} />
          <Ejercicios datos={datos} />
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

// Una barra por día (mes) o por mes (año): las series hechas.
function Barras({ datos, tramo }: { datos: PeriodSummary; tramo: Tramo }) {
  const maximo = Math.max(1, ...datos.buckets.map((b) => b.sets_done));
  const cada = tramo === "month" ? 5 : 1;
  const resumen = datos.buckets
    .filter((b) => b.sets_done > 0)
    .map((b) => `${b.label}: ${b.sets_done} series`)
    .join(", ");
  return (
    <section className="mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-3 font-heading text-xl font-bold">Series hechas {tramo === "month" ? "por día" : "por mes"}</h3>
      <div role="img" aria-label={`Series hechas ${tramo === "month" ? "por día" : "por mes"}. ${resumen}.`}>
        <div className="flex h-28 items-end gap-[3px]">
          {datos.buckets.map((b) => (
            <div key={b.start} className="flex h-full flex-1 items-end" title={`${b.label}: ${b.sets_done} series`}>
              <div
                className={cn("w-full rounded-t-sm", b.sets_done > 0 ? "bg-disco-azul" : "bg-border")}
                style={{ height: b.sets_done > 0 ? `${Math.max(6, (b.sets_done / maximo) * 100)}%` : "3px" }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-[3px] text-[11px] text-muted-foreground" aria-hidden="true">
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

// Los días que se completaron: cada uno enlaza al día, para mirarlo.
function Dias({ datos }: { datos: PeriodSummary }) {
  return (
    <section className="mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-2 font-heading text-xl font-bold">{datos.period === "day" ? "Lo que entrenaste" : "Días entrenados"}</h3>
      <ul className="m-0 list-none p-0">
        {datos.sessions.map((s) => (
          <li key={`${s.week_id}-${s.day_index}`} className="border-t border-border first:border-t-0">
            <Link
              href={`/semanas/${s.week_id}/dia/${s.day_index}?desde=rutinas`}
              className="flex items-center gap-3 py-2 text-foreground no-underline"
            >
              <span className="w-10 shrink-0 font-heading text-lg font-semibold text-muted-foreground">
                {Number(s.local_date.slice(8))}/{Number(s.local_date.slice(5, 7))}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-heading text-lg leading-tight font-semibold">{s.title}</span>
                <span className="block text-sm text-muted-foreground">
                  {s.routine_name} · semana {s.week_number}
                  {s.duration_minutes !== null && ` · ${s.duration_minutes} min`}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

// Los ejercicios con más series del período, con su mejor peso.
function Ejercicios({ datos }: { datos: PeriodSummary }) {
  const [todos, setTodos] = useState(false);
  const lista = todos ? datos.exercises : datos.exercises.slice(0, 5);
  if (datos.exercises.length === 0) return null;
  return (
    <section className="mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-2 font-heading text-xl font-bold">Ejercicios</h3>
      <ul className="m-0 list-none p-0">
        {lista.map((e) => (
          <li key={e.name} className="flex items-baseline gap-3 border-t border-border py-2 first:border-t-0">
            <span className="min-w-0 flex-1 font-heading text-lg leading-tight font-semibold">{e.name}</span>
            <span className="shrink-0 text-sm text-muted-foreground">
              {e.sets_done} {e.sets_done === 1 ? "serie" : "series"}
              {e.best_weight_kg !== null && ` · hasta ${num(e.best_weight_kg)} kg`}
            </span>
          </li>
        ))}
      </ul>
      {datos.exercises.length > 5 && (
        <button
          type="button"
          onClick={() => setTodos((t) => !t)}
          className="mt-2 w-full rounded-xl bg-muted px-3 py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {todos ? "Ver menos" : `Ver todos (${datos.exercises.length})`}
        </button>
      )}
    </section>
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
