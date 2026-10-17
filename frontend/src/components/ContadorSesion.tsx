"use client";

import { useSyncExternalStore } from "react";

// Un reloj de un segundo para toda la pantalla: lo que cambia es la hora, no el estado.
function suscribirse(avisar: () => void) {
  const id = setInterval(avisar, 1000);
  return () => clearInterval(id);
}
const segundosAhora = () => Math.floor(Date.now() / 1000);
// En el servidor no hay hora que mostrar (Next 16 con cacheComponents no deja leerla al preparar).
const sinHora = () => null;

// "47:05" o "1:02:09".
function formato(total: number): string {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const dos = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${dos(m)}:${dos(s)}` : `${dos(m)}:${dos(s)}`;
}

// El contador de la sesión (decisión 82): cuenta desde la hora en que se tocó "Empezar día"
// (`desde`, ISO). Se calcula con esa hora y no sumando segundos, así sigue bien si se bloquea la
// pantalla. Es solo un dato: no hace nada al llegar a ningún tiempo.
export function ContadorSesion({ desde }: { desde: string }) {
  const ahora = useSyncExternalStore(suscribirse, segundosAhora, sinHora);
  if (ahora === null) return null;
  const segundos = Math.max(0, ahora - Math.floor(new Date(desde).getTime() / 1000));
  return (
    <span
      role="timer"
      aria-label="Tiempo de la sesión"
      className="font-heading text-lg font-bold tabular-nums text-foreground"
    >
      {formato(segundos)}
    </span>
  );
}
