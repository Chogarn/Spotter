"use client";

import { Dumbbell, House, UserRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Suspense, useEffect } from "react";

import { MiniBarraEntreno } from "@/components/MiniBarraEntreno";
import { type Week, apiFetch } from "@/lib/api";
import { cn } from "cn";

// Barra fija abajo, siempre, también en la computadora (decisión 42). Tres lugares, con Entrenar
// en el centro como un botón redondo elevado (decisiones 47 y 51). Rutinas y Progreso se abren
// desde Inicio, y mientras se está en ellos Inicio queda marcado. Entrenar abarca lo que se abre
// desde ahí: la semana, el día, el ejercicio y la propuesta.
const SECCIONES = [
  {
    href: "/",
    texto: "Inicio",
    Icono: House,
    activa: (p: string) => p === "/" || p.startsWith("/rutinas") || p.startsWith("/progreso"),
  },
  {
    href: "/entrenar",
    texto: "Entrenar",
    Icono: Dumbbell,
    activa: (p: string) => p.startsWith("/entrenar") || p.startsWith("/semanas") || p.startsWith("/rutina/"),
    central: true,
  },
  { href: "/perfil", texto: "Perfil", Icono: UserRound, activa: (p: string) => p.startsWith("/perfil") },
];

// Entrenar recuerda dónde se estaba dentro de su sección (el ejercicio, el día o la semana) y
// vuelve ahí (decisión 84). Se guarda por pestaña del navegador. La propuesta no se recuerda.
const ULTIMO_ENTRENAR = "spotter_ultimo_entrenar";

// Solo el día y su modo entrenar: la semana de /semanas/[id] y los días que se miran desde Rutinas
// (`?desde=rutinas`) no son parte de entrenar.
function recordable(p: string): boolean {
  return /^\/semanas\/\d+\/dia\//.test(p);
}

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
  const router = useRouter();

  useEffect(() => {
    if (pathname === null || !recordable(pathname)) return;
    if (window.location.search.includes("desde=rutinas")) return;
    try {
      sessionStorage.setItem(ULTIMO_ENTRENAR, pathname);
    } catch {}
  }, [pathname]);

  // Entrenar vuelve a donde se estaba dentro de su sección; sin eso, al ejercicio activo si hay un
  // día empezado y sin completar; y si no, a la semana. Estando ya dentro de la sección, lleva a la
  // semana (como cualquier pestaña). Un clic con Ctrl o Cmd abre el enlace normal. Es solo un atajo:
  // si algo falla, va a la semana.
  async function irAEntrenar(e: React.MouseEvent<HTMLAnchorElement>) {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    if (pathname !== null && SECCIONES[1].activa(pathname)) {
      router.push("/entrenar");
      return;
    }
    let ultimo: string | null = null;
    try {
      ultimo = sessionStorage.getItem(ULTIMO_ENTRENAR);
    } catch {}
    if (ultimo && recordable(ultimo)) {
      router.push(ultimo);
      return;
    }
    let destino = "/entrenar";
    try {
      const res = await apiFetch(`/weeks/active`);
      if (res.ok) {
        const semana: Week = await res.json();
        if (semana.in_progress_day) destino = `/semanas/${semana.id}/dia/${semana.in_progress_day}/entrenar`;
      }
    } catch {}
    router.push(destino);
  }

  return (
    <>
      {/* "Entrenando ahora": en toda pantalla que no sea de la sección Entrenar. */}
      <MiniBarraEntreno visible={pathname !== null && !SECCIONES[1].activa(pathname)} />
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
                onClick={central ? irAEntrenar : undefined}
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
    </>
  );
}
