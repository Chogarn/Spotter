"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { API, readError, type WeekSummary } from "@/lib/api";
import { shortDate, statusText } from "@/lib/format";

export default function MisRutinasPage() {
  const [semanas, setSemanas] = useState<WeekSummary[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/weeks`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setSemanas(await res.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <BackButton href="/">← Volver</BackButton>
      <h1>Mis rutinas</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!semanas && !error && <p>Cargando...</p>}
      {semanas && semanas.length === 0 && <p>Todavía no tenés rutinas.</p>}
      {semanas && semanas.length > 0 && (
        <ul>
          {semanas.map((s) => (
            <li key={s.id}>
              <Link href={`/rutinas/${s.id}`}>
                Semana {s.number} · {statusText[s.status]}
              </Link>{" "}
              <small>
                {s.day_count} días · desde el {shortDate(s.week_start)}
              </small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
