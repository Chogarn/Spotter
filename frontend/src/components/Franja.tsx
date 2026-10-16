import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { cn } from "cn";

// Adónde lleva el botón "Volver" de la franja (el nivel de arriba: de una semana a su rutina, de un
// día a su semana). Es solo un enlace con la flecha; sin texto largo para que no se desborde.
export type Volver = { href: string };

// El color de los aros decorativos de cada sección (decisión 77): Inicio lleva rojo y azul como la
// bienvenida; Rutinas rojo, Progreso azul, la propuesta de la IA amarillo y el Perfil verde. Son
// solo adorno (no significan un estado), por eso van ocultos para los lectores de pantalla.
export type Aros = "inicio" | "rojo" | "azul" | "amarillo" | "verde";

const COLOR: Record<Exclude<Aros, "inicio">, string> = {
  rojo: "border-disco-rojo",
  azul: "border-disco-azul",
  amarillo: "border-disco-amarillo",
  verde: "border-disco-verde",
};

// La franja oscura de arriba de casi todas las pantallas (todas menos Entrenar, el día que se
// registra y el modo entrenar, que van sin adornos para no distraer). Un solo lugar para el tamaño,
// los aros y el botón "Volver".
export function Franja({
  titulo,
  aros = "rojo",
  volver,
  arriba,
  acciones,
  subtitulo,
  compacta = false,
}: {
  titulo: React.ReactNode;
  aros?: Aros;
  volver?: Volver;
  // Algo encima del título (el logo, en Inicio).
  arriba?: React.ReactNode;
  // Botones a la derecha del título (el lápiz de cambiar el nombre).
  acciones?: React.ReactNode;
  subtitulo?: React.ReactNode;
  // Para las pantallas de detalle (rutina, semana, día): título más chico y menos alto.
  compacta?: boolean;
}) {
  return (
    <section
      className={cn(
        "relative overflow-hidden bg-primary px-4 text-primary-foreground",
        compacta ? "pt-5 pb-5" : "pt-8 pb-7",
      )}
    >
      <div className="relative z-10 mx-auto max-w-xl">
        {volver && (
          <Link
            href={volver.href}
            className="mb-2 inline-flex items-center gap-0.5 text-sm text-primary-foreground/80 no-underline hover:text-primary-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            Volver
          </Link>
        )}
        {arriba}
        <div className="flex items-center gap-3">
          <h1 className={cn("my-0 min-w-0 flex-1 leading-none", compacta ? "text-4xl break-words" : "truncate text-5xl")}>{titulo}</h1>
          {acciones && <div className="shrink-0">{acciones}</div>}
        </div>
        {subtitulo && <div className="mt-2 text-sm text-primary-foreground/70">{subtitulo}</div>}
      </div>
      {aros === "inicio" ? (
        <>
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -top-12 -right-12 size-40 rounded-full border-[22px] border-disco-rojo"
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-16 -right-6 size-20 rounded-full border-[14px] border-disco-azul"
          />
        </>
      ) : (
        <span
          aria-hidden="true"
          className={cn("pointer-events-none absolute -top-10 -right-10 size-36 rounded-full border-[18px]", COLOR[aros])}
        />
      )}
    </section>
  );
}
