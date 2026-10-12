import { cn } from "cn";

// Un disco de pesas (decisión 41): marca el estado de un día o de una serie.
// Lleno de rojo si está hecho, con borde rojo si está a medias y punteado si falta.
export type EstadoDisco = "hecho" | "parcial" | "pendiente";

export function Disco({
  estado,
  className,
  children,
}: {
  estado: EstadoDisco;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full border-[3px] text-xs font-semibold",
        estado === "hecho" && "border-disco-tinta bg-disco-rojo text-white",
        estado === "parcial" && "border-disco-rojo",
        estado === "pendiente" && "border-dashed border-muted-foreground/60 text-muted-foreground",
        className,
      )}
    >
      {children}
    </span>
  );
}

// El estado de un día de la semana (`WeekDetail.days[].state`) como disco.
export const estadoDia = {
  completed: "hecho",
  partial: "parcial",
  pending: "pendiente",
} as const satisfies Record<string, EstadoDisco>;
