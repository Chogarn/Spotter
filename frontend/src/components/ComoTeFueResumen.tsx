"use client";

import { ChevronDown, Search } from "lucide-react";
import { useState } from "react";

import { textoDeCarga, textoDeDolor } from "@/components/ComoTeFue";
import { Disco, type EstadoDisco } from "@/components/Disco";
import type { ExerciseItem, SetItem, WeekSummaryDetail } from "@/lib/api";
import { realAsSet, summarize } from "@/lib/format";
import { cn } from "cn";

// Cómo se dibuja cada señal de un ejercicio (las calcula el servidor, las mismas que recibe la IA).
// Un disco por ejercicio, con el vocabulario del resto de la app: verde superaste, rojo cumpliste,
// borde amarillo no llegaste (no es un error: la IA mantiene el peso) y punteado sin registrar.
const SENALES: Record<string, { estado: EstadoDisco; texto: string }> = {
  "superó": { estado: "completo", texto: "superaste" },
  "cumplió": { estado: "hecho", texto: "como estaba" },
  "no llegó": { estado: "aviso", texto: "no llegaste" },
  "mixto": { estado: "parcial", texto: "subiste y bajaste" },
  "sin registrar": { estado: "pendiente", texto: "sin registrar" },
};

type Ejercicio = WeekSummaryDetail["exercises"][number];

// Lo que se muestra, aparte de la señal que va a la IA (esa pide mayoría de series). Acá alcanza con
// una serie distinta: si alguna pasó lo que tocaba y ninguna quedó abajo, "superó"; al revés, "no
// llegó"; si hubo de las dos, "mixto". Cada serie compara primero el peso y después la medida.
function senalVisible(e: Ejercicio): string {
  let mas = 0;
  let menos = 0;
  let registradas = 0;
  for (const { planned: p, real: r } of e.sets) {
    if (r === null) continue;
    registradas++;
    if (p.weight_kg !== null && r.weight_kg !== null && r.weight_kg !== p.weight_kg) {
      if (r.weight_kg > p.weight_kg) mas++;
      else menos++;
      continue;
    }
    const plan = p.reps ?? p.duration_seconds ?? p.duration_minutes;
    const hecho = r.reps ?? r.duration_seconds ?? r.duration_minutes;
    if (plan === null || hecho === null || plan === hecho) continue;
    if (hecho > plan) mas++;
    else menos++;
  }
  if (registradas === 0) return "sin registrar";
  if (mas > 0 && menos > 0) return "mixto";
  if (mas > 0) return "superó";
  if (menos > 0) return "no llegó";
  return "cumplió";
}

// Lo hecho frente a lo que tocaba, con el mismo texto que usa el día ("3 × 12 · 50 kg"). Solo cuenta
// las series que se registraron; vacío si nada se registró o si lo hecho fue lo que tocaba.
function hechoFrenteAlPlan(e: WeekSummaryDetail["exercises"][number]): { hecho: string; tocaba: string | null } | null {
  const registradas = e.sets.filter((s) => s.real !== null);
  if (registradas.length === 0) return null;
  const texto = (sets: SetItem[]) => summarize({ kind: e.kind, sets } as ExerciseItem);
  const hecho = texto(registradas.map((s) => realAsSet(s.real!)));
  const tocaba = texto(
    registradas.map((s) => ({
      reps: s.planned.reps,
      duration_minutes: s.planned.duration_minutes,
      duration_seconds: s.planned.duration_seconds,
      target_weight_kg: s.planned.weight_kg,
    })),
  );
  return { hecho, tocaba: tocaba === hecho ? null : tocaba };
}

// Sin tildes y en minúsculas, para que "sentadilla" encuentre "Sentadilla" y "pajaros", "Pájaros".
const normalizar = (texto: string) => texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();

// El orden en que se cuentan en el resumen de una línea.
const ORDEN = ["superó", "cumplió", "mixto", "no llegó", "sin registrar"] as const;
const PLURAL: Record<(typeof ORDEN)[number], string> = {
  "superó": "superaste",
  "cumplió": "cumpliste",
  "mixto": "con subas y bajas",
  "no llegó": "no llegaste",
  "sin registrar": "sin registrar",
};

// El resumen en una línea (cuántos ejercicios en cada estado, con su disco) y, plegada, la lista
// ejercicio por ejercicio: con muchos ejercicios la lista entera hacía la pantalla muy larga.
export function ComoTeFueResumen({
  ejercicios,
  vacio = "Esta semana no registraste series.",
}: {
  ejercicios: Ejercicio[];
  vacio?: string;
}) {
  const [abierta, setAbierta] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const senales = ejercicios.map(senalVisible);
  const nada = senales.every((s) => s === "sin registrar");
  const cuenta = (senal: string) => senales.filter((s) => s === senal).length;

  return (
    <section className="mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-2 font-heading text-xl font-bold">Cómo te fue</h3>
      {nada ? (
        <p className="m-0 text-muted-foreground">{vacio}</p>
      ) : (
        <>
          <ul className="m-0 flex list-none flex-wrap gap-x-4 gap-y-2 p-0">
            {ORDEN.filter((senal) => cuenta(senal) > 0).map((senal) => (
              <li key={senal} className="flex items-center gap-2">
                <Disco estado={SENALES[senal].estado} />
                <span>
                  <b className="font-heading text-2xl leading-none">{cuenta(senal)}</b>{" "}
                  <span className="text-sm text-muted-foreground">{PLURAL[senal]}</span>
                </span>
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={() => setAbierta((a) => !a)}
            aria-expanded={abierta}
            className="mt-3 flex w-full items-center justify-between rounded-xl bg-muted px-3 py-2 text-left text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {abierta ? "Ocultar el detalle" : `Ver ejercicio por ejercicio (${ejercicios.length})`}
            <ChevronDown className={cn("size-4 transition-transform", abierta && "rotate-180")} aria-hidden="true" />
          </button>
          {abierta && (
            <div className="relative mt-2">
              <Search
                className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                type="search"
                aria-label="Buscar ejercicio"
                placeholder="Buscar ejercicio"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="h-10 w-full rounded-full border border-input bg-background pr-4 pl-10 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </div>
          )}
          {abierta && ejercicios.every((e) => !normalizar(e.name).includes(normalizar(busqueda.trim()))) && (
            <p className="mt-2 mb-0 text-sm text-muted-foreground">Ningún ejercicio coincide con “{busqueda}”.</p>
          )}
          {abierta && (
            <ul className="mx-0 mt-2 mb-0 list-none p-0">
              {ejercicios.map((e, k) => {
                if (!normalizar(e.name).includes(normalizar(busqueda.trim()))) return null;
                const senal = SENALES[senales[k]] ?? SENALES["sin registrar"];
                const hecho = hechoFrenteAlPlan(e);
                return (
                  <li key={k} className="flex items-start gap-3 border-t border-border py-2 first:border-t-0">
                    <Disco estado={senal.estado} className="mt-0.5" />
                    <span className="min-w-0 flex-1">
                      <span className="block font-heading text-lg leading-tight font-semibold">{e.name}</span>
                      {hecho && (
                        <span className="block text-sm text-muted-foreground">
                          Hiciste {hecho.hecho}
                          {hecho.tocaba && <span className="block">Tocaba {hecho.tocaba}</span>}
                        </span>
                      )}
                      {(e.load_feel || e.pain) && (
                        <span className="block text-sm text-muted-foreground">
                          {[
                            e.load_feel && `Carga ${textoDeCarga(e.load_feel).toLowerCase()}`,
                            e.pain && `Dolor ${textoDeDolor(e.pain).toLowerCase()}`,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      )}
                    </span>
                    <span className="shrink-0 text-sm text-muted-foreground">{senal.texto}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
