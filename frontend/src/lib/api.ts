export const API = process.env.NEXT_PUBLIC_API_URL;

// Lo que devuelve la API (ver backend/app/schemas.py y backend/app/ai/routine.py).
export type SetItem = {
  reps: number | null;
  duration_minutes: number | null;
  duration_seconds: number | null;
  target_weight_kg: number | null;
};

export type ExerciseItem = {
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

export type WeekSummary = {
  id: number;
  number: number; // orden de activación (la primera semana es la 1)
  status: "draft" | "active" | "closed";
  week_start: string;
  closed_at: string | null;
  day_count: number;
};

export type WeekDetail = {
  id: number;
  number: number;
  status: "draft" | "active" | "closed";
  week_start: string;
  days: { day_index: number; title: string; exercise_count: number; minutes: number }[];
};

export type DayDetail = {
  week_id: number;
  week_number: number;
  week_status: "draft" | "active" | "closed";
  day_index: number;
  title: string;
  mobility_notes: string | null;
  minutes: number;
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
