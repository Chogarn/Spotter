"use client";

import Link from "next/link";
import { useState } from "react";

import { CampoContrasena, PantallaAcceso } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { API, readError } from "@/lib/api";
import { useTokenDeLaDireccion } from "@/lib/token";

// Elegir la contraseña nueva (decisión 81): el enlace del correo abre esta pantalla pública con el
// código en la dirección. Al guardar NO inicia sesión: se entra con la contraseña nueva, y las
// sesiones que hubiera abiertas se cierran.
export default function RestablecerPage() {
  const token = useTokenDeLaDireccion();
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [fallo, setFallo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  const error = token === "" ? "El enlace no es válido o venció" : fallo;

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setFallo("");
    if (nueva.length < 8) return setFallo("La contraseña tiene que tener al menos 8 caracteres.");
    if (nueva !== repetida) return setFallo("Las contraseñas no coinciden.");
    setEnviando(true);
    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, new_password: nueva }),
      });
      if (res.ok) setListo(true);
      else setFallo(await readError(res));
    } catch {
      setFallo("No se pudo conectar con el servidor");
    }
    setEnviando(false);
  }

  if (listo) {
    return (
      <PantallaAcceso titulo="Listo" bajada="Ya podés entrar con tu contraseña nueva." disco="rojo">
        <Button size="xl" className="w-full" nativeButton={false} render={<Link href="/login" />}>
          Iniciar sesión
        </Button>
      </PantallaAcceso>
    );
  }

  return (
    <PantallaAcceso titulo="Contraseña nueva" bajada="Elegí una que no uses en otro lado." disco="rojo">
      {token ? (
        <form onSubmit={guardar}>
          <CampoContrasena
            id="nueva"
            etiqueta="Contraseña nueva"
            autoComplete="new-password"
            placeholder="Mínimo 8 caracteres"
            required
            minLength={8}
            maxLength={128}
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
          <CampoContrasena
            id="repetida"
            etiqueta="Repetila"
            autoComplete="new-password"
            required
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <Button type="submit" size="xl" className="mt-2 w-full" disabled={enviando}>
            {enviando ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </form>
      ) : (
        error && <ErrorMessage>{error}</ErrorMessage>
      )}
      {error && (
        <p className="mt-5 text-center">
          <Link href="/recuperar" className="font-medium text-foreground">Pedir un enlace nuevo</Link>
        </p>
      )}
    </PantallaAcceso>
  );
}
