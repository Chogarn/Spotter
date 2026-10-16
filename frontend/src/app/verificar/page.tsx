"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PantallaAcceso } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { API, readError } from "@/lib/api";
import { useTokenDeLaDireccion } from "@/lib/token";

// Los códigos que esta pestaña ya mandó. El código sirve una sola vez: el modo de desarrollo corre
// los efectos dos veces y la segunda llamada fallaría aunque la cuenta ya se haya creado.
const yaMandados = new Set<string>();

// Verificar el correo (decisión 81): el enlace del correo abre esta pantalla pública con el código en
// la dirección. Al abrirse confirma el correo: recién ahí se crea la cuenta y queda la sesión
// iniciada. Una cuenta nueva sigue con sus datos personales (/perfil).
export default function VerificarPage() {
  const token = useTokenDeLaDireccion();
  const router = useRouter();
  const [fallo, setFallo] = useState("");

  useEffect(() => {
    if (!token || yaMandados.has(token)) return;
    yaMandados.add(token);
    fetch(`${API}/auth/verify`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) return router.replace("/perfil");
        const motivo = await readError(res);
        // Si el enlace ya se usó pero la sesión está abierta (tocaron el enlace dos veces), se sigue.
        const sesion = await fetch(`${API}/auth/me`, { credentials: "include" });
        if (sesion.ok) router.replace("/perfil");
        else setFallo(motivo);
      })
      .catch(() => setFallo("No se pudo conectar con el servidor"));
  }, [token, router]);

  const error = token === "" ? "El enlace no es válido o venció" : fallo;

  return (
    <PantallaAcceso
      titulo={error ? "No se pudo confirmar" : "Confirmando tu correo"}
      bajada={error ? "Pedí un enlace nuevo." : "Un momento..."}
      disco="azul"
    >
      {error && (
        <>
          <ErrorMessage>{error}</ErrorMessage>
          <Button size="xl" className="mt-2 w-full" nativeButton={false} render={<Link href="/registro" />}>
            Volver a registrarme
          </Button>
        </>
      )}
    </PantallaAcceso>
  );
}
