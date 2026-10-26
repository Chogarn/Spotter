"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { CampoContrasena } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { apiFetch, readError } from "@/lib/api";

// Borrar la cuenta: una fila de la tarjeta de Cuenta que abre un recuadro. Pide la contraseña (así
// nadie con el aparato desbloqueado la borra) y el servidor borra todo al instante, sin vuelta atrás.
export function BorrarCuenta() {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  function cerrar() {
    if (enviando) return;
    setAbierto(false);
    setContrasena("");
    setError("");
  }

  async function borrar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const res = await apiFetch(`/auth/account`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: contrasena }),
      });
      if (res.ok) {
        router.push("/bienvenida");
        return;
      }
      setError(await readError(res));
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setEnviando(false);
  }

  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl text-left text-destructive outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>Borrar cuenta</span>
      </button>

      <AlertDialog open={abierto} onOpenChange={(a) => !a && cerrar()}>
        <AlertDialogContent>
          <form onSubmit={borrar}>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Borrar tu cuenta?</AlertDialogTitle>
              <AlertDialogDescription>
                Se borran tu perfil, tus rutinas y todo tu progreso. No se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="mt-4">
              <CampoContrasena
                id="contrasena-borrar"
                etiqueta="Tu contraseña, para confirmar"
                autoComplete="current-password"
                required
                value={contrasena}
                onChange={(e) => setContrasena(e.target.value)}
              />
              {error && <ErrorMessage>{error}</ErrorMessage>}
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel type="button" disabled={enviando}>
                Cancelar
              </AlertDialogCancel>
              <Button
                type="submit"
                className="bg-destructive text-white hover:bg-destructive/85"
                disabled={enviando || contrasena === ""}
              >
                {enviando ? "Borrando..." : "Borrar mi cuenta"}
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
