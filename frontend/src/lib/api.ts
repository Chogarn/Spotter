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
