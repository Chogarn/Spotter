import type { DayDetail } from "@/lib/api";

// El cronómetro de la entrada en calor y del cardio (decisión 122). Se guarda en el navegador la
// hora en que se tocó "Empezar" y cuántos segundos llevaba detenido el día en ese momento: así
// sigue corriendo si se sale de la pantalla (como el reloj de descanso) y lo que el día esté
// detenido después no cuenta.
export type Crono = { inicio: string; pausaBase: number };

// `paso` es la entrada en calor ("calor") o el ejercicio y la serie ("3-0").
function clave(weekId: number, dayIndex: number, paso: string): string {
  return `spotter_crono_${weekId}_${dayIndex}_${paso}`;
}

export function leerCrono(weekId: number, dayIndex: number, paso: string): Crono | null {
  try {
    const crudo = localStorage.getItem(clave(weekId, dayIndex, paso));
    if (!crudo) return null;
    const c = JSON.parse(crudo) as Crono;
    return typeof c.inicio === "string" && Number.isFinite(c.pausaBase) ? c : null;
  } catch {
    return null;
  }
}

export function empezarCrono(dia: DayDetail, paso: string): Crono {
  const c = { inicio: new Date().toISOString(), pausaBase: dia.paused_seconds ?? 0 };
  try {
    localStorage.setItem(clave(dia.week_id, dia.day_index, paso), JSON.stringify(c));
  } catch {}
  return c;
}

export function borrarCrono(weekId: number, dayIndex: number, paso: string): void {
  try {
    localStorage.removeItem(clave(weekId, dayIndex, paso));
  } catch {}
}

// Al reiniciar el día se borran todos sus cronómetros.
export function borrarCronosDelDia(weekId: number, dayIndex: number): void {
  try {
    const prefijo = clave(weekId, dayIndex, "");
    for (const k of Object.keys(localStorage)) if (k.startsWith(prefijo)) localStorage.removeItem(k);
  } catch {}
}

// Lo que se resta del cronómetro: lo que el día estuvo detenido desde que se lo empezó.
export function pausaDelCrono(c: Crono, dia: DayDetail): number {
  return Math.max(0, (dia.paused_seconds ?? 0) - c.pausaBase);
}

// Los minutos que se guardan al tocar "Finalizar": redondeados, como mínimo 1 y como máximo 180
// (el tope del backend).
export function minutosDelCrono(c: Crono, dia: DayDetail): number {
  const hasta = dia.paused_at ? new Date(dia.paused_at).getTime() : Date.now();
  const segundos = (hasta - new Date(c.inicio).getTime()) / 1000 - pausaDelCrono(c, dia);
  return Math.min(180, Math.max(1, Math.round(segundos / 60)));
}
