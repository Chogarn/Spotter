"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { API, readError, type RoutineDetail } from "@/lib/api";
import { goalText, shortDate, statusText } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function RutinaView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [rutina, setRutina] = useState<RoutineDetail | null>(null);
  const [error, setError] = useState("");
  // `nombre` es el texto que se está escribiendo; null = no se está editando.
  const [nombre, setNombre] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    fetch(`${API}/routines/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setRutina(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id]);

  async function guardarNombre() {
    if (nombre === null) return;
    setError("");
    setGuardando(true);
    try {
      const res = await fetch(`${API}/routines/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: nombre }),
      });
      if (!res.ok) throw new Error(await readError(res));
      const actualizada = await res.json();
      setRutina((r) => (r ? { ...r, name: actualizada.name } : r));
      setNombre(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar con el servidor");
    }
    setGuardando(false);
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" }}>
      <BackButton href="/rutinas">← Mis rutinas</BackButton>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {!rutina && !error && <p>Cargando...</p>}
      {rutina && (
        <>
          {nombre === null ? (
            <h1>
              {rutina.name}{" "}
              <Button type="button" onClick={() => setNombre(rutina.name)}>
                Cambiar nombre
              </Button>
            </h1>
          ) : (
            <p>
              <Input
                value={nombre}
                maxLength={100}
                aria-label="Nombre de la rutina"
                onChange={(e) => setNombre(e.target.value)}
                className="inline-flex w-72"
              />{" "}
              <Button type="button" onClick={guardarNombre} disabled={guardando || !nombre.trim()}>
                Guardar
              </Button>{" "}
              <Button type="button" onClick={() => setNombre(null)} disabled={guardando}>
                Cancelar
              </Button>
            </p>
          )}
          <p>
            Objetivo: {goalText[rutina.goal]} · Nivel: {rutina.level}
          </p>
          <ul>
            {rutina.weeks.map((s) => (
              <li key={s.id}>
                <Link href={`/semanas/${s.id}`}>
                  Semana {s.number} · {statusText[s.status]}
                </Link>{" "}
                <small>
                  {s.day_count} días · desde el {shortDate(s.week_start)}
                </small>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
