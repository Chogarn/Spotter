"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { readError, type Proposal, apiFetch } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { ExerciseRow } from "@/components/ExerciseRow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";

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

  return (
    <main style={contenedor}>
      <BackButton href="/">← Volver</BackButton>
      <p className="mb-0 text-sm text-muted-foreground">Propuesta de la IA</p>
      <h1 className="mt-0">
        {days.length} días · ~{Math.round(propuesta.day_minutes.reduce((a, b) => a + b, 0) / days.length)} min
      </h1>
      <p className="text-muted-foreground">La IA propone, vos decidís: nada se guarda hasta que aceptes.</p>

      {summary && (
        <section className="my-4 rounded-2xl border-2 border-disco-amarillo bg-card p-4">
          <h2 className="mt-0 text-lg">Resumen de la semana anterior</h2>
          <p className="mb-0">{summary}</p>
        </section>
      )}
      {propuesta.warnings.length > 0 && (
        <Alert className="my-3">
          <AlertTitle>Avisos</AlertTitle>
          <AlertDescription>
            <ul>
              {propuesta.warnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}
      {notices.length > 0 && (
        <Alert className="my-3">
          <AlertTitle>Notas de la IA</AlertTitle>
          <AlertDescription>
            <ul>
              {notices.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {days.map((dia, i) => (
        <section key={i} className="mt-6">
          <h2 className="mb-0 text-3xl">Día {i + 1}</h2>
          <p className="mt-0 text-muted-foreground">
            {dia.title} · ~{propuesta.day_minutes[i]} min
          </p>
          {dia.mobility_notes && <p className="text-sm">Movilidad: {dia.mobility_notes}</p>}
          <ol className="m-0 grid gap-3 p-0">
            {dia.exercises.map((e, j) => (
              <ExerciseRow key={j} exercise={e} />
            ))}
          </ol>
        </section>
      ))}

      <p>
        <small className="text-muted-foreground">Los pesos son orientativos. La app no da consejo médico.</small>
      </p>
      <div className="mt-4 flex gap-3">
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
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </main>
  );
}
