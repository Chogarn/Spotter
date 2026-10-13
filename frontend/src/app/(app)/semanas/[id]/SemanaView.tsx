"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { readError, type WeekDetail, apiFetch } from "@/lib/api";
import { dayStateText, shortDate, statusText } from "@/lib/format";
import { cn } from "cn";
import { Disco, estadoDia } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";

export default function SemanaView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [semana, setSemana] = useState<WeekDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/weeks/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setSemana(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id]);

  return (
    <main className="mx-auto max-w-xl px-4 pt-6">
      <BackButton href={semana ? `/rutinas/${semana.routine_id}` : "/rutinas"}>
        ← {semana ? semana.routine_name : "Tus rutinas"}
      </BackButton>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!semana && !error && <p>Cargando...</p>}
      {semana && (
        <>
          {/* Título grande y etiquetas, como la pantalla de la rutina y la del día. */}
          <h1 className="mt-2 mb-0 text-6xl">Semana {semana.number}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                semana.status === "active" ? "bg-disco-rojo text-white" : "bg-card text-muted-foreground",
              )}
            >
              {semana.status === "active" ? "En curso" : semana.status === "closed" ? "Completada" : statusText[semana.status]}
            </span>
            <span className="rounded-full bg-card px-3 py-1 text-sm">Desde el {shortDate(semana.week_start)}</span>
            <span className="rounded-full bg-card px-3 py-1 text-sm">{semana.days.length} días</span>
          </div>
          {/* Cada día como las tarjetas de ejercicio del día; la flecha avisa que se entra tocándola. */}
          <ul className="m-0 mt-4 mb-4 grid list-none gap-2.5 p-0">
            {semana.days.map((d) => (
              <li key={d.day_index}>
                <Link
                  href={`/semanas/${semana.id}/dia/${d.day_index}?desde=rutinas`}
                  className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 no-underline hover:bg-muted"
                >
                  <Disco estado={estadoDia[d.state]} />
                  <span className="flex-1">
                    <span className="block font-heading text-[1.35rem] leading-tight font-bold">
                      Día {d.day_index} · {d.title}
                    </span>
                    <span className="block font-heading text-lg leading-tight font-semibold text-muted-foreground">
                      ~{d.minutes} min · {d.exercise_count} ejercicios
                      {d.state !== "pending" && <> · {dayStateText[d.state]}</>}
                    </span>
                  </span>
                  <ChevronRight className="size-6 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          {semana.status === "active" && (
            <p>
              <small className="text-muted-foreground">
                La semana se cierra desde <Link href="/entrenar">Entrenar</Link>.
              </small>
            </p>
          )}
          {semana.status === "closed" && (
            <>
              {/* Igual que "Día completado", pero sin candado: la semana cerrada no se reabre. */}
              <section className="mt-6">
                <span className="font-heading text-2xl font-bold">Semana completada</span>
              </section>
              <p>
                <small className="text-muted-foreground">
                  <Link href="/entrenar">Andá a Entrenar</Link> para generar la siguiente.
                </small>
              </p>
              {semana.closing_note && (
                <>
                  <h2>Cómo te sentiste esta semana</h2>
                  <p style={{ whiteSpace: "pre-wrap" }}>{semana.closing_note}</p>
                </>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
