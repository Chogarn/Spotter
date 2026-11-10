"use client";

import { Play } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { apiFetch, type Week } from "@/lib/api";

// El día que toca: el empezado y sin completar, si hay uno (decisión 124); si no, el primero sin
// completar. `undefined` si están todos hechos.
export function diaQueToca<D extends { day_index: number; state: string }>(dias: D[], activa: Week | null): D | undefined {
  const enCurso = activa?.in_progress_day ? dias.find((d) => d.day_index === activa.in_progress_day) : undefined;
  return enCurso ?? dias.find((d) => d.state !== "completed");
}

// El botón grande de la tarjeta "Te toca" (Inicio y Entrenar, decisión 124): "Empezar" si el día no
// se empezó, "Seguir entrenando" si está en curso y "Retomar" si está detenido (retoma el reloj y
// abre el modo entrenar).
export function BotonDelDia({ weekId, dayIndex, activa }: { weekId: number; dayIndex: number; activa: Week | null }) {
  const router = useRouter();
  const [trabajando, setTrabajando] = useState(false);
  const href = `/semanas/${weekId}/dia/${dayIndex}/entrenar`;
  const enCurso = activa?.in_progress_day === dayIndex;

  if (enCurso && activa?.in_progress_paused) {
    return (
      <Button
        size="xl"
        className="w-full"
        type="button"
        disabled={trabajando}
        onClick={async () => {
          setTrabajando(true);
          try {
            await apiFetch(`/weeks/${weekId}/days/${dayIndex}/resume`, { method: "POST" });
          } catch {}
          // Si retomar falla, igual se abre el día: ahí está el botón Retomar.
          router.push(href);
        }}
      >
        <Play /> Retomar
      </Button>
    );
  }
  return (
    <Button size="xl" className="w-full" nativeButton={false} render={<Link href={href} />}>
      {enCurso ? "Seguir entrenando" : "Empezar"}
    </Button>
  );
}
