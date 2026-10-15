"use client";

import { MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Disco, estadoDia } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Flecha } from "@/components/Flecha";
import { EvolucionEjercicio } from "@/components/EvolucionEjercicio";
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
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!rutinas && !error && <p>Cargando...</p>}

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
          {/* La evolución por ejercicio junta todas las rutinas: no depende de la elegida arriba. */}
          <EvolucionEjercicio />
        </>
      )}
    </main>
  );
}

// "a, b y c": una lista de nombres dentro de una frase.
function enFrase(nombres: string[]): string {
  return nombres.length <= 1 ? (nombres[0] ?? "") : `${nombres.slice(0, -1).join(", ")} y ${nombres.at(-1)}`;
}

// "Cómo te fue" (versión C): solo lo destacado. Dos números (superaste y no llegaste) y dos frases;
// lo que salió como estaba planificado no ocupa lugar. Las señales son las mismas que recibe la IA.
// Amarillo y no rojo para "no llegaste": no es un error (la IA mantiene el peso) y el rojo de la
// app significa "hecho".
function ComoTeFue({ ejercicios }: { ejercicios: WeekSummaryDetail["exercises"] }) {
  const con = (senal: string) => ejercicios.filter((e) => e.signal === senal).map((e) => e.name);
  const supero = con("superó");
  const noLlego = con("no llegó");
  const cumplio = con("cumplió");
  const sinRegistrar = con("sin registrar");
  const nada = sinRegistrar.length === ejercicios.length;

  return (
    <section className="mb-3 rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-2 font-heading text-xl font-bold">Cómo te fue</h3>
      {nada ? (
        <p className="m-0 text-muted-foreground">Esta semana no registraste series.</p>
      ) : (
        <>
          <div className="mb-3 grid grid-cols-2 gap-2">
            <div className="rounded-xl bg-disco-verde/15 px-2 py-2.5 text-center">
              <p className="m-0 font-heading text-3xl leading-none font-bold text-disco-verde-texto">{supero.length}</p>
              <p className="m-0 mt-1 text-xs text-muted-foreground">superaste</p>
            </div>
            <div className="rounded-xl bg-disco-amarillo/30 px-2 py-2.5 text-center">
              <p className="m-0 font-heading text-3xl leading-none font-bold text-disco-amarillo-texto">{noLlego.length}</p>
              <p className="m-0 mt-1 text-xs text-muted-foreground">no llegaste</p>
            </div>
          </div>
          {supero.length > 0 && (
            <p className="mt-0 mb-1.5">
              <span aria-hidden="true">↑ </span>
              <span className="font-medium">Subiste en</span> {enFrase(supero)}.
            </p>
          )}
          {noLlego.length > 0 && (
            <p className="mt-0 mb-1.5">
              <span aria-hidden="true">↓ </span>
              <span className="font-medium">Te costó</span> {enFrase(noLlego)}.
            </p>
          )}
          <p className="m-0 text-sm text-muted-foreground">
            {supero.length === 0 && noLlego.length === 0
              ? "Hiciste todo como estaba planificado."
              : cumplio.length > 0
                ? "El resto, como estaba planificado."
                : ""}
            {sinRegistrar.length > 0 &&
              ` ${sinRegistrar.length} ${sinRegistrar.length === 1 ? "ejercicio quedó" : "ejercicios quedaron"} sin registrar.`}
          </p>
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
      <div className="mb-4 flex gap-1.5">
        {resumen.day_states.map((e, i) => (
          <Disco key={i} estado={estadoDia[e]} />
        ))}
      </div>

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
