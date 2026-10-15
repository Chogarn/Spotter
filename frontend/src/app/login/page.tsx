"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { CampoAcceso, CampoContrasena, PantallaAcceso } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { API, readError } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  // `navegando` se apaga solo cuando la página nueva está lista (no dejar estados activos tras push).
  const [navegando, startTransition] = useTransition();

  // Si ya hay una sesión válida, no tiene sentido ver el login. Va con fetch directo, no con
  // apiFetch: un 401 acá es lo normal y no debe redirigir a /login otra vez.
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (res.ok) startTransition(() => router.replace("/"));
      })
      .catch(() => {});
  }, [router]);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        startTransition(() => router.push("/"));
      } else {
        setError(await readError(res));
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setEnviando(false);
  }

  const ocupado = enviando || navegando;

  return (
    <PantallaAcceso titulo="Hola de nuevo" bajada="Entrá para seguir tu semana." disco="rojo">
      <form onSubmit={entrar}>
        <CampoAcceso
          id="email"
          etiqueta="Email"
          type="email"
          autoComplete="email"
          placeholder="vos@correo.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <CampoContrasena
          id="password"
          etiqueta="Contraseña"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" size="xl" className="mt-2 w-full" disabled={ocupado}>
          {ocupado ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="mt-5 text-center text-muted-foreground">
        ¿No tenés cuenta? <Link href="/registro" className="font-medium text-foreground">Creala</Link>
      </p>
    </PantallaAcceso>
  );
}
