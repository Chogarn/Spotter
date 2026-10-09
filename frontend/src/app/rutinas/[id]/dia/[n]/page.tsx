"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { ExerciseRow } from "@/components/ExerciseRow";
import { API, readError, type DayDetail } from "@/lib/api";

export default function DiaPage({ params }: { params: Promise<{ id: string; n: string }> }) {
  const { id, n } = use(params);
  const [dia, setDia] = useState<DayDetail | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/weeks/${id}/days/${n}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setDia(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id, n]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <p>
        <Link href={`/rutinas/${id}`}>
          ← {dia ? `Semana ${dia.week_number}` : "Volver a la semana"}
        </Link>
      </p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!dia && !error && <p>Cargando...</p>}
      {dia && (
        <>
          <h1>
            Día {dia.day_index} · {dia.title}{" "}
            <small style={{ fontWeight: "normal" }}>~{dia.minutes} min</small>
          </h1>
          {dia.mobility_notes && <p>Movilidad: {dia.mobility_notes}</p>}
          <ol>
            {dia.exercises.map((e, i) => (
              <ExerciseRow key={i} exercise={e} />
            ))}
          </ol>
          <p>
            <small>Los pesos son orientativos. La app no da consejo médico.</small>
          </p>
        </>
      )}
    </main>
  );
}
