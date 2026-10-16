import { ChevronRight } from "lucide-react";
import Link from "next/link";

import { cn } from "cn";

// Un tramo del camino ("Rutinas › Fuerza › Semana 2"): con `href` es un enlace; el último no lo lleva.
export type Miga = { texto: string; href?: string };

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
// los aros y las migas de pan.
export function Franja({
  titulo,
  aros = "rojo",
  migas,
  arriba,
  acciones,
  subtitulo,
  compacta = false,
}: {
  titulo: React.ReactNode;
  aros?: Aros;
  migas?: Miga[];
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
        {migas && migas.length > 0 && (
          <nav aria-label="Ruta de navegación" className="mb-2 text-sm text-primary-foreground/70">
            <ol className="m-0 flex list-none items-center gap-1 p-0">
              {migas.map((m, i) => {
                const ultima = i === migas.length - 1;
                return (
                  <li key={i} className={cn("flex min-w-0 items-center gap-1", ultima ? "flex-1" : "shrink")}>
                    {i > 0 && <ChevronRight className="size-3.5 shrink-0" aria-hidden="true" />}
                    {m.href && !ultima ? (
                      <Link
                        href={m.href}
                        className="max-w-[9rem] truncate text-primary-foreground/90 underline underline-offset-2 hover:text-primary-foreground"
                      >
                        {m.texto}
                      </Link>
                    ) : (
                      <span aria-current={ultima ? "page" : undefined} className="truncate font-medium text-primary-foreground">
                        {m.texto}
                      </span>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        )}
        {arriba}
        <div className="flex items-center gap-3">
          <h1 className={cn("my-0 min-w-0 flex-1 leading-none", compacta ? "text-4xl" : "truncate text-5xl")}>{titulo}</h1>
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
