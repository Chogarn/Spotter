// Curva suave que no se pasa de los datos (interpolación monótona): pasa por todos los puntos
// sin las "olas" que haría una curva común entre un valor y otro. Devuelve el `d` de un <path>.
export function curva(xs: number[], ys: number[]): string {
  const n = xs.length;
  if (n < 2) return "";
  const dx = xs.slice(1).map((x, i) => x - xs[i]);
  const m = ys.slice(1).map((y, i) => (y - ys[i]) / (dx[i] || 1));
  const tan = [m[0]];
  for (let i = 1; i < n - 1; i++) tan.push(m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2);
  tan.push(m[n - 2]);
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      tan[i] = 0;
      tan[i + 1] = 0;
      continue;
    }
    const a = tan[i] / m[i];
    const b = tan[i + 1] / m[i];
    const h = Math.hypot(a, b);
    if (h > 3) {
      tan[i] = (3 * a * m[i]) / h;
      tan[i + 1] = (3 * b * m[i]) / h;
    }
  }
  let d = `M${xs[0]},${ys[0]}`;
  for (let i = 0; i < n - 1; i++) {
    const c = dx[i] / 3;
    d += ` C${xs[i] + c},${ys[i] + tan[i] * c} ${xs[i + 1] - c},${ys[i + 1] - tan[i + 1] * c} ${xs[i + 1]},${ys[i + 1]}`;
  }
  return d;
}
