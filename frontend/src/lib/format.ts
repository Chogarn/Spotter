import type { ExerciseItem, RealSet, SetItem } from "./api";

const number = (n: number) => n.toLocaleString("es-AR");

// "3" si todos son iguales, "10 a 4" si cambian (de la primera serie a la última).
function value(values: number[], unit = ""): string {
  const first = values[0];
  const last = values[values.length - 1];
  const text = values.every((v) => v === first)
    ? number(first)
    : `${number(first)} a ${number(last)}`;
  return unit ? `${text} ${unit}` : text;
}

// Resumen de una línea de un ejercicio. Se calcula, no se guarda: "4 × 10 · 50 kg",
// y si las series difieren, un rango: "10 a 4 reps · 50 a 65 kg".
export function summarize(exercise: ExerciseItem): string {
  const sets = exercise.sets;
  const count = sets.length;

  if (exercise.kind === "cardio") {
    const minutes = sets.map((s) => s.duration_minutes ?? 0);
    return count === 1 ? `${number(minutes[0])} min` : `${count} × ${value(minutes, "min")}`;
  }

  if (exercise.kind === "isometric") {
    const seconds = sets.map((s) => s.duration_seconds ?? 0);
    const same = seconds.every((s) => s === seconds[0]);
    return same ? `${count} × ${number(seconds[0])} s` : `${count} series · ${value(seconds, "s")}`;
  }

  const reps = sets.map((s) => s.reps ?? 0);
  const sameReps = reps.every((r) => r === reps[0]);
  const parts = [sameReps ? `${count} × ${number(reps[0])}` : `${count} series · ${value(reps, "reps")}`];
  const weights = sets.map((s) => s.target_weight_kg);
  if (weights.every((w) => w !== null)) parts.push(value(weights as number[], "kg"));
  return parts.join(" · ");
}

export function restText(seconds: number | null): string {
  if (seconds === null) return "";
  return seconds % 60 === 0 ? `${seconds / 60} min` : `${seconds} s`;
}

// Una serie suelta, para el desglose: "10 reps · 50 kg", "45 s" o "30 min".
export function setText(kind: ExerciseItem["kind"], set: SetItem): string {
  if (kind === "cardio") return `${number(set.duration_minutes ?? 0)} min`;
  if (kind === "isometric") return `${number(set.duration_seconds ?? 0)} s`;
  const reps = `${number(set.reps ?? 0)} reps`;
  return set.target_weight_kg === null ? reps : `${reps} · ${number(set.target_weight_kg)} kg`;
}

// Lo realizado, con la forma de una serie, para mostrarlo con las mismas funciones.
export function realAsSet(real: RealSet): SetItem {
  return {
    reps: real.reps,
    duration_minutes: real.duration_minutes,
    duration_seconds: real.duration_seconds,
    target_weight_kg: real.weight_kg,
  };
}

// ¿Lo realizado es distinto de lo que tocaba?
export function differsFromPlan(plan: SetItem, real: RealSet): boolean {
  return (
    plan.reps !== real.reps ||
    plan.duration_minutes !== real.duration_minutes ||
    plan.duration_seconds !== real.duration_seconds ||
    plan.target_weight_kg !== real.weight_kg
  );
}

export const statusText = { active: "activa", closed: "cerrada", draft: "borrador" } as const;

// "2026-10-08" -> "8/10/2026" (sin pasar por Date, para no correr el día por la zona horaria).
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
}
