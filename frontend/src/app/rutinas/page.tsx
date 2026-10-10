"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { API, readError, type Routine } from "@/lib/api";
import { goalText } from "@/lib/format";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

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
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!rutinas && !error && <p>Cargando...</p>}
      {rutinas && rutinas.length === 0 && <p>Todavía no tenés rutinas.</p>}
      {rutinas && rutinas.length > 0 && (
        <div className="grid gap-3">
          {rutinas.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle>
                  <Link href={`/rutinas/${r.id}`}>{r.name}</Link>
                </CardTitle>
                <CardDescription>
                  {goalText[r.goal]} · {r.level} · {r.week_count}{" "}
                  {r.week_count === 1 ? "semana" : "semanas"}
                </CardDescription>
                {r.has_active_week && (
                  <CardAction>
                    <Badge>Semana activa</Badge>
                  </CardAction>
                )}
              </CardHeader>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
