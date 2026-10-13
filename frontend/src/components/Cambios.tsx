import type { ExerciseItem, ProposalChanges, SetItem } from "@/lib/api";
import { restText, summarize } from "@/lib/format";
import { cn } from "cn";

// Antes y después en la propuesta de semana nueva (#49): la etiqueta de cada tarjeta y la
// pestaña "Cambios". El "antes" es lo planificado la semana anterior (decisión del usuario).

export type CambioEjercicio = ProposalChanges["exercises"][number];

// El mismo nombre normalizado que usa el backend: sin tildes, sin espacios de más y en minúsculas.
export function claveEjercicio(nombre: string): string {
  return nombre.normalize("NFKD").replace(/\p{Diacritic}/gu, "").replace(/\s+/g, " ").trim().toLowerCase();
}

function resumenDe(kind: ExerciseItem["kind"], sets: SetItem[]): string {
  return summarize({ name: "", kind, rest_seconds: null, execution_notes: null, reason: null, sets });
}

function mayorPeso(sets: SetItem[]): number | null {
  const pesos = sets.map((s) => s.target_weight_kg).filter((w): w is number => w !== null);
  return pesos.length ? Math.max(...pesos) : null;
}

function kg(valor: number): string {
  return `${valor.toLocaleString("es-AR")} kg`;
}

// La etiqueta chica de la tarjeta: nuevo, ↑/↓ antes X kg, antes 3 × 10 o sin cambios.
export function EtiquetaCambio({ cambio, kind }: { cambio: CambioEjercicio; kind: ExerciseItem["kind"] }) {
  let texto = "sin cambios";
  let clase = "bg-muted text-muted-foreground";
  if (cambio.status === "nuevo") {
    texto = "nuevo";
    clase = "bg-disco-azul/15 text-disco-azul";
  } else if (cambio.sets_changed) {
    texto = `${cambio.load === "sube" ? "↑ " : cambio.load === "baja" ? "↓ " : ""}antes ${resumenDe(kind, cambio.sets_before)}`;
    clase = cambio.load === "sube" ? "bg-disco-verde/15 text-disco-verde-texto" : "bg-muted text-foreground";
  } else if (cambio.load) {
    const antes = mayorPeso(cambio.sets_before);
    texto = `${cambio.load === "sube" ? "↑" : "↓"} antes ${antes !== null ? kg(antes) : ""}`;
    clase = cambio.load === "sube" ? "bg-disco-verde/15 text-disco-verde-texto" : "bg-muted text-foreground";
  }
  return <span className={cn("mt-1.5 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium", clase)}>{texto}</span>;
}

// La pestaña "Cambios": todo junto, agrupado. Lo que queda igual solo se cuenta.
export function ListaCambios({
  cambios,
  tipos,
}: {
  cambios: ProposalChanges;
  tipos: Record<string, ExerciseItem["kind"]>;
}) {
  const carga = cambios.exercises.filter((c) => c.load);
  const series = cambios.exercises.filter((c) => c.status !== "nuevo" && c.sets_changed);
  const descanso = cambios.exercises.filter((c) => c.rest_changed);
  const nuevos = cambios.exercises.filter((c) => c.status === "nuevo");
  const iguales = cambios.exercises.filter((c) => c.status === "igual").length;
  const kind = (c: CambioEjercicio) => tipos[claveEjercicio(c.name)] ?? "strength";
  const nada = !carga.length && !series.length && !descanso.length && !nuevos.length && !cambios.removed.length;

  return (
    <div className="grid gap-2.5">
      <p className="m-0 text-sm text-muted-foreground">Comparado con lo planificado en la semana {cambios.base_week_number}.</p>
      {nada && <p className="m-0">La IA mantuvo la semana tal cual.</p>}
      {carga.length > 0 && (
        <Grupo titulo="Cambia la carga">
          {carga.map((c) => (
            <Fila key={c.name} nombre={c.name}>
              {kg(mayorPeso(c.sets_before) ?? 0)} → <b className="text-disco-azul">{kg(mayorPeso(c.sets_after) ?? 0)}</b>
            </Fila>
          ))}
        </Grupo>
      )}
      {series.length > 0 && (
        <Grupo titulo="Cambian series o repeticiones">
          {series.map((c) => (
            <Fila key={c.name} nombre={c.name}>
              {resumenDe(kind(c), c.sets_before)} → <b>{resumenDe(kind(c), c.sets_after)}</b>
            </Fila>
          ))}
        </Grupo>
      )}
      {descanso.length > 0 && (
        <Grupo titulo="Cambia el descanso">
          {descanso.map((c) => (
            <Fila key={c.name} nombre={c.name}>
              {c.rest_before === null ? "sin descanso" : restText(c.rest_before)} →{" "}
              <b>{c.rest_after === null ? "sin descanso" : restText(c.rest_after)}</b>
            </Fila>
          ))}
        </Grupo>
      )}
      {(nuevos.length > 0 || cambios.removed.length > 0) && (
        <Grupo titulo="Entran y salen">
          {nuevos.map((c) => (
            <Fila key={c.name} nombre={c.name}>
              <span className="text-disco-azul">entra · día {c.day_index}</span>
            </Fila>
          ))}
          {cambios.removed.map((nombre) => (
            <Fila key={nombre} nombre={<s className="text-muted-foreground">{nombre}</s>}>
              <span className="text-muted-foreground">sale</span>
            </Fila>
          ))}
        </Grupo>
      )}
      {iguales > 0 && !nada && (
        <p className="m-0 px-1 text-sm text-muted-foreground">
          El resto ({iguales} {iguales === 1 ? "ejercicio" : "ejercicios"}) queda igual.
        </p>
      )}
    </div>
  );
}

function Grupo({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4">
      <h3 className="mt-0 mb-1 text-sm font-normal text-muted-foreground">{titulo}</h3>
      <ul className="m-0 list-none p-0">{children}</ul>
    </section>
  );
}

function Fila({ nombre, children }: { nombre: React.ReactNode; children: React.ReactNode }) {
  return (
    <li className="flex items-baseline gap-3 border-t border-border py-2 first:border-t-0">
      <span className="flex-1">{nombre}</span>
      <span className="text-right text-sm">{children}</span>
    </li>
  );
}
