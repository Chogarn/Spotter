"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1>Crear cuenta</h1>
      <form onSubmit={registrar}>
        <div className="mb-3 grid gap-1.5">
          <Label htmlFor="name">Nombre</Label>
          <Input
            id="name"
            autoComplete="name"
            required
            maxLength={100}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="mb-3 grid gap-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="mb-4 grid gap-1.5">
          <Label htmlFor="password">Contraseña (mínimo 8 caracteres)</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="mt-4">
          <Button type="submit" disabled={ocupado}>
            {ocupado ? "Creando..." : "Crear cuenta"}
          </Button>
        </div>
      </form>
      <p>
        ¿Ya tenés cuenta? <Link href="/login">Iniciá sesión</Link>
      </p>
    </main>
  );
}
