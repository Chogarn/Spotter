import Link from "next/link";

import { cn } from "cn";

// Las dos pantallas de Progreso: los resúmenes de cada semana y la evolución por ejercicio. Se
// llega a cada una desde Inicio; estas pestañas sirven para pasar de una a la otra.
const PESTANAS = [
  { href: "/progreso", texto: "Resúmenes semanales" },
  { href: "/progreso/estadisticas", texto: "Estadísticas" },
];

export function PestanasProgreso({ actual }: { actual: "/progreso" | "/progreso/estadisticas" }) {
  return (
    <nav aria-label="Progreso" className="mb-4 flex rounded-full bg-muted p-1">
      {PESTANAS.map(({ href, texto }) => (
        <Link
          key={href}
          href={href}
          aria-current={href === actual ? "page" : undefined}
          className={cn(
            "flex-1 rounded-full py-2 text-center text-sm font-medium no-underline outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
            href === actual ? "bg-primary text-primary-foreground" : "text-foreground",
          )}
        >
          {texto}
        </Link>
      ))}
    </nav>
  );
}
