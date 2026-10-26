import type { DayDetail, ExerciseItem, RealSet, SetItem } from "./api";

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

// Cuántas series del ejercicio ya tienen algo registrado ("hechas").
export function seriesRegistradas(exercise: ExerciseItem): number {
  return exercise.sets.filter((s) => s.real).length;
}

// ¿El ejercicio está hecho? Solo cuando el usuario lo cerró con "Marcar como hecho": marcar las
// series una por una no lo cierra.
export function estaHecho(exercise: ExerciseItem): boolean {
  return exercise.completed === true;
}

export const dayStateText = {
  pending: "",
  partial: "a medias",
  completed: "completado",
} as const;

export const goalText: Record<string, string> = {
  masa: "masa",
  fuerza: "fuerza",
  perder_grasa: "perder grasa",
  condicion_general: "condición general",
  mantenerme_activo: "mantenerme activo",
};

// ¿El nombre de la rutina ya dice el objetivo ("Fuerza · desde el 15/10")? Entonces no se repite al
// lado. Si el usuario le puso otro nombre, el objetivo sí se muestra.
export function nombreDiceElObjetivo(nombre: string, goal: string): boolean {
  const objetivo = goalText[goal];
  return Boolean(objetivo) && nombre.toLowerCase().includes(objetivo.toLowerCase());
}

export const statusText = { active: "activa", closed: "cerrada", draft: "borrador" } as const;

// "2026-10-08" -> "8/10/2026" (sin pasar por Date, para no correr el día por la zona horaria).
export function shortDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  return `${Number(d)}/${Number(m)}/${y}`;
}

// Lo que se hizo en un día, para la pantalla de "Día completado": series con algo registrado, kilos
// movidos (repeticiones × kilos de las series con las dos cosas) y cuánto tardó (de "Empezar día" a
// "Día completado"; nulo si falta alguno de los dos momentos).
export function resumenDelDia(dia: DayDetail): { series: number; kg: number; minutos: number | null } {
  let series = 0;
  let kg = 0;
  for (const ejercicio of dia.exercises) {
    for (const serie of ejercicio.sets) {
      if (!serie.real) continue;
      series += 1;
      if (serie.real.reps !== null && serie.real.weight_kg !== null) kg += serie.real.reps * serie.real.weight_kg;
    }
  }
  let minutos: number | null = null;
  if (dia.started_at && dia.finished_at) {
    const ms = new Date(dia.finished_at).getTime() - new Date(dia.started_at).getTime();
    if (ms >= 0) minutos = Math.round(ms / 60000);
  }
  return { series, kg, minutos };
}
