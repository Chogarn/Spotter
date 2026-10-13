"use client";

import { ChartLine, Dumbbell, House, ListChecks, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";

import { cn } from "cn";

// Barra fija abajo, siempre, también en la computadora (decisión 42). Cinco lugares, con Entrenar
// en el centro como un botón redondo elevado (decisiones 47 y 51). Entrenar abarca lo que se abre
// desde ahí: la semana, el día, el ejercicio y la propuesta.
const SECCIONES = [
  { href: "/", texto: "Inicio", Icono: House, activa: (p: string) => p === "/" },
  { href: "/rutinas", texto: "Rutinas", Icono: ListChecks, activa: (p: string) => p.startsWith("/rutinas") },
  {
    href: "/entrenar",
    texto: "Entrenar",
    Icono: Dumbbell,
    activa: (p: string) => p.startsWith("/entrenar") || p.startsWith("/semanas") || p.startsWith("/rutina/"),
    central: true,
  },
  { href: "/progreso", texto: "Progreso", Icono: ChartLine, activa: (p: string) => p.startsWith("/progreso") },
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
      <ul className="mx-auto my-0 flex h-(--alto-barra) max-w-xl list-none items-end justify-around p-0">
        {SECCIONES.map(({ href, texto, Icono, activa, central }) => {
          const actual = pathname !== null && activa(pathname);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={actual ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2 text-xs no-underline outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  actual ? "font-semibold text-foreground" : "text-muted-foreground",
                )}
              >
                {central ? (
                  // El botón del centro sobresale de la barra; el borde del color del fondo lo separa.
                  <span className="-mt-8 mb-0.5 flex size-14 items-center justify-center rounded-full border-4 border-background bg-primary text-primary-foreground">
                    <Icono className="size-7" strokeWidth={2.25} aria-hidden="true" />
                  </span>
                ) : (
                  <Icono className="size-6" strokeWidth={actual ? 2.5 : 2} aria-hidden="true" />
                )}
                {texto}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
