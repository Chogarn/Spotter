"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GenerarRutina } from "@/components/GenerarRutina";
import { readError, apiFetch, type SessionUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";

export default function Home() {
  const router = useRouter();
  const [cargando, setCargando] = useState(true);
  // Con una semana activa no se ofrece generar otra rutina.
  const [hayActiva, setHayActiva] = useState(false);
  // Id de la propuesta que quedó pendiente (se puede volver a ver), si hay una.
  const [pendiente, setPendiente] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState<SessionUser | null>(null);

  // Subir `recarga` vuelve a pedir la semana activa.
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    apiFetch(`/auth/me`)
      .then(async (res) => {
        if (res.ok) setUsuario(await res.json());
      })
      .catch(() => {});
  }, []);

  async function cerrarSesion() {
    await apiFetch(`/auth/logout`, { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  useEffect(() => {
    apiFetch(`/weeks/active`)
      .then(async (res) => {
        if (res.ok) setHayActiva(true);
        else if (res.status === 404) setHayActiva(false); // la semana pudo haberse cerrado
        else setError(await readError(res));
      })
      .catch(() => setError("No se pudo conectar con el servidor"))
      .finally(() => setCargando(false));
  }, [recarga]);

  useEffect(() => {
    apiFetch(`/proposals/pending`)
      .then(async (res) => {
        if (res.ok) setPendiente((await res.json()).id);
        else if (res.status === 404) setPendiente(null);
        else setError(await readError(res));
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [recarga]);

  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1>Spotter</h1>
      <p>
        Entrenador de gimnasio con IA que arma tu semana según tu progreso real.
      </p>
      {usuario && (
        <p>
          <small>
            Sesión iniciada: {usuario.name} ({usuario.email}){" "}
            <Button variant="outline" size="xs" type="button" onClick={cerrarSesion}>
              Cerrar sesión
            </Button>
          </small>
        </p>
      )}
      <div>
        <Button nativeButton={false} render={<Link href="/perfil" />}>Perfil</Button>{" "}
        <Button nativeButton={false} render={<Link href="/rutinas" />}>Mis rutinas</Button>{" "}
        {!cargando && !hayActiva && pendiente !== null && (
          <>
            <Button nativeButton={false} render={<Link href={`/rutina/propuesta/${pendiente}`} />}>
              Ver propuesta pendiente
            </Button>{" "}
          </>
        )}
        {!cargando && !hayActiva && (
          <GenerarRutina etiqueta="Generar rutina" onConflict={() => setRecarga((n) => n + 1)} />
        )}
      </div>

      {error && <ErrorMessage>{error}</ErrorMessage>}
    </main>
  );
}
