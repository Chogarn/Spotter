"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { API, readError, type WeekDetail } from "@/lib/api";
import { dayStateText, statusText } from "@/lib/format";

export default function SemanaView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [semana, setSemana] = useState<WeekDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/weeks/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setSemana(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <BackButton href="/rutinas">← Mis rutinas</BackButton>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!semana && !error && <p>Cargando...</p>}
      {semana && (
        <>
          <h1>
            Semana {semana.number} · {statusText[semana.status]}
          </h1>
          <ul>
            {semana.days.map((d) => (
              <li key={d.day_index}>
                <Link href={`/rutinas/${semana.id}/dia/${d.day_index}`}>
                  Día {d.day_index} · {d.title}
                </Link>{" "}
                <small>
                  ~{d.minutes} min · {d.exercise_count} ejercicios
                  {d.state !== "pending" && <> · {dayStateText[d.state]}</>}
                </small>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
