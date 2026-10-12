"use client";

import { Check, Pencil, X } from "lucide-react";
import Link from "next/link";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import { readError, type RoutineDetail, apiFetch } from "@/lib/api";
import { goalText, shortDate, statusText } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DiscosSemana } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { cn } from "cn";

export default function RutinaView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [rutina, setRutina] = useState<RoutineDetail | null>(null);
  const [error, setError] = useState("");
  // `nombre` es el texto que se está escribiendo; null = no se está editando.
  const [nombre, setNombre] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    apiFetch(`/routines/${id}`)
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
      const res = await apiFetch(`/routines/${id}`, {
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
    <main className="mx-auto max-w-xl px-4 pt-6">
      <BackButton href="/rutinas">← Tus rutinas</BackButton>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!rutina && !error && <p>Cargando...</p>}
      {rutina && (
        <>
          {nombre === null ? (
            <div className="flex items-center gap-2">
              <h1 className="my-2 flex-1">{rutina.name}</h1>
              <Button
                size="icon-lg"
                variant="outline"
                type="button"
                onClick={() => setNombre(rutina.name)}
                aria-label="Cambiar el nombre de la rutina"
              >
                <Pencil />
              </Button>
            </div>
          ) : (
            <div className="my-3 flex items-center gap-1.5">
              <Input
                value={nombre}
                maxLength={100}
                aria-label="Nombre de la rutina"
                onChange={(e) => setNombre(e.target.value)}
                className="h-9 flex-1"
              />
              <Button
                size="icon-lg"
                type="button"
                onClick={guardarNombre}
                disabled={guardando || !nombre.trim()}
                aria-label="Guardar el nombre"
              >
                <Check />
              </Button>
              <Button
                size="icon-lg"
                variant="outline"
                type="button"
                onClick={() => setNombre(null)}
                disabled={guardando}
                aria-label="Cancelar el cambio de nombre"
              >
                <X />
              </Button>
            </div>
          )}
          <p className="mt-0 text-muted-foreground">
            {goalText[rutina.goal]} · {rutina.level}
          </p>
          <ul className="m-0 mt-4 grid list-none gap-2 p-0">
            {rutina.weeks.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/semanas/${s.id}`}
                  className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 no-underline hover:bg-muted"
                >
                  <span className="flex-1">
                    <span className="font-medium">Semana {s.number}</span>
                    <span className="block text-sm text-muted-foreground">
                      {s.day_count} días · desde el {shortDate(s.week_start)}
                    </span>
                    <span className="mt-1.5 block">
                      <DiscosSemana estados={s.day_states} cerrada={s.status === "closed"} />
                    </span>
                  </span>
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-xs font-medium",
                      s.status === "active" ? "bg-disco-rojo text-white" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {s.status === "active" ? "en curso" : statusText[s.status]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
