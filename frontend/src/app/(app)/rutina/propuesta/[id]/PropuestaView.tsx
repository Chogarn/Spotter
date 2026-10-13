"use client";

import { MessageSquare, Sparkles, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { readError, type Proposal, apiFetch } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { ExerciseRow } from "@/components/ExerciseRow";
import { Flecha } from "@/components/Flecha";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { cn } from "cn";

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
  const [pestana, setPestana] = useState<"semana" | "avisos">("semana");
  // El día a la vista (uno por vez) y la tarjeta desplegada de ese día.
  const [diaActual, setDiaActual] = useState(0);
  const [abierta, setAbierta] = useState<number | null>(null);

  useEffect(() => {
    apiFetch(`/proposals/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setPropuesta(await res.json());
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, [id]);

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

  if (cargando) return <main style={contenedor}>Cargando...</main>;

  if (!propuesta) {
    return (
      <main style={contenedor}>
        <ErrorMessage>{error}</ErrorMessage>
        <Button variant="outline" nativeButton={false} render={<Link href="/entrenar" />}>Ir a Entrenar</Button>
      </main>
    );
  }

  if (aceptada) {
    return (
      <main style={contenedor}>
        <p>Tu rutina quedó activa: {propuesta.routine.days.length} días.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/rutinas" />}>Ver mis rutinas</Button>{" "}
        <Button variant="outline" nativeButton={false} render={<Link href="/entrenar" />}>Ir a Entrenar</Button>
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

  function irADia(i: number) {
    setDiaActual(i);
    setAbierta(null);
  }

  return (
    <main style={contenedor}>
      <BackButton href="/">← Volver</BackButton>
      <p className="mb-0 text-sm text-muted-foreground">Propuesta de la IA</p>
      <h1 className="mt-0 mb-1">
        {days.length} días · ~{Math.round(propuesta.day_minutes.reduce((a, b) => a + b, 0) / days.length)} min
      </h1>
      <p className="mt-0 text-sm text-muted-foreground">La IA propone, vos decidís: nada se guarda hasta que aceptes.</p>

      {/* Dos pestañas: la semana día por día y los avisos (resumen, avisos del código y notas). */}
      <div role="tablist" aria-label="Propuesta" className="my-3 flex rounded-full bg-muted p-1">
        {(["semana", "avisos"] as const).map((p) => (
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
            {p === "semana" ? "Semana" : `Avisos (${totalAvisos})`}
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
              nombre={days[diaActual - 1]?.title}
              onClick={() => irADia(diaActual - 1)}
            />
            {days.map((d, i) => (
              <button
                key={i}
                type="button"
                onClick={() => irADia(i)}
                aria-label={`Día ${i + 1}: ${d.title}`}
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
              nombre={days[diaActual + 1]?.title}
              onClick={() => irADia(diaActual + 1)}
            />
          </div>
          <h2 className="mt-3 mb-0 text-4xl">Día {diaActual + 1}</h2>
          <p className="mt-0 text-muted-foreground">
            {dia.title} · ~{propuesta.day_minutes[diaActual]} min
          </p>
          {dia.mobility_notes && <p className="text-sm">Movilidad: {dia.mobility_notes}</p>}
          <ol className="m-0 grid list-none gap-2.5 p-0">
            {dia.exercises.map((e, j) => (
              <ExerciseRow
                key={`${diaActual}-${j}`}
                exercise={e}
                abierta={abierta === j}
                onAlternar={() => setAbierta((a) => (a === j ? null : j))}
              />
            ))}
          </ol>
          <p>
            <small className="text-muted-foreground">Los pesos son orientativos. La app no da consejo médico.</small>
          </p>
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
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Aceptar y Descartar fijos abajo, apoyados sobre la barra de navegación (su alto más su borde). */}
      <div className="fixed inset-x-0 bottom-[calc(var(--alto-barra)+1px+env(safe-area-inset-bottom))] z-30 border-t border-border bg-card">
        <div className="mx-auto flex max-w-xl gap-3 px-4 py-3">
          <Button
            variant="outline"
            size="lg"
            className="h-11 flex-1 text-base"
            type="button"
            onClick={() => resolver("discard")}
            disabled={trabajando}
          >
            Descartar
          </Button>
          <Button
            size="lg"
            className="h-11 flex-[1.4] text-base"
            type="button"
            onClick={() => resolver("accept")}
            disabled={trabajando}
          >
            Aceptar
          </Button>
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
