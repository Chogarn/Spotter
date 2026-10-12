"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { readError, type WeekDetail, apiFetch } from "@/lib/api";
import { dayStateText, statusText } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <BackButton href={semana ? `/rutinas/${semana.routine_id}` : "/rutinas"}>
        ← {semana ? semana.routine_name : "Mis rutinas"}
      </BackButton>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!semana && !error && <p>Cargando...</p>}
      {semana && (
        <>
          <h1>
            Semana {semana.number} · {statusText[semana.status]}
          </h1>
          <div className="mb-4 grid gap-3">
            {semana.days.map((d) => (
              <Card key={d.day_index}>
                <CardHeader>
                  <CardTitle>
                    <Link href={`/semanas/${semana.id}/dia/${d.day_index}`}>
                      Día {d.day_index} · {d.title}
                    </Link>
                  </CardTitle>
                  <CardDescription>
                    ~{d.minutes} min · {d.exercise_count} ejercicios
                  </CardDescription>
                  {d.state !== "pending" && (
                    <CardAction>
                      <Badge variant={d.state === "completed" ? "default" : "outline"}>
                        {dayStateText[d.state]}
                      </Badge>
                    </CardAction>
                  )}
                </CardHeader>
              </Card>
            ))}
          </div>

          {semana.status === "active" && (
            <p>
              La semana se cierra desde <Link href="/">Entrenar</Link>.
            </p>
          )}
          {semana.status === "closed" && (
            <>
              {semana.closing_note && (
                <>
                  <h2>Cómo te sentiste esta semana</h2>
                  <p style={{ whiteSpace: "pre-wrap" }}>{semana.closing_note}</p>
                </>
              )}
              <p>
                Semana cerrada. <Link href="/">Andá a Entrenar</Link> para generar la siguiente.
              </p>
            </>
          )}
        </>
      )}
    </main>
  );
}
