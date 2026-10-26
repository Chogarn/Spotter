"use client";

import { tituloDia } from "@/lib/format";
import { Check, MessageSquare, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { readError, type Proposal, type ProposalChanges, apiFetch } from "@/lib/api";
import { claveEjercicio, ListaCambios } from "@/components/Cambios";
import { Disco, estadoDia } from "@/components/Disco";
import { CambiarEjercicio } from "@/components/CambiarEjercicio";
import { ExerciseRow } from "@/components/ExerciseRow";
import { Flecha } from "@/components/Flecha";
import { Franja } from "@/components/Franja";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { cn } from "cn";
import { Cargando } from "@/components/Cargando";

const SPLIT_LABELS = {
  full_body: "Cuerpo completo",
  upper_lower: "Torso y pierna",
  ppl: "Empuje, tirón y piernas",
} as const;

function focoDelDia(split: Proposal["split"], indice: number): string | null {
  if (split === "full_body") return "Cuerpo completo";
  if (split === "upper_lower") return indice % 2 === 0 ? "Torso" : "Piernas";
  if (split === "ppl") return ["Empuje", "Tirón", "Piernas"][indice % 3];
  return null; // propuestas anteriores a la elección de split
}

export default function PropuestaView({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [propuesta, setPropuesta] = useState<Proposal | null>(null);
  const [cargando, setCargando] = useState(true);
  const [trabajando, setTrabajando] = useState(false);
  const [aceptada, setAceptada] = useState(false);
  const [error, setError] = useState("");
  const [pestana, setPestana] = useState<"semana" | "cambios" | "avisos">("semana");
  // Antes y después (#49): solo en una semana nueva; en la primera rutina viene sin base.
  const [cambios, setCambios] = useState<ProposalChanges | null>(null);
  // El día a la vista (uno por vez) y la tarjeta desplegada de ese día.
  const [diaActual, setDiaActual] = useState(0);
  const [abierta, setAbierta] = useState<number | null>(null);
  // El ejercicio que se está cambiando por otro del catálogo (decisión 65), si hay uno.
  const [cambiando, setCambiando] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/proposals/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setPropuesta(await res.json());
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

  function cargarCambios() {
    apiFetch(`/proposals/${id}/changes`)
      .then(async (res) => {
        if (res.ok) setCambios(await res.json());
      })
      .catch(() => {});
  }

  useEffect(cargarCambios, [id]);

  async function resolver(accion: "accept" | "discard") {
    setError("");
    setTrabajando(true);
    try {
      const res = await apiFetch(`/proposals/${id}/${accion}`, { method: "POST" });
      if (!res.ok) {
        setError(await readError(res));
      } else if (accion === "discard") {
        router.push("/");
        return;
      } else {
        setPropuesta(await res.json());
        setAceptada(true);
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setTrabajando(false);
  }

  const contenedor = { maxWidth: 576, margin: "0 auto", padding: "1.5rem 1rem 0" };

  if (cargando) return <Cargando />;

  if (!propuesta) {
    return (
      <main style={contenedor}>
        <ErrorMessage>{error}</ErrorMessage>
        <Button variant="outline" nativeButton={false} render={<Link href="/entrenar" />}>Ir a Entrenar</Button>
      </main>
    );
  }

  if (aceptada) {
    // Qué quedó creado: la primera semana de una rutina nueva, o la semana siguiente de una existente.
    const primera = propuesta.week_number === 1;
    const total = propuesta.routine.days.length;
    return (
      <main style={contenedor}>
        <section className="rounded-2xl border-2 border-disco-tinta bg-card p-5">
          <p className="m-0 flex items-center gap-1.5 text-sm font-medium text-disco-verde-texto">
            <Check className="size-5" aria-hidden="true" />
            Aceptada
          </p>
          <h1 className="mt-1 mb-0 text-4xl">
            {primera ? "Tu rutina ya está lista" : `Tu semana ${propuesta.week_number ?? ""} ya está lista`}
          </h1>
          {propuesta.routine_name && <p className="mt-1 mb-0 text-muted-foreground">{propuesta.routine_name}</p>}
          <div className="mt-3 flex items-center gap-1.5">
            {propuesta.routine.days.map((_, i) => (
              <Disco key={i} estado={estadoDia.pending} />
            ))}
            <span className="ml-1.5 text-sm text-muted-foreground">
              {total} {total === 1 ? "día" : "días"}
            </span>
          </div>
          <div className="mt-5 grid gap-2.5">
            <Button
              size="xl"
              className="w-full"
              nativeButton={false}
              render={
                <Link
                  href={propuesta.week_id ? `/semanas/${propuesta.week_id}/dia/1/entrenar` : "/entrenar"}
                />
              }
            >
              Comenzar entrenamiento
            </Button>
            <Button
              variant="outline"
              size="xl"
              className="w-full"
              nativeButton={false}
              render={<Link href={propuesta.routine_id ? `/rutinas/${propuesta.routine_id}` : "/rutinas"} />}
            >
              Ver mi rutina
            </Button>
          </div>
        </section>
      </main>
    );
  }

  if (propuesta.status !== "pending") {
    return (
      <main style={contenedor}>
        <p>Esta propuesta ya fue resuelta.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/entrenar" />}>Ir a Entrenar</Button>
      </main>
    );
  }

  const { days, notices, summary } = propuesta.routine;
  const totalAvisos = (summary ? 1 : 0) + propuesta.warnings.length + notices.length;
  const dia = days[diaActual] ?? days[0];
  const conBase = cambios?.has_base ? cambios : null;
  const cambioPorClave = new Map(conBase?.exercises.map((c) => [claveEjercicio(c.name), c]) ?? []);
  const totalCambios = conBase
    ? conBase.exercises.filter((c) => c.status !== "igual").length + conBase.removed.length
    : 0;
  const tipos = Object.fromEntries(days.flatMap((d) => d.exercises.map((e) => [claveEjercicio(e.name), e.kind])));
  const pestanas = conBase ? (["semana", "cambios", "avisos"] as const) : (["semana", "avisos"] as const);

  function irADia(i: number) {
    setDiaActual(i);
    setAbierta(null);
  }

  return (
    <main className="flex flex-1 flex-col">
      {/* Franja amarilla: el color de "pendiente", porque la propuesta espera tu decisión (decisión 77). */}
      <Franja
        aros="amarillo"
        volver={{ href: "/" }}
        arriba={<p className="m-0 mb-1 text-sm text-primary-foreground/70">Propuesta de la IA</p>}
        titulo={`${days.length} días · ${propuesta.split ? SPLIT_LABELS[propuesta.split] : "Rutina"} · ~${Math.round(propuesta.day_minutes.reduce((a, b) => a + b, 0) / days.length)} min`}
        subtitulo="La IA propone, vos decidís: nada se guarda hasta que aceptes."
      />
      <div style={{ ...contenedor, width: "100%", paddingTop: "1.25rem" }}>

      {/* Dos pestañas: la semana día por día y los avisos (resumen, avisos del código y notas). */}
      <div role="tablist" aria-label="Propuesta" className="my-3 flex rounded-full bg-muted p-1">
        {pestanas.map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={pestana === p}
            onClick={() => setPestana(p)}
            className={cn(
              "flex-1 rounded-full py-2 text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              pestana === p ? "bg-primary text-primary-foreground" : "text-foreground",
            )}
          >
            {p === "semana" ? "Semana" : p === "cambios" ? `Cambios (${totalCambios})` : `Avisos (${totalAvisos})`}
          </button>
        ))}
      </div>

      {pestana === "semana" ? (
        <section role="tabpanel" aria-label="Semana">
          {/* Una barra por día y flechas, como en el modo entrenar: se ve un día por vez. */}
          <div className="flex items-center gap-1">
            <Flecha
              direccion="anterior"
              que="Día"
              visible={diaActual > 0}
              nombre={days[diaActual - 1] && tituloDia(days[diaActual - 1].title)}
              onClick={() => irADia(diaActual - 1)}
            />
            {days.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irADia(i)}
                aria-label={`Día ${i + 1}: ${focoDelDia(propuesta.split, i) ?? tituloDia(d.title)}`}
                aria-current={i === diaActual ? "step" : undefined}
                className={cn(
                  "h-2 flex-1 rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                  i === diaActual ? "bg-disco-tinta" : "bg-border",
                )}
              />
            ))}
            <Flecha
              direccion="siguiente"
              que="Día"
              visible={diaActual < days.length - 1}
              nombre={days[diaActual + 1] && tituloDia(days[diaActual + 1].title)}
              onClick={() => irADia(diaActual + 1)}
            />
          </div>
          <h2 className="mt-3 mb-0 text-4xl">Día {diaActual + 1}</h2>
          <p className="mt-0 text-muted-foreground">
            {focoDelDia(propuesta.split, diaActual) ?? tituloDia(dia.title)}
            {focoDelDia(propuesta.split, diaActual) && dia.title !== focoDelDia(propuesta.split, diaActual)
              ? ` · ${tituloDia(dia.title)}`
              : null}
            {` · ~${propuesta.day_minutes[diaActual]} min`}
          </p>
          <p className="-mt-2 mb-4 text-sm text-muted-foreground">
            {dia.exercises.length} {dia.exercises.length === 1 ? "ejercicio" : "ejercicios"} · {dia.exercises.reduce((total, ejercicio) => total + ejercicio.sets.length, 0)} series planificadas
          </p>
          {dia.mobility_notes && <p className="text-sm">Movilidad: {dia.mobility_notes}</p>}
          <ol className="m-0 grid list-none gap-2.5 p-0">
            {dia.exercises.map((e, j) => (
              <ExerciseRow
                key={`${diaActual}-${j}`}
                exercise={e}
                abierta={abierta === j}
                onAlternar={() => setAbierta((a) => (a === j ? null : j))}
                cambio={cambioPorClave.get(claveEjercicio(e.name))}
                onCambiar={() => setCambiando(e.name)}
              />
            ))}
          </ol>
          <p>
            <small className="text-muted-foreground">Los pesos son orientativos. La app no da consejo médico.</small>
          </p>
        </section>
      ) : pestana === "cambios" && conBase ? (
        <section role="tabpanel" aria-label="Cambios">
          <ListaCambios cambios={conBase} tipos={tipos} />
        </section>
      ) : (
        <section role="tabpanel" aria-label="Avisos" className="grid gap-2.5">
          {totalAvisos === 0 && <p className="text-muted-foreground">No hay avisos para esta semana.</p>}
          {summary && (
            <Aviso Icono={Sparkles} destacado>
              <span className="font-medium">Resumen de la IA</span>
              <span className="block text-sm text-muted-foreground">{summary}</span>
            </Aviso>
          )}
          {propuesta.warnings.map((w, i) => (
            <Aviso key={`w${i}`} Icono={TriangleAlert}>
              {w.message}
            </Aviso>
          ))}
          {notices.map((n, i) => (
            <Aviso key={`n${i}`} Icono={MessageSquare}>
              <span className="text-muted-foreground">Nota de la IA: </span>
              {n}
            </Aviso>
          ))}
        </section>
      )}
      {cambiando && (
        <CambiarEjercicio
          key={cambiando}
          propuestaId={id}
          nombre={cambiando}
          veces={days.flatMap((d) => d.exercises).filter((x) => x.name === cambiando).length}
          onCerrar={() => setCambiando(null)}
          onCambiado={(nueva) => {
            setPropuesta(nueva);
            setCambiando(null);
            setAbierta(null);
            cargarCambios();
          }}
        />
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Aceptar y Descartar fijos abajo, apoyados sobre la barra de navegación (su alto más su borde). */}
      <div className="fixed inset-x-0 bottom-[calc(var(--alto-barra)+1px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-card">
        <div className="mx-auto flex max-w-xl gap-3 px-4 py-3">
          <Button
            variant="outline"
            size="xl"
            className="flex-1"
            type="button"
            onClick={() => resolver("discard")}
            disabled={trabajando}
          >
            Descartar
          </Button>
          <Button
            size="xl"
            className="flex-[1.4]"
            type="button"
            onClick={() => resolver("accept")}
            disabled={trabajando}
          >
            Aceptar
          </Button>
        </div>
      </div>
      </div>
    </main>
  );
}

// Un aviso de la pestaña Avisos, con su ícono. El resumen de la IA va destacado en amarillo.
function Aviso({
  Icono,
  destacado = false,
  children,
}: {
  Icono: typeof Sparkles;
  destacado?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-2xl border-2 bg-card p-4",
        destacado ? "border-disco-amarillo" : "border-transparent",
      )}
    >
      <Icono className="mt-0.5 size-5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
