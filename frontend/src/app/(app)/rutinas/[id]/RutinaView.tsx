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
            <div className="flex items-start gap-2">
              <h1 className="mt-2 mb-0 flex-1 text-5xl leading-none">{rutina.name}</h1>
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
          {/* Los datos de la rutina como etiquetas, para que no se confunda con la lista de rutinas. */}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {[
              goalText[rutina.goal],
              rutina.level.charAt(0).toUpperCase() + rutina.level.slice(1),
              rutina.days_per_week !== null && `${rutina.days_per_week} días por semana`,
            ]
              .filter(Boolean)
              .map((t) => (
                <span key={String(t)} className="rounded-full bg-card px-3 py-1 text-sm">
                  {t}
                </span>
              ))}
          </div>
          {/* Las semanas como línea de tiempo (de la más nueva a la más vieja): la línea une los pasos
              de una misma rutina. El punto es rojo si está en curso y verde si se cerró. */}
          <ol className="relative m-0 mt-5 list-none p-0">
            {rutina.weeks.map((s, i) => (
              <li key={s.id} className="relative pl-8">
                {i < rutina.weeks.length - 1 && (
                  <span aria-hidden className="absolute top-4 bottom-0 left-[9px] w-0.5 bg-disco-tinta" />
                )}
                <span
                  aria-hidden
                  className={cn(
                    "absolute top-2.5 left-0.5 size-4 rounded-full",
                    s.status === "active" ? "bg-disco-rojo" : "border-2 border-disco-tinta bg-disco-verde",
                  )}
                />
                <Link
                  href={`/semanas/${s.id}`}
                  className="block rounded-xl px-2 py-1.5 pb-4 no-underline hover:bg-muted"
                >
                  <span className="flex items-center justify-between gap-2">
                    <span className="font-heading text-xl font-bold">Semana {s.number}</span>
                    {s.status === "active" ? (
                      <span className="rounded-full bg-disco-rojo px-2.5 py-0.5 text-xs font-medium text-white">
                        en curso
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">
                        {s.status === "closed" ? "completada" : statusText[s.status]}
                      </span>
                    )}
                  </span>
                  <span className="flex items-center gap-2 text-sm text-muted-foreground">
                    desde el {shortDate(s.week_start)} · <DiscosSemana estados={s.day_states} />
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </>
      )}
    </main>
  );
}
