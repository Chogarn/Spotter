"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { GenerarRutina } from "@/components/GenerarRutina";
import { API, readError } from "@/lib/api";

export default function Home() {
  const [cargando, setCargando] = useState(true);
  // Con una semana activa no se ofrece generar otra rutina.
  const [hayActiva, setHayActiva] = useState(false);
  const [error, setError] = useState("");

  // Subir `recarga` vuelve a pedir la semana activa.
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    fetch(`${API}/weeks/active`)
      .then(async (res) => {
        if (res.ok) setHayActiva(true);
        else if (res.status === 404) setHayActiva(false); // la semana pudo haberse cerrado
        else setError(await readError(res));
      })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setCargando(false));
  }, [recarga]);

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
        <Link href="/rutinas">
          <button type="button">Mis rutinas</button>
        </Link>{" "}
        {!cargando && !hayActiva && (
          <GenerarRutina etiqueta="Generar rutina" onConflict={() => setRecarga((n) => n + 1)} />
        )}
      </p>

      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </main>
  );
}
