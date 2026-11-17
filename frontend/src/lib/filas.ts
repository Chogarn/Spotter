// Reparte una lista en filas parejas: hasta `maxPorFila` van en una sola fila; si son más, se
// dividen en la menor cantidad de filas posible y con casi la misma cantidad cada una
// (8 son 4 y 4, 9 son 5 y 4), para que no quede un elemento solo abajo.
// Lo usa "¡Listo el Día N!" para los discos del día (decisión 136).
export function repartirEnFilas<T>(items: T[], maxPorFila = 7): T[][] {
  if (items.length === 0) return [];
  const cantidadFilas = Math.ceil(items.length / maxPorFila);
  const porFila = Math.ceil(items.length / cantidadFilas);
  return Array.from({ length: cantidadFilas }, (_, f) => items.slice(f * porFila, (f + 1) * porFila));
}
