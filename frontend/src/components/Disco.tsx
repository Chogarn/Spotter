import { cn } from "cn";

// Un disco de pesas (decisión 41): marca el estado de una serie, un ejercicio o un día.
// Rojo lleno: serie o ejercicio hecho. Verde lleno: día completado (en cualquier semana, en curso
// o cerrada; decisión 49). Borde rojo: día a medias. Borde amarillo: aviso (no llegaste a lo
// planificado; no es un error). Punteado: falta.
export type EstadoDisco = "hecho" | "completo" | "parcial" | "aviso" | "pendiente";

export function Disco({
  estado,
  hoy = false,
  className,
  children,
}: {
  estado: EstadoDisco;
  // El día que toca hoy: aro azul (el azul es la carga y lo que se está por hacer).
  hoy?: boolean;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex size-6 shrink-0 items-center justify-center rounded-full border-[3px] text-xs font-semibold",
        (estado === "hecho" || estado === "completo") && "border-disco-tinta text-white",
        estado === "hecho" && "bg-disco-rojo",
        estado === "completo" && "bg-disco-verde",
        estado === "parcial" && "border-disco-rojo",
        estado === "aviso" && "border-disco-amarillo bg-card",
        estado === "pendiente" && "border-dashed border-muted-foreground/60 text-muted-foreground",
        hoy && "border-solid border-disco-azul",
        className,
      )}
    >
      {children}
    </span>
  );
}

// El estado de un día de la semana (`WeekDetail.days[].state`) como disco.
export const estadoDia = {
  completed: "completo",
  partial: "parcial",
  pending: "pendiente",
} as const satisfies Record<string, EstadoDisco>;

// Los días de una semana como una fila de discos chicos, con el resumen para lectores de pantalla.
export function DiscosSemana({ estados }: { estados: (keyof typeof estadoDia)[] }) {
  const hechos = estados.filter((e) => e === "completed").length;
  return (
    <span className="inline-flex items-center gap-1" role="img" aria-label={`${hechos} de ${estados.length} días hechos`}>
      {estados.map((e, i) => (
        <Disco key={i} estado={estadoDia[e]} className="size-4 border-2" />
      ))}
    </span>
  );
}
