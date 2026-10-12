"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { readError, type Routine, apiFetch } from "@/lib/api";
import { goalText } from "@/lib/format";
import { DiscosSemana } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";

export default function MisRutinasPage() {
  const [rutinas, setRutinas] = useState<Routine[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/routines`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setRutinas(await res.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  return (
    <main className="mx-auto max-w-xl px-4 pt-8">
      <h1 className="mt-0">Tus rutinas</h1>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!rutinas && !error && <p>Cargando...</p>}
      {rutinas && rutinas.length === 0 && (
        <p className="text-muted-foreground">
          Todavía no tenés rutinas. Generá la primera desde <Link href="/">Entrenar</Link>.
        </p>
      )}
      {rutinas && rutinas.length > 0 && (
        <ul className="m-0 grid list-none gap-3 p-0">
          {rutinas.map((r) => (
            <li key={r.id}>
              <Link
                href={`/rutinas/${r.id}`}
                className="block rounded-2xl bg-card p-4 no-underline hover:bg-muted"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="font-heading text-2xl font-bold">{r.name}</span>
                  {r.has_active_week && (
                    <span className="rounded-full bg-disco-rojo px-2.5 py-0.5 text-xs font-medium text-white">
                      en curso
                    </span>
                  )}
                </span>
                <span className="block text-sm text-muted-foreground">
                  {goalText[r.goal]} · {r.level} · {r.week_count} {r.week_count === 1 ? "semana" : "semanas"}
                </span>
                {r.last_week_day_states.length > 0 && (
                  <span className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                    Última semana
                    <DiscosSemana estados={r.last_week_day_states} cerrada={!r.has_active_week} />
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
