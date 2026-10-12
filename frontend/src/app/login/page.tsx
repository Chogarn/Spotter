"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1>Iniciar sesión</h1>
      <form onSubmit={entrar}>
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
          <Label htmlFor="password">Contraseña</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <div className="mt-4">
          <Button type="submit" disabled={ocupado}>
            {ocupado ? "Entrando..." : "Entrar"}
          </Button>
        </div>
      </form>
      <p>
        ¿No tenés cuenta? <Link href="/registro">Registrate</Link>
      </p>
      <p>
        <Link href="/">Volver al inicio</Link>
      </p>
    </main>
  );
}
