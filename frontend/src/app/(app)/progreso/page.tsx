"use client";

import { ChevronDown, MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Disco, type EstadoDisco } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Flecha } from "@/components/Flecha";
import { PestanasProgreso } from "@/components/PestanasProgreso";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Button } from "@/components/ui/button";
import {
  readError,
  apiFetch,
  type Routine,
  type RoutineDetail,
  type WeekSummary,
  type WeekSummaryDetail,
} from "@/lib/api";
import { shortDate } from "@/lib/format";
import { cn } from "cn";
import { CargandoDiscos } from "@/components/Cargando";

// Progreso (#28): el resumen de cada semana de una rutina. Solo lectura.
export default function Progreso() {
  const [rutinas, setRutinas] = useState<Routine[] | null>(null);
  const [rutinaId, setRutinaId] = useState<number | null>(null);
  // Las semanas de la rutina elegida, de la más vieja a la más nueva (como las barritas).
  const [semanas, setSemanas] = useState<WeekSummary[] | null>(null);
  const [semanaId, setSemanaId] = useState<number | null>(null);
  const [resumen, setResumen] = useState<WeekSummaryDetail | null>(null);
  const [error, setError] = useState("");

  // Las rutinas; por defecto, la que tiene semana en curso o, si no, la más nueva.
  useEffect(() => {
    apiFetch(`/routines`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        const lista: Routine[] = await res.json();
        setRutinas(lista);
        const actual = lista.find((r) => r.has_active_week) ?? lista[0];
        if (actual) setRutinaId(actual.id);
      })
      .catch((e) => setError(e.message));
  }, []);

  // Las semanas de la rutina; por defecto, la más nueva.
  useEffect(() => {
    if (rutinaId === null) return;
    apiFetch(`/routines/${rutinaId}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        const detalle: RoutineDetail = await res.json();
        const enOrden = [...detalle.weeks].reverse();
        setSemanas(enOrden);
        setSemanaId(enOrden.at(-1)?.id ?? null);
      })
      .catch((e) => setError(e.message));
  }, [rutinaId]);

  useEffect(() => {
    if (semanaId === null) return;
    apiFetch(`/weeks/${semanaId}/summary`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setResumen(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [semanaId]);

  const indice = semanas && semanaId !== null ? semanas.findIndex((s) => s.id === semanaId) : -1;

  return (
    <main className="mx-auto max-w-xl px-4 pt-8">
      <h1 className="mt-0 mb-3">Progreso</h1>
      <PestanasProgreso actual="/progreso" />
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!rutinas && !error && <CargandoDiscos />}

      {rutinas && rutinas.length === 0 && (
        <section className="rounded-2xl bg-card p-6 text-center">
          <p className="mt-0 font-medium">Todavía no hay nada que mostrar</p>
          <p className="mt-0 text-sm text-muted-foreground">
            Cuando entrenes tu primera semana, acá vas a ver cómo te fue.
          </p>
          <Button nativeButton={false} render={<Link href="/rutinas" />}>
            Crear una rutina
          </Button>
        </section>
      )}

      {rutinas && rutinas.length > 0 && (
        <>
          {rutinas.length > 1 && (
            <NativeSelect
              aria-label="Rutina"
              className="mb-3 w-full"
              value={rutinaId ?? ""}
              onChange={(e) => {
                setResumen(null);
                setRutinaId(Number(e.target.value));
              }}
            >
              {rutinas.map((r) => (
                <NativeSelectOption key={r.id} value={r.id}>
                  {r.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          )}
          {rutinas.length === 1 && <p className="mt-0 mb-3 text-muted-foreground">{rutinas[0].name}</p>}

          {/* Una barrita por semana (verde las cerradas) y flechas, como en la propuesta. */}
          {semanas && semanas.length > 0 && (
            <div className="flex items-center gap-1">
              <Flecha
                direccion="anterior"
                que="Semana"
                visible={indice > 0}
                nombre={indice > 0 ? `Semana ${semanas[indice - 1].number}` : undefined}
                onClick={() => setSemanaId(semanas[indice - 1].id)}
              />
              {semanas.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSemanaId(s.id)}
                  aria-label={`Semana ${s.number}`}
                  aria-current={s.id === semanaId ? "step" : undefined}
                  className={cn(
                    "h-2 flex-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                    s.id === semanaId ? "bg-disco-tinta" : s.status === "closed" ? "bg-disco-verde" : "bg-border",
                  )}
                />
              ))}
              <Flecha
                direccion="siguiente"
                que="Semana"
                visible={indice >= 0 && indice < semanas.length - 1}
                nombre={indice < semanas.length - 1 ? `Semana ${semanas[indice + 1]?.number}` : undefined}
                onClick={() => setSemanaId(semanas[indice + 1].id)}
              />
            </div>
          )}

          {resumen && resumen.week_id === semanaId && <ResumenSemana resumen={resumen} />}
        </>
      )}
    </main>
  );
}

// Cómo se dibuja cada señal de un ejercicio (las calcula el servidor, las mismas que recibe la IA).
// Un disco por ejercicio, con el vocabulario del resto de la app: verde superaste, rojo cumpliste,
// borde amarillo no llegaste (no es un error: la IA mantiene el peso) y punteado sin registrar.
const SENALES: Record<string, { estado: EstadoDisco; texto: string }> = {
  "superó": { estado: "completo", texto: "superaste" },
  "cumplió": { estado: "hecho", texto: "como estaba" },
  "no llegó": { estado: "aviso", texto: "no llegaste" },
  "sin registrar": { estado: "pendiente", texto: "sin registrar" },
};

// El orden en que se cuentan en el resumen de una línea.
const ORDEN = ["superó", "cumplió", "no llegó", "sin registrar"] as const;
const PLURAL: Record<(typeof ORDEN)[number], string> = {
  "superó": "superaste",
  "cumplió": "cumpliste",
  "no llegó": "no llegaste",
  "sin registrar": "sin registrar",
};

// El resumen en una línea (cuántos ejercicios en cada estado, con su disco) y, plegada, la lista
// ejercicio por ejercicio: con muchos ejercicios la lista entera hacía la pantalla muy larga.
function ComoTeFue({ ejercicios }: { ejercicios: WeekSummaryDetail["exercises"] }) {
  const [abierta, setAbierta] = useState(false);
  const nada = ejercicios.every((e) => e.signal === "sin registrar");
  const cuenta = (senal: string) => ejercicios.filter((e) => e.signal === senal).length;

  return (
    <section className="mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-2 font-heading text-xl font-bold">Cómo te fue</h3>
      {nada ? (
        <p className="m-0 text-muted-foreground">Esta semana no registraste series.</p>
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
            <ul className="mx-0 mt-2 mb-0 list-none p-0">
              {ejercicios.map((e, k) => {
                const senal = SENALES[e.signal] ?? SENALES["sin registrar"];
                return (
                  <li key={k} className="flex items-center gap-3 border-t border-border py-2 first:border-t-0">
                    <Disco estado={senal.estado} />
                    <span className="min-w-0 flex-1 font-heading text-lg leading-tight font-semibold">{e.name}</span>
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

function ResumenSemana({ resumen }: { resumen: WeekSummaryDetail }) {
  const enCurso = resumen.status === "active";
  return (
    <>
      <h2 className="mt-3 mb-0 text-4xl">Semana {resumen.number}</h2>
      <p className="mt-0 text-muted-foreground">
        {enCurso
          ? "En curso · lo que llevás hasta ahora"
          : resumen.closed_at
            ? `Cerrada el ${shortDate(resumen.closed_at.slice(0, 10))}`
            : "Cerrada"}
      </p>
      <div className={cn("mb-4 grid gap-2", resumen.cardio_minutes > 0 ? "grid-cols-2" : "grid-cols-3")}>
        <Numero valor={`${resumen.days_completed}/${resumen.day_states.length}`} texto="días entrenados" />
        <Numero valor={`${resumen.sets_done}/${resumen.sets_planned}`} texto="series hechas" />
        <Numero valor={Math.round(resumen.kg_moved).toLocaleString("es-AR")} texto="kg movidos" azul />
        {resumen.cardio_minutes > 0 && <Numero valor={String(resumen.cardio_minutes)} texto="min de cardio" />}
      </div>

      <ComoTeFue ejercicios={resumen.exercises} />

      {resumen.ai_summary && (
        <section className="mb-3 flex gap-3 rounded-2xl border-2 border-disco-amarillo bg-card p-4">
          <Sparkles className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="m-0 text-sm text-muted-foreground">Lo que dijo la IA</p>
            <p className="m-0">{resumen.ai_summary}</p>
          </div>
        </section>
      )}
      {resumen.closing_note && (
        <section className="mb-3 flex gap-3 rounded-2xl bg-card p-4">
          <MessageSquare className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
          <div>
            <p className="m-0 text-sm text-muted-foreground">Lo que escribiste</p>
            <p className="m-0 whitespace-pre-wrap">“{resumen.closing_note}”</p>
          </div>
        </section>
      )}
    </>
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
