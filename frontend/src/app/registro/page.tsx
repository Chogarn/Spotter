"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { CampoAcceso, CampoContrasena, PantallaAcceso } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { API, errorText } from "@/lib/api";

export default function RegistroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [navegando, startTransition] = useTransition();

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
        // Cuenta nueva: lo primero es completar los datos personales.
        startTransition(() => router.push("/perfil"));
      } else {
        setError(errorText((await res.json()).detail));
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setEnviando(false);
  }

  const ocupado = enviando || navegando;

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
