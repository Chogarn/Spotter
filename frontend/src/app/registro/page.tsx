"use client";

import Link from "next/link";
import { useState } from "react";

import { CampoAcceso, CampoContrasena, PantallaAcceso } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { API, errorText, readError } from "@/lib/api";

export default function RegistroPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  // Después de pedir el registro: la cuenta todavía no existe, falta confirmar el correo (decisión 81).
  const [pendiente, setPendiente] = useState(false);
  const [aviso, setAviso] = useState("");

  async function registrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const res = await fetch(`${API}/auth/register`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (res.ok) {
        setPendiente(true);
      } else {
        setError(errorText((await res.json()).detail));
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setEnviando(false);
  }

  const ocupado = enviando;

  async function reenviar() {
    setAviso("");
    setError("");
    setEnviando(true);
    try {
      const res = await fetch(`${API}/auth/resend-verification`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setAviso("Listo, te lo mandamos de nuevo.");
      else setError(await readError(res));
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setEnviando(false);
  }

  if (pendiente) {
    return (
      <PantallaAcceso titulo="Revisá tu correo" bajada="Falta confirmar tu correo para crear la cuenta." disco="azul">
        <p role="status" className="rounded-xl bg-disco-verde/15 px-4 py-3">
          Te mandamos un enlace a <b>{email}</b>. Tocalo para crear tu cuenta: vale 24 horas. Mirá también en
          la carpeta de spam.
        </p>
        {aviso && <p role="status" className="mt-3 mb-0 text-sm">{aviso}</p>}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="button" variant="outline" size="xl" className="mt-4 w-full" onClick={reenviar} disabled={ocupado}>
          {ocupado ? "Enviando..." : "Reenviar el enlace"}
        </Button>
        <p className="mt-5 text-center text-muted-foreground">
          ¿Ya confirmaste? <Link href="/login" className="font-medium text-foreground">Entrá</Link>
        </p>
      </PantallaAcceso>
    );
  }

  return (
    <PantallaAcceso titulo="Empezá hoy" bajada="Tres datos y la IA arma tu primera semana." disco="azul">
      <form onSubmit={registrar}>
        <CampoAcceso
          id="name"
          etiqueta="Nombre"
          autoComplete="name"
          placeholder="Cómo querés que te llame"
          required
          maxLength={100}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
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
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
          required
          minLength={8}
          maxLength={128}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button type="submit" size="xl" className="mt-2 w-full" disabled={ocupado}>
          {ocupado ? "Creando..." : "Crear cuenta"}
        </Button>
      </form>
      <p className="mt-5 text-center text-muted-foreground">
        ¿Ya tenés cuenta? <Link href="/login" className="font-medium text-foreground">Entrá</Link>
      </p>
    </PantallaAcceso>
  );
}
