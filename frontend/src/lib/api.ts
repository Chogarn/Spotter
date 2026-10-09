export const API = process.env.NEXT_PUBLIC_API_URL;

// Lo que devuelve la API (ver backend/app/schemas.py y backend/app/ai/routine.py).
// Lo que el usuario realmente hizo en una serie (peso en `weight_kg`).
export type RealSet = {
  reps: number | null;
  duration_minutes: number | null;
  duration_seconds: number | null;
  weight_kg: number | null;
};

export type SetItem = {
  id?: number; // solo en el plan activo: con él se guarda lo realizado
  reps: number | null;
  duration_minutes: number | null;
  duration_seconds: number | null;
  target_weight_kg: number | null;
  real?: RealSet | null; // vacío si todavía no se registró nada en esta serie
};

export type ExerciseItem = {
  id?: number; // solo en el plan activo: con él se marca como hecho
  completed?: boolean; // cerrado con "Marcar como hecho": bloqueado hasta reabrirlo
  name: string;
  kind: "strength" | "cardio" | "isometric";
  rest_seconds: number | null;
  execution_notes: string | null;
  reason: string | null;
  sets: SetItem[];
};

export type DayItem = {
  title: string;
  mobility_notes: string | null;
  exercises: ExerciseItem[];
};

export type Proposal = {
  id: number;
  kind: string;
  status: "pending" | "accepted" | "discarded";
  routine: { days: DayItem[]; notices: string[] };
  day_minutes: number[];
  warnings: { rule: string; message: string }[];
};

export type Week = {
  id: number;
  days: { day_index: number; title: string }[];
};

export type Routine = {
  id: number;
  name: string;
  goal: string;
  level: string;
  week_count: number;
  has_active_week: boolean;
};

export type RoutineDetail = {
  id: number;
  name: string;
  goal: string;
  level: string;
  weeks: WeekSummary[]; // de la más nueva a la más vieja
};

export type WeekSummary = {
  id: number;
  number: number; // orden de activación dentro de la rutina (la primera semana es la 1)
  status: "draft" | "active" | "closed";
  week_start: string;
  closed_at: string | null;
  day_count: number;
};

export type WeekDetail = {
  id: number;
  routine_id: number;
  routine_name: string;
  number: number;
  status: "draft" | "active" | "closed";
  week_start: string;
  days: {
    day_index: number;
    title: string;
    exercise_count: number;
    minutes: number;
    state: "pending" | "partial" | "completed";
  }[];
};

export type DayDetail = {
  week_id: number;
  week_number: number;
  week_status: "draft" | "active" | "closed";
  day_index: number;
  title: string;
  mobility_notes: string | null;
  minutes: number;
  finished_at: string | null; // cuándo se tocó "Día completado"; vacío si el día sigue abierto
  exercises: ExerciseItem[];
};

// FastAPI devuelve los errores de validación como una lista en "detail".
export function errorText(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e) => `${(e.loc ?? []).slice(1).join(".")}: ${e.msg}`)
      .join("\n");
  }
  return "Error desconocido";
}

// Lee el mensaje de error de una respuesta que no salió bien.
export async function readError(res: Response): Promise<string> {
  try {
    return errorText((await res.json()).detail);
  } catch {
    return `Error ${res.status}`;
  }
}
