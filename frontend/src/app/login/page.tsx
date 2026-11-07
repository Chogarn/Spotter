"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CampoAcceso, CampoContrasena, PantallaAcceso } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { API, readError } from "@/lib/api";

// Al iniciar sesión se va a la portada con una carga COMPLETA de la página, no con router.push: Next
// guarda en el navegador la versión de "/" que vio sin sesión (la bienvenida) y, al navegar por
// dentro, la reutiliza sin preguntarle al servidor. Pasó en producción (Vercel, 2026-11-07).
function irAInicio() {
  window.location.replace("/");
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  // "Recordarme": con la casilla tildada la sesión dura 30 días y no hay que volver a escribir la
  // contraseña; sin tildar se cierra al cerrar el navegador. Viene tildada: la app se abre a diario.
  const [recordar, setRecordar] = useState(true);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  // Si ya hay una sesión válida, no tiene sentido ver el login. Va con fetch directo, no con
  // apiFetch: un 401 acá es lo normal y no debe redirigir a /login otra vez.
  useEffect(() => {
    fetch(`${API}/auth/me`, { credentials: "include" })
      .then((res) => {
        if (res.ok) irAInicio();
      })
      .catch(() => {});
  }, []);

  async function entrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const res = await fetch(`${API}/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, remember: recordar }),
      });
      if (res.ok) {
        irAInicio();
        return; // la página se recarga entera: el botón queda ocupado hasta entonces
      } else {
        setError(await readError(res));
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setEnviando(false);
  }

  const ocupado = enviando;

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
        <div className="mb-4 flex items-center gap-3">
          <Checkbox id="recordarme" checked={recordar} onCheckedChange={(v) => setRecordar(v === true)} />
          <Label htmlFor="recordarme" className="font-normal">
            Recordarme en este aparato
          </Label>
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" size="xl" className="mt-2 w-full" disabled={ocupado}>
          {ocupado ? "Entrando..." : "Entrar"}
        </Button>
      </form>
      <p className="mt-4 text-center">
        <Link href="/recuperar" className="font-medium text-foreground">¿Olvidaste tu contraseña?</Link>
      </p>
      <p className="mt-5 text-center text-muted-foreground">
        ¿No tenés cuenta? <Link href="/registro" className="font-medium text-foreground">Creala</Link>
      </p>
    </PantallaAcceso>
  );
}
