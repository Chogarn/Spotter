export const API = process.env.NEXT_PUBLIC_API_URL;

// Todas las llamadas a la API pasan por acá: mandan la cookie de sesión (httpOnly) y, si la sesión
// no es válida (401), la cierran y llevan a /login. Las de /auth/ las maneja cada pantalla.
export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(`${API}${path}`, { ...init, credentials: "include" });
  if (res.status === 401 && typeof window !== "undefined" && !path.startsWith("/auth/")) {
    // Borra la cookie vieja (si no, el proxy la vería y /login rebotaría a la portada).
    await fetch(`${API}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
    // Navegación completa a propósito: reinicia el estado de todas las pantallas abiertas.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }
  return res;
}

export type SessionUser = { id: number; email: string; name: string };

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

// "¿Cómo te fue?" (decisión 74): marcas opcionales e independientes al terminar un ejercicio.
// Vacío = sin dato (nunca se lee como "bien" ni como "sin dolor").
export type LoadFeel = "light" | "good" | "heavy" | "very_heavy";
export type PainLevel = "mild" | "moderate" | "strong";

export type ExerciseItem = {
  id?: number; // solo en el plan activo: con él se marca como hecho
  completed?: boolean; // cerrado con "Marcar como hecho": bloqueado hasta reabrirlo
  load_feel?: LoadFeel | null;
  pain?: PainLevel | null;
  name: string;
  kind: "strength" | "cardio" | "isometric";
  rest_seconds: number | null;
  execution_notes: string | null;
  reason: string | null;
  sets: SetItem[];
  // "Semana pasada" (solo en la vista del día): lo realizado en la semana cerrada anterior de la
  // rutina, serie por serie (null la que no se registró). Vacío si no hay semana anterior.
  previous?: (RealSet | null)[] | null;
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
  routine: { days: DayItem[]; notices: string[]; summary?: string | null };
  day_minutes: number[];
  warnings: { rule: string; message: string }[];
  // Solo al aceptar: qué quedó creado (la semana, su número y la rutina).
  week_id?: number | null;
  week_number?: number | null;
  routine_id?: number | null;
  routine_name?: string | null;
};

// Antes y después de una propuesta de semana nueva (#49). `has_base` falso en la primera rutina.
export type ProposalChanges = {
  has_base: boolean;
  base_week_number: number | null;
  exercises: {
    name: string;
    day_index: number;
    status: "nuevo" | "cambia" | "igual";
    sets_before: SetItem[];
    sets_after: SetItem[];
    load: "sube" | "baja" | null;
    sets_changed: boolean;
    rest_before: number | null;
    rest_after: number | null;
    rest_changed: boolean;
  }[];
  removed: string[];
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
  days_per_week: number | null; // cuántos días por semana entrena (decisión 52)
  session_minutes: number | null; // cuánto dura cada sesión (decisión 82)
  last_week_day_states: DayState[]; // los días de la semana más nueva, en orden
};

export type RoutineDetail = {
  id: number;
  name: string;
  goal: string;
  level: string;
  days_per_week: number | null;
  weeks: WeekSummary[]; // de la más nueva a la más vieja
};

export type WeekSummary = {
  id: number;
  number: number; // orden de activación dentro de la rutina (la primera semana es la 1)
  status: "draft" | "active" | "closed";
  week_start: string;
  closed_at: string | null;
  day_count: number;
  day_states: DayState[]; // cada día, en orden
};

export type DayState = "pending" | "partial" | "completed";

// Progreso (#62): los ejercicios de una rutina y la evolución de uno a lo largo de las semanas.
export type RoutineExercise = { id: number; name: string; kind: ExerciseItem["kind"] };

// Progreso por ejercicio, acumulando todas las rutinas (decisión 69).
export type ExerciseOption = { id: number; name: string; kind: ExerciseItem["kind"]; weeks_count: number };

export type TimelinePoint = {
  week_id: number;
  number: number; // semana dentro de su rutina
  status: string;
  week_start: string | null;
  routine_id: number;
  routine_name: string;
  goal: string;
  value: number | null;
};

export type ExerciseTimeline = {
  exercise_id: number;
  name: string;
  kind: ExerciseItem["kind"];
  unit: "kg" | "reps" | "s" | "min";
  points: TimelinePoint[]; // de la semana más vieja a la más nueva
  record: number | null;
  first_value: number | null;
  last_value: number | null;
  weeks_with_data: number;
  routines_count: number;
};

export type ExerciseHistory = {
  exercise_id: number;
  name: string;
  kind: ExerciseItem["kind"];
  unit: "kg" | "reps" | "s" | "min";
  weeks: { week_id: number; number: number; status: string; value: number | null }[];
  record: number | null;
};

// El calendario de entrenamientos (`GET /calendar`): histórico, de todas las rutinas.
export type CalendarSession = {
  local_date: string; // AAAA-MM-DD, el día de la persona
  finished_at: string;
  duration_minutes: number | null; // lo que tardó (decisión 82)
  week_id: number;
  week_number: number;
  day_index: number;
  title: string;
  routine_name: string;
};
export type CalendarMonth = {
  month: string; // AAAA-MM
  first_month: string | null;
  total_days: number;
  month_days: number;
  sessions: CalendarSession[];
};

// El resumen de una semana para Progreso (#28): se calcula en el backend, no se guarda.
export type WeekSummaryDetail = {
  week_id: number;
  routine_id: number;
  routine_name: string;
  number: number;
  status: "draft" | "active" | "closed";
  week_start: string;
  closed_at: string | null;
  day_states: DayState[];
  days_completed: number;
  sets_done: number;
  sets_planned: number;
  kg_moved: number;
  cardio_minutes: number;
  duration_minutes: number | null; // lo que tardó (decisión 82); nulo si no se midió
  day_durations: (number | null)[]; // por día, en el orden de day_states
  exercises: {
    name: string;
    kind: ExerciseItem["kind"];
    signal: string;
    load_feel: LoadFeel | null;
    pain: PainLevel | null;
    // Cada serie con lo que tocaba y lo que se hizo (nulo si no se registró).
    sets: {
      planned: {
        reps: number | null;
        duration_minutes: number | null;
        duration_seconds: number | null;
        weight_kg: number | null;
      };
      real: RealSet | null;
    }[];
  }[];
  ai_summary: string | null;
  closing_note: string | null;
};

export type WeekDetail = {
  id: number;
  closing_note?: string | null;
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
    state: DayState;
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
  started_at: string | null; // cuándo se tocó "Empezar día" (decisión 82)
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
