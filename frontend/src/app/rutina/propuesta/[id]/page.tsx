"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { API, readError, type Proposal } from "@/lib/api";
import { BackButton } from "@/components/BackButton";
import { ExerciseRow } from "@/components/ExerciseRow";

export default function PropuestaPage({
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
        <p style={{ color: "crimson" }}>{error}</p>
        <Link href="/">
          <button type="button">Volver al inicio</button>
        </Link>
      </main>
    );
  }

  if (aceptada) {
    return (
      <main style={contenedor}>
        <p>Tu rutina quedó activa: {propuesta.routine.days.length} días.</p>
        <Link href="/rutinas">
          <button type="button">Ver mis rutinas</button>
        </Link>{" "}
        <Link href="/">
          <button type="button">Volver al inicio</button>
        </Link>
      </main>
    );
  }

  if (propuesta.status !== "pending") {
    return (
      <main style={contenedor}>
        <p>Esta propuesta ya fue resuelta.</p>
        <Link href="/">
          <button type="button">Volver al inicio</button>
        </Link>
      </main>
    );
  }

  const { days, notices } = propuesta.routine;

  return (
    <main style={contenedor}>
      <BackButton href="/">← Volver</BackButton>
      <h1>Tu rutina propuesta</h1>
      <p>La IA propone, vos decidís: nada se guarda hasta que aceptes.</p>

      {propuesta.warnings.length > 0 && (
        <>
          <h2>Avisos</h2>
          <ul>
            {propuesta.warnings.map((w, i) => (
              <li key={i}>{w.message}</li>
            ))}
          </ul>
        </>
      )}
      {notices.length > 0 && (
        <>
          <h2>Notas de la IA</h2>
          <ul>
            {notices.map((n, i) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        </>
      )}

      {days.map((dia, i) => (
        <section key={i}>
          <h2>
            Día {i + 1} · {dia.title}{" "}
            <small style={{ fontWeight: "normal" }}>~{propuesta.day_minutes[i]} min</small>
          </h2>
          {dia.mobility_notes && <p>Movilidad: {dia.mobility_notes}</p>}
          <ol>
            {dia.exercises.map((e, j) => (
              <ExerciseRow key={j} exercise={e} />
            ))}
          </ol>
        </section>
      ))}

      <p>
        <small>Los pesos son orientativos. La app no da consejo médico.</small>
      </p>
      <p>
        <button type="button" onClick={() => resolver("accept")} disabled={trabajando}>
          Aceptar rutina
        </button>{" "}
        <button type="button" onClick={() => resolver("discard")} disabled={trabajando}>
          Descartar
        </button>
      </p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}
