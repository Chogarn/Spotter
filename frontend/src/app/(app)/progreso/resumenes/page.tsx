"use client";

import { MessageSquare, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { ComoTeFueResumen } from "@/components/ComoTeFueResumen";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Flecha } from "@/components/Flecha";
import { Franja } from "@/components/Franja";
import { ResumenPeriodo } from "@/components/ResumenPeriodo";
import { SelectorPeriodo, usePeriodo } from "@/components/SelectorPeriodo";
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
  const [periodo, setPeriodo] = usePeriodo();

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
    <main className="flex flex-1 flex-col">
      <Franja titulo="Resúmenes" aros="azul" volver={{ href: "/progreso" }} compacta />
      <div className="mx-auto w-full max-w-xl px-4 pt-5">
      <SelectorPeriodo periodo={periodo} onElegir={setPeriodo} />
      {periodo !== "week" && <ResumenPeriodo key={periodo} tramo={periodo} />}
      {periodo === "week" && error && <ErrorMessage>{error}</ErrorMessage>}
      {periodo === "week" && !rutinas && !error && <CargandoDiscos />}

      {periodo === "week" && rutinas && rutinas.length === 0 && (
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

      {periodo === "week" && rutinas && rutinas.length > 0 && (
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
      </div>
    </main>
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
      <div
        className={cn(
          "mb-4 grid gap-2",
          resumen.cardio_minutes > 0 || resumen.duration_minutes !== null ? "grid-cols-2" : "grid-cols-3",
        )}
      >
        <Numero valor={`${resumen.days_completed}/${resumen.day_states.length}`} texto="días entrenados" />
        <Numero valor={`${resumen.sets_done}/${resumen.sets_planned}`} texto="series hechas" />
        <Numero valor={Math.round(resumen.kg_moved).toLocaleString("es-AR")} texto="kg movidos" azul />
        {resumen.cardio_minutes > 0 && <Numero valor={String(resumen.cardio_minutes)} texto="min de cardio" />}
        {resumen.duration_minutes !== null && (
          <Numero valor={String(resumen.duration_minutes)} texto="min entrenando" />
        )}
      </div>
      {/* Lo que tardó en cada día (decisión 82): solo los días que se midieron. */}
      {resumen.duration_minutes !== null && (
        <p className="-mt-2 mb-4 text-sm text-muted-foreground">
          {resumen.day_durations
            .map((m, i) => (m === null ? null : `Día ${i + 1}: ${m} min`))
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}

      <ComoTeFueResumen ejercicios={resumen.exercises} />

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
