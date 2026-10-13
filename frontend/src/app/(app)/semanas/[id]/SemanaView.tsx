"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { readError, type WeekDetail, apiFetch } from "@/lib/api";
import { dayStateText, statusText } from "@/lib/format";
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
          <h1 className="mb-0">Semana {semana.number}</h1>
          <p className="mt-1 mb-4 text-muted-foreground">
            {semana.routine_name} · {semana.status === "active" ? "en curso" : statusText[semana.status]}
          </p>
          <ul className="m-0 mb-4 grid list-none gap-2 p-0">
            {semana.days.map((d) => (
              <li key={d.day_index}>
                <Link
                  href={`/semanas/${semana.id}/dia/${d.day_index}`}
                  className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 no-underline hover:bg-muted"
                >
                  <Disco estado={estadoDia[d.state]} />
                  <span className="flex-1">
                    <span className="font-medium">Día {d.day_index}</span> · {d.title}
                    <span className="block text-sm text-muted-foreground">
                      ~{d.minutes} min · {d.exercise_count} ejercicios
                      {d.state !== "pending" && <> · {dayStateText[d.state]}</>}
                    </span>
                  </span>
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
