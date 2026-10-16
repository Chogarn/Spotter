"use client";

import Link from "next/link";
import { useState } from "react";

import { CampoAcceso, PantallaAcceso } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { API, readError } from "@/lib/api";

// Recuperar la cuenta (decisión 81): se pide el correo y, si tiene una cuenta, se manda un enlace
// para elegir una contraseña nueva. La respuesta es siempre la misma: no dice si el correo existe.
export default function RecuperarPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setMensaje((await res.json()).message);
      else setError(await readError(res));
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setEnviando(false);
  }

  if (mensaje) {
    return (
      <PantallaAcceso titulo="Revisá tu correo" bajada="El enlace vale 1 hora." disco="rojo">
        <p role="status" className="rounded-xl bg-disco-verde/15 px-4 py-3">
          {mensaje}
        </p>
        <p className="mt-5 text-center">
          <Link href="/login" className="font-medium text-foreground">Volver a iniciar sesión</Link>
        </p>
      </PantallaAcceso>
    );
  }

  return (
    <PantallaAcceso titulo="Recuperar cuenta" bajada="Te mandamos un enlace por correo." disco="rojo">
      <form onSubmit={enviar}>
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
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" size="xl" className="mt-2 w-full" disabled={enviando}>
          {enviando ? "Enviando..." : "Enviar enlace"}
        </Button>
      </form>
      <p className="mt-5 text-center">
        <Link href="/login" className="font-medium text-foreground">Volver a iniciar sesión</Link>
      </p>
    </PantallaAcceso>
  );
}
