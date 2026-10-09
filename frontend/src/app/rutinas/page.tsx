"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { API, readError, type Routine } from "@/lib/api";
import { goalText } from "@/lib/format";

export default function MisRutinasPage() {
  const [rutinas, setRutinas] = useState<Routine[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API}/routines`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setRutinas(await res.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <BackButton href="/">← Volver</BackButton>
      <h1>Mis rutinas</h1>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!rutinas && !error && <p>Cargando...</p>}
      {rutinas && rutinas.length === 0 && <p>Todavía no tenés rutinas.</p>}
      {rutinas && rutinas.length > 0 && (
        <ul>
          {rutinas.map((r) => (
            <li key={r.id}>
              <Link href={`/rutinas/${r.id}`}>{r.name}</Link>
              <br />
              <small>
                {goalText[r.goal]} · {r.level} · {r.week_count}{" "}
                {r.week_count === 1 ? "semana" : "semanas"}
                {r.has_active_week && " · con semana activa"}
              </small>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
