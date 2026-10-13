"use client";

import { Search } from "lucide-react";
import { useId, useState } from "react";

import type { RoutineExercise } from "@/lib/api";
import { cn } from "cn";

// Sin tildes y en minúsculas: "sen" encuentra "Sentadilla" y "biceps" encuentra "Curl de bíceps".
function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}

// Buscador de ejercicios para el gráfico de Progreso: un campo con lupa que muestra el ejercicio
// elegido; al tocarlo se escribe y aparecen solo los que coinciden. Reemplaza a una lista larga.
export function BuscarEjercicio({
  ejercicios,
  elegido,
  onElegir,
}: {
  ejercicios: RoutineExercise[];
  elegido: number | null;
  onElegir: (id: number) => void;
}) {
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const nombreElegido = ejercicios.find((e) => e.id === elegido)?.name ?? "";
  const coinciden = ejercicios.filter((e) => normalizar(e.name).includes(normalizar(texto.trim())));

  function elegir(ejercicio: RoutineExercise) {
    onElegir(ejercicio.id);
    setAbierto(false);
    setTexto("");
  }

  return (
    <div className="relative mb-3">
      <Search
        className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <input
        type="search"
        role="combobox"
        aria-label="Buscar ejercicio"
        aria-expanded={abierto}
        aria-controls={`${id}-lista`}
        aria-autocomplete="list"
        placeholder="Buscar ejercicio"
        value={abierto ? texto : nombreElegido}
        onFocus={() => {
          setAbierto(true);
          setTexto("");
        }}
        onBlur={() => setAbierto(false)}
        onChange={(e) => setTexto(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Escape") e.currentTarget.blur();
          if (e.key === "Enter" && coinciden[0]) {
            elegir(coinciden[0]);
            e.currentTarget.blur();
          }
        }}
        className="h-11 w-full rounded-full border border-input bg-card pr-4 pl-11 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
      />
      {abierto && (
        <ul
          id={`${id}-lista`}
          role="listbox"
          aria-label="Ejercicios"
          className="absolute inset-x-0 top-full z-20 m-0 mt-1 max-h-64 list-none overflow-auto rounded-2xl border border-border bg-popover p-1 shadow-md"
        >
          {coinciden.length === 0 && (
            <li className="px-3 py-2.5 text-sm text-muted-foreground">Ningún ejercicio coincide con “{texto}”.</li>
          )}
          {coinciden.map((e) => (
            <li
              key={e.id}
              role="option"
              aria-selected={e.id === elegido}
              // onMouseDown y no onClick: se elige antes de que el campo pierda el foco y cierre la lista.
              onMouseDown={(evento) => {
                evento.preventDefault();
                elegir(e);
              }}
              className={cn(
                "cursor-pointer rounded-xl px-3 py-2.5 hover:bg-muted",
                e.id === elegido && "font-semibold",
              )}
            >
              {e.name}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
