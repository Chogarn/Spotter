// Confeti suelto: [izquierda %, arriba %, tamaño en px, color, giro en grados]. Los que tienen giro son
// cuadraditos; el resto, puntos.
const CONFETI: [number, number, number, string, number][] = [
  [2, 40, 10, "bg-disco-rojo", 0],
  [8, 5, 8, "bg-disco-azul", 0],
  [14, 60, 12, "bg-disco-amarillo", 25],
  [21, 20, 10, "bg-disco-verde", 0],
  [28, 70, 8, "bg-disco-rojo", 40],
  [35, 2, 12, "bg-disco-azul", 25],
  [43, 45, 8, "bg-disco-amarillo", 0],
  [50, 75, 10, "bg-disco-verde", 30],
  [57, 10, 10, "bg-disco-rojo", 0],
  [64, 55, 12, "bg-disco-azul", 20],
  [72, 25, 8, "bg-disco-verde", 0],
  [79, 70, 10, "bg-disco-amarillo", 35],
  [86, 5, 12, "bg-disco-rojo", 25],
  [92, 50, 8, "bg-disco-azul", 0],
  [97, 20, 10, "bg-disco-verde", 40],
];

// El festejo al terminar una semana: confeti de los colores de los discos que cae al aparecer y
// después flota sin parar (sin movimiento si la persona lo pidió así). Es solo decoración.
export function Festejo() {
  return (
    <div className="relative mb-2 h-10 w-full" aria-hidden="true">
      {CONFETI.map(([izquierda, arriba, tamano, color, giro], i) => (
        <span
          key={i}
          className={`confeti absolute ${color} ${giro ? "rounded-[2px]" : "rounded-full"}`}
          style={{
            left: `${izquierda}%`,
            top: `${arriba}%`,
            width: tamano,
            height: tamano,
            "--giro": `${giro}deg`,
            "--ritmo": `${1.9 + (i % 4) * 0.35}s`,
            animationDelay: `${i * 60}ms, ${900 + i * 60}ms`,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}
