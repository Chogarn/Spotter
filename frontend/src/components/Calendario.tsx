"use client";

import Link from "next/link";
import { useEffect, useState, useSyncExternalStore } from "react";

import { CargandoDiscos } from "@/components/Cargando";
import { Disco } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Flecha } from "@/components/Flecha";
import { type CalendarMonth, apiFetch, readError } from "@/lib/api";

const DIAS = ["L", "M", "X", "J", "V", "S", "D"];

type Mes = { y: number; m: number }; // m de 1 a 12

const clave = (y: number, m: number, d: number) =>
  `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
const claveMes = (x: Mes) => `${x.y}-${String(x.m).padStart(2, "0")}`;
const mover = (x: Mes, delta: number): Mes => {
  const d = new Date(x.y, x.m - 1 + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() + 1 };
};

// La fecha de hoy, solo en el navegador (AAAA-MM-DD): en el servidor es `null`. Así la página no
// calcula "hoy" al prepararse (cacheComponents) y servidor y navegador no discrepan.
const sinSuscripcion = () => () => {};
function useHoy(): string | null {
  return useSyncExternalStore(
    sinSuscripcion,
    () => {
      const d = new Date();
      return clave(d.getFullYear(), d.getMonth() + 1, d.getDate());
    },
    () => null,
  );
}

// Calendario de entrenamientos: histórico (todas las rutinas, desde el primer día). Un disco en
// cada día en que se completó un día del plan; hoy con aro azul. Los días son fechas reales: el
// "Día 1" de una rutina puede caer en cualquier día de la semana.
export function Calendario() {
  const hoy = useHoy();
  if (hoy === null) return <CargandoDiscos />;
  return <CalendarioMes hoy={hoy} />;
}

function CalendarioMes({ hoy }: { hoy: string }) {
  const [anioHoy, mesHoy] = hoy.split("-").map(Number);
  const mesActual: Mes = { y: anioHoy, m: mesHoy };
  const claveHoy = hoy;

  const [mes, setMes] = useState<Mes>(mesActual);
  const [datos, setDatos] = useState<CalendarMonth | null>(null);
  // El primer mes con entrenamientos se recuerda entre meses: marca hasta dónde se retrocede.
  const [primerMes, setPrimerMes] = useState<string | null>(null);
  const [elegido, setElegido] = useState<string | null>(null);
  const [error, setError] = useState("");

  const pedido = claveMes(mes);
  useEffect(() => {
    let vigente = true;
    // La diferencia horaria la manda el navegador: el servidor agrupa por el día de la persona.
    const tz = -new Date().getTimezoneOffset();
    apiFetch(`/calendar?month=${pedido}&tz=${tz}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        const json: CalendarMonth = await res.json();
        if (!vigente) return;
        setDatos(json);
        setPrimerMes(json.first_month);
        setError("");
      })
      .catch((e) => vigente && setError(e instanceof Error ? e.message : "No se pudo cargar el calendario"));
    return () => {
      vigente = false;
    };
  }, [pedido]);

  const cargado = datos !== null && datos.month === pedido;
  const entrenados = new Map<string, CalendarMonth["sessions"]>();
  if (cargado) {
    for (const s of datos.sessions) entrenados.set(s.local_date, [...(entrenados.get(s.local_date) ?? []), s]);
  }

  // La cuadrícula: lunes primero, con los días de los meses vecinos en gris para completar semanas.
  const primeroDelMes = new Date(mes.y, mes.m - 1, 1);
  const antes = (primeroDelMes.getDay() + 6) % 7;
  const diasDelMes = new Date(mes.y, mes.m, 0).getDate();
  const diasMesAnterior = new Date(mes.y, mes.m - 1, 0).getDate();
  const celdas: { d: number; propio: boolean }[] = [];
  for (let i = antes; i > 0; i--) celdas.push({ d: diasMesAnterior - i + 1, propio: false });
  for (let d = 1; d <= diasDelMes; d++) celdas.push({ d, propio: true });
  while (celdas.length % 7 !== 0) celdas.push({ d: celdas.length - antes - diasDelMes + 1, propio: false });

  const etiqueta = new Intl.DateTimeFormat("es-AR", { month: "long", year: "numeric" }).format(primeroDelMes);
  const hayAnterior = primerMes !== null && pedido > primerMes;
  const hayProximo = pedido < claveMes(mesActual);
  const detalle = elegido ? (entrenados.get(elegido) ?? []) : [];

  return (
    <section className="rounded-2xl bg-card p-4" aria-label="Calendario de entrenamientos">
      <div className="flex items-center justify-between">
        <Flecha direccion="anterior" que="Mes" visible={hayAnterior} onClick={() => { setElegido(null); setMes(mover(mes, -1)); }} />
        <h2 className="my-0 text-center text-3xl first-letter:uppercase">{etiqueta}</h2>
        <Flecha direccion="siguiente" que="Mes" visible={hayProximo} onClick={() => { setElegido(null); setMes(mover(mes, 1)); }} />
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!cargado && !error && <CargandoDiscos className="min-h-48" />}

      {cargado && (
        <>
          <p className="mt-0 mb-3 text-center text-sm text-muted-foreground">
            {datos.month_days} {datos.month_days === 1 ? "día" : "días"} este mes · {datos.total_days} en total
          </p>
          <div role="grid" aria-label={etiqueta}>
            <div role="row" className="grid grid-cols-7 text-center text-xs text-muted-foreground">
              {DIAS.map((d) => (
                <span key={d} role="columnheader" className="pb-1">{d}</span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1.5">
              {celdas.map((c, i) => {
                if (!c.propio) {
                  return (
                    <span key={i} className="flex h-10 items-center justify-center text-base text-muted-foreground/50">
                      {c.d}
                    </span>
                  );
                }
                const k = clave(mes.y, mes.m, c.d);
                const sesiones = entrenados.get(k);
                const esHoy = k === claveHoy;
                if (!sesiones) {
                  return (
                    <span key={i} className="flex h-10 items-center justify-center">
                      {esHoy ? (
                        <Disco estado="pendiente" hoy className="size-9 text-base text-foreground">
                          {c.d}
                        </Disco>
                      ) : (
                        <span className="text-base">{c.d}</span>
                      )}
                    </span>
                  );
                }
                return (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setElegido(elegido === k ? null : k)}
                    aria-pressed={elegido === k}
                    aria-label={`${c.d}: entrenaste${esHoy ? " (hoy)" : ""}`}
                    className="flex h-10 items-center justify-center rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <Disco estado="completo" hoy={esHoy} className={elegido === k ? "size-9 text-base ring-2 ring-disco-tinta ring-offset-2" : "size-9 text-base"}>
                      {c.d}
                    </Disco>
                  </button>
                );
              })}
            </div>
          </div>

          {datos.total_days === 0 && (
            <p className="mt-4 mb-0 text-center text-sm text-muted-foreground">
              Todavía no completaste ningún día. Cuando lo hagas, aparece marcado acá.
            </p>
          )}

          {elegido && detalle.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="mt-0 mb-2 font-heading text-xl font-bold first-letter:uppercase">
                {new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(
                  new Date(Number(elegido.slice(0, 4)), Number(elegido.slice(5, 7)) - 1, Number(elegido.slice(8, 10))),
                )}
              </p>
              <ul className="m-0 grid list-none gap-2 p-0">
                {detalle.map((s, i) => (
                  <li key={i}>
                    <Link
                      href={`/semanas/${s.week_id}/dia/${s.day_index}?desde=rutinas`}
                      className="block rounded-xl bg-muted px-3 py-2 no-underline hover:bg-border"
                    >
                      <span className="block font-heading text-lg leading-tight font-bold">
                        Día {s.day_index} · {s.title}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {s.routine_name} · semana {s.week_number}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </>
      )}
    </section>
  );
}
