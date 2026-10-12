"use client";

import { Dumbbell, ListChecks, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { cn } from "cn";

// Barra fija abajo, siempre, también en la computadora (decisión 42).
// Entrenar abarca lo que se abre desde la portada: la semana, el día y la propuesta.
const SECCIONES = [
  {
    href: "/",
    texto: "Entrenar",
    Icono: Dumbbell,
    activa: (p: string) => p === "/" || p.startsWith("/semanas") || p.startsWith("/rutina/"),
  },
  { href: "/rutinas", texto: "Rutinas", Icono: ListChecks, activa: (p: string) => p.startsWith("/rutinas") },
  { href: "/perfil", texto: "Perfil", Icono: UserRound, activa: (p: string) => p.startsWith("/perfil") },
];

// La ruta actual solo se conoce al abrir la página (con `cacheComponents`, leerla fuera de un
// <Suspense> bloquea las rutas con parámetros). Mientras tanto se ve la barra sin sección marcada.
export function BarraNavegacion() {
  return (
    <Suspense fallback={<Barra pathname={null} />}>
      <BarraConRuta />
    </Suspense>
  );
}

function BarraConRuta() {
  return <Barra pathname={usePathname()} />;
}

function Barra({ pathname }: { pathname: string | null }) {
  return (
    <nav
      aria-label="Secciones"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)]"
    >
      <ul className="mx-auto my-0 flex max-w-xl list-none justify-around p-0">
        {SECCIONES.map(({ href, texto, Icono, activa }) => {
          const actual = pathname !== null && activa(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={actual ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-xs no-underline",
                  actual ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                <Icono className="size-6" strokeWidth={actual ? 2.5 : 2} aria-hidden="true" />
                {texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
