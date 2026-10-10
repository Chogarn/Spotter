"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { API, readError, type Proposal } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { ExerciseRow } from "@/components/ExerciseRow";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    fetch(`${API}/proposals/${id}`)
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
      const res = await fetch(`${API}/proposals/${id}/${accion}`, { method: "POST" });
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

  const contenedor = { maxWidth: 640, margin: "0 auto", padding: "2rem 1.5rem" };

  if (cargando) return <main style={contenedor}>Cargando...</main>;

  if (!propuesta) {
    return (
      <main style={contenedor}>
        <ErrorMessage>{error}</ErrorMessage>
        <Button nativeButton={false} render={<Link href="/" />}>Volver al inicio</Button>
      </main>
    );
  }

  if (aceptada) {
    return (
      <main style={contenedor}>
        <p>Tu rutina quedó activa: {propuesta.routine.days.length} días.</p>
        <Button nativeButton={false} render={<Link href="/rutinas" />}>Ver mis rutinas</Button>{" "}
        <Button nativeButton={false} render={<Link href="/" />}>Volver al inicio</Button>
      </main>
    );
  }

  if (propuesta.status !== "pending") {
    return (
      <main style={contenedor}>
        <p>Esta propuesta ya fue resuelta.</p>
        <Button nativeButton={false} render={<Link href="/" />}>Volver al inicio</Button>
      </main>
    );
  }

  const { days, notices, summary } = propuesta.routine;

  return (
    <main style={contenedor}>
      <BackButton href="/">← Volver</BackButton>
      <h1>Tu rutina propuesta</h1>
      <p>La IA propone, vos decidís: nada se guarda hasta que aceptes.</p>

      {summary && (
        <Alert className="my-3">
          <AlertTitle>Resumen de la semana anterior</AlertTitle>
          <AlertDescription>{summary}</AlertDescription>
        </Alert>
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

      <div className="grid gap-3">
        {days.map((dia, i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle>
                Día {i + 1} · {dia.title}
              </CardTitle>
              <CardDescription>~{propuesta.day_minutes[i]} min</CardDescription>
            </CardHeader>
            <CardContent>
              {dia.mobility_notes && <p>Movilidad: {dia.mobility_notes}</p>}
              <ol>
                {dia.exercises.map((e, j) => (
                  <ExerciseRow key={j} exercise={e} />
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>

      <p>
        <small>Los pesos son orientativos. La app no da consejo médico.</small>
      </p>
      <p>
        <Button type="button" onClick={() => resolver("accept")} disabled={trabajando}>
          Aceptar rutina
        </Button>{" "}
        <Button type="button" onClick={() => resolver("discard")} disabled={trabajando}>
          Descartar
        </Button>
      </p>
      {error && <ErrorMessage>{error}</ErrorMessage>}
    </main>
  );
}
