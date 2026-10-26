"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { PantallaAcceso } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { API, readError } from "@/lib/api";
import { useTokenDeLaDireccion } from "@/lib/token";

// Los códigos que esta pestaña ya mandó. El código sirve una sola vez: el modo de desarrollo corre
// los efectos dos veces y la segunda llamada fallaría aunque el correo ya se haya cambiado.
const yaMandados = new Set<string>();

// Confirmar el correo nuevo: el enlace del correo abre esta pantalla pública con el código en la
// dirección. Al abrirse cambia el correo de la cuenta y cierra todas las sesiones, así que no queda
// ninguna abierta: se entra de nuevo con el correo nuevo.
export default function ConfirmarCorreoPage() {
  const token = useTokenDeLaDireccion();
  const [listo, setListo] = useState(false);
  const [fallo, setFallo] = useState("");

  useEffect(() => {
    if (!token || yaMandados.has(token)) return;
    yaMandados.add(token);
    fetch(`${API}/auth/confirm-email-change`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) setListo(true);
        else setFallo(await readError(res));
      })
      .catch(() => setFallo("No se pudo conectar con el servidor"));
  }, [token]);

  const error = token === "" ? "El enlace no es válido o venció" : fallo;

  if (listo) {
    return (
      <PantallaAcceso titulo="Correo cambiado" bajada="Entrá con tu correo nuevo." disco="azul">
        <p role="status" className="rounded-xl bg-disco-verde/15 px-4 py-3">
          Listo, confirmaste tu correo nuevo. Por seguridad se cerraron tus sesiones.
        </p>
        <Button size="xl" className="mt-4 w-full" nativeButton={false} render={<Link href="/login" />}>
          Iniciar sesión
        </Button>
      </PantallaAcceso>
    );
  }

  return (
    <PantallaAcceso
      titulo={error ? "No se pudo confirmar" : "Confirmando tu correo"}
      bajada={error ? "Pedí el cambio de nuevo desde tu perfil." : "Un momento..."}
      disco="azul"
    >
      {error && (
        <>
          <ErrorMessage>{error}</ErrorMessage>
          <Button size="xl" className="mt-2 w-full" nativeButton={false} render={<Link href="/login" />}>
            Ir a iniciar sesión
          </Button>
        </>
      )}
    </PantallaAcceso>
  );
}
