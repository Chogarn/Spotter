import { BicepsFlexed, Dumbbell, Flame, Footprints, HeartPulse, type LucideIcon } from "lucide-react";

import { cn } from "cn";

// Un dibujo por objetivo de rutina, sobre un disco oscuro como el resto de la app. Es decorativo:
// al lado siempre va el nombre del objetivo, por eso no lleva texto para lectores de pantalla.
const ICONOS: Record<string, LucideIcon> = {
  masa: BicepsFlexed,
  fuerza: Dumbbell,
  perder_grasa: Flame,
  condicion_general: HeartPulse,
  mantenerme_activo: Footprints,
};

const TAMANOS = {
  xs: { disco: "size-8", icono: "size-4" },
  sm: { disco: "size-10", icono: "size-5" },
  md: { disco: "size-12", icono: "size-6" },
} as const;

// Con `aro` el disco va blanco con un aro de color: rojo = rutina en curso (el rojo de la semana en
// curso) y gris = lista para continuar. Sin `aro`, el disco oscuro de siempre.
export function IconoObjetivo({
  objetivo,
  tamano = "sm",
  aro,
  className,
}: {
  objetivo: string;
  tamano?: keyof typeof TAMANOS;
  aro?: "rojo" | "gris";
  className?: string;
}) {
  const Icono = ICONOS[objetivo];
  if (!Icono) return null;
  const t = TAMANOS[tamano];
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full",
        aro ? "border-4 bg-card text-disco-tinta" : "bg-disco-tinta text-white",
        aro === "rojo" && "border-disco-rojo",
        aro === "gris" && "border-border",
        t.disco,
        className,
      )}
    >
      <Icono className={t.icono} />
    </span>
  );
}
