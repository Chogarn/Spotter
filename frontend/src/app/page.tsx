"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { API, readError, type Week } from "@/lib/api";

export default function Home() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  const [semana, setSemana] = useState<Week | null>(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");

  // Subir `recarga` vuelve a pedir la semana activa.
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    fetch(`${API}/weeks/active`)
      .then(async (res) => {
        if (res.ok) setSemana(await res.json());
        else if (res.status !== 404) setError(await readError(res));
      })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setCargando(false));
  }, [recarga]);

  async function generar() {
    setError("");
    setGenerando(true);
    try {
      const res = await fetch(`${API}/proposals/generate`, { method: "POST" });
      if (res.ok) {
        const propuesta = await res.json();
        router.push(`/rutina/propuesta/${propuesta.id}`);
        return; // sigue "generando" hasta que cambia la página
      }
      setError(await readError(res));
      if (res.status === 409) setRecarga((n) => n + 1); // quizás ya tenía una semana activa
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setGenerando(false);
  }

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1>Spotter</h1>
      <p>
        Entrenador de gimnasio con IA que arma tu semana según tu progreso real.
      </p>
      <p>
        <Link href="/perfil">
          <button type="button">Perfil</button>
        </Link>{" "}
        {!cargando && !semana && (
          <button type="button" onClick={generar} disabled={generando}>
            {generando ? "Generando..." : "Generar rutina"}
          </button>
        )}
      </p>

      {generando && (
        <p>
          Tu rutina se está generando. Puede tardar hasta 2 minutos.
          <br />
          No cierres esta página.
        </p>
      )}
      {error && <p style={{ color: "crimson" }}>{error}</p>}

      {semana && (
        <>
          <h2>Tu semana</h2>
          <ul>
            {semana.days.map((d) => (
              <li key={d.day_index}>
                Día {d.day_index} · {d.title}
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
