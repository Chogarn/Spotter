import type { LoadFeel, PainLevel } from "@/lib/api";

// Los textos de las marcas de carga y dolor (decisión 74). Desde la decisión 85 la app ya no
// pregunta esto en el modo entrenar: el esfuerzo y el dolor se cuentan en el comentario al cerrar
// la semana. Quedan estos textos para mostrar lo que se haya marcado antes (el resumen semanal).
export const CARGAS: { valor: LoadFeel; texto: string }[] = [
  { valor: "light", texto: "Liviana" },
  { valor: "good", texto: "Bien" },
  { valor: "heavy", texto: "Pesada" },
  { valor: "very_heavy", texto: "Muy pesada" },
];

export const DOLORES: { valor: PainLevel; texto: string }[] = [
  { valor: "mild", texto: "Leve" },
  { valor: "moderate", texto: "Moderado" },
  { valor: "strong", texto: "Fuerte" },
];

export function textoDeCarga(valor: LoadFeel): string {
  return CARGAS.find((c) => c.valor === valor)?.texto ?? valor;
}

export function textoDeDolor(valor: PainLevel): string {
  return DOLORES.find((d) => d.valor === valor)?.texto ?? valor;
}
