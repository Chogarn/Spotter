import { cn } from "cn";

// Un dibujo por nivel: una barra con discos de pesas, cada vez más grandes y más cantidad
// (principiante, intermedio, avanzado), sobre el mismo disco oscuro que el de los objetivos. Es
// decorativo: al lado siempre va el nombre del nivel.
// Cada disco es [x, alto] y se espeja del otro lado de la barra.
const DISCOS: Record<string, [number, number][]> = {
  principiante: [[5, 9]],
  intermedio: [
    [5, 14],
    [9.5, 8],
  ],
  avanzado: [
    [3.5, 20],
    [8, 14],
    [12, 8],
  ],
};
const ANCHO = 30;

export function IconoNivel({ nivel, className }: { nivel: string; className?: string }) {
  const discos = DISCOS[nivel];
  if (!discos) return null;
  return (
    <span
      aria-hidden="true"
      className={cn("flex size-12 shrink-0 items-center justify-center rounded-full bg-disco-tinta", className)}
    >
      <svg width={ANCHO} height="26" viewBox={`0 0 ${ANCHO} 26`} fill="white">
        <rect x="3" y="11.8" width="24" height="2.4" rx="1.2" />
        {discos.map(([x, alto]) => (
          <g key={x}>
            <rect x={x} y={13 - alto / 2} width="3" height={alto} rx="1.2" />
            <rect x={ANCHO - x - 3} y={13 - alto / 2} width="3" height={alto} rx="1.2" />
          </g>
        ))}
      </svg>
    </span>
  );
}
