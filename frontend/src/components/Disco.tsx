import { cn } from "cn";

// Un disco de pesas (decisión 41): marca el estado de un día o de una serie.
// Lleno de rojo si está hecho, con borde rojo si está a medias y punteado si falta.
// `cerrada`: en una semana ya cerrada lo hecho va en verde (cumplido).
export type EstadoDisco = "hecho" | "parcial" | "pendiente";

export function Disco({
  estado,
  cerrada = false,
  className,
  children,
}: {
  estado: EstadoDisco;
  cerrada?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full border-[3px] text-xs font-semibold",
        estado === "hecho" && "border-disco-tinta text-white",
        estado === "hecho" && (cerrada ? "bg-disco-verde" : "bg-disco-rojo"),
        estado === "parcial" && (cerrada ? "border-disco-verde" : "border-disco-rojo"),
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

// Los días de una semana como una fila de discos chicos, con el resumen para lectores de pantalla.
export function DiscosSemana({
  estados,
  cerrada = false,
}: {
  estados: (keyof typeof estadoDia)[];
  cerrada?: boolean;
}) {
  const hechos = estados.filter((e) => e === "completed").length;
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${hechos} de ${estados.length} días hechos`}>
      {estados.map((e, i) => (
        <Disco key={i} estado={estadoDia[e]} cerrada={cerrada} className="size-4 border-2" />
      ))}
    </span>
  );
}
