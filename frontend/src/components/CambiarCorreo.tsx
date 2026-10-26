"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { CampoAcceso, CampoContrasena } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { apiFetch, readError } from "@/lib/api";
import { cn } from "cn";

// Cambiar el correo: una fila de la tarjeta de Cuenta que se abre con dos campos (el correo nuevo y
// la contraseña). El servidor manda un enlace al correo NUEVO; la cuenta sigue con el viejo hasta que
// se toque. Al confirmarlo se cierran todas las sesiones y se entra con el correo nuevo.
export function CambiarCorreo() {
  const [abierto, setAbierto] = useState(false);
  const [nuevo, setNuevo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState("");

  function cerrar() {
    setAbierto(false);
    setNuevo("");
    setContrasena("");
    setError("");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setEnviando(true);
    try {
      const res = await apiFetch(`/auth/change-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_email: nuevo, password: contrasena }),
      });
      if (res.ok) {
        const destino = nuevo.trim().toLowerCase();
        cerrar();
        setAviso(`Te mandamos un enlace a ${destino}. Tu correo cambia cuando lo toques. Mirá también en spam.`);
      } else {
        setError(await readError(res));
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setEnviando(false);
  }

  return (
    <div className="border-t border-border first:border-t-0">
      <button
        type="button"
        onClick={() => {
          setAviso("");
          if (abierto) cerrar();
          else setAbierto(true);
        }}
        aria-expanded={abierto}
        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>Cambiar correo</span>
        <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground transition-transform", abierto && "rotate-180")} />
      </button>

      {aviso && (
        <p role="status" className="mx-0 mt-1 mb-2 rounded-xl bg-disco-verde/15 px-3 py-2 text-sm">
          {aviso}
        </p>
      )}

      {abierto && (
        <form onSubmit={enviar} className="pt-2 pb-3">
          <CampoAcceso
            id="correo-nuevo"
            etiqueta="Correo nuevo"
            type="email"
            autoComplete="email"
            placeholder="vos@correo.com"
            required
            value={nuevo}
            onChange={(e) => setNuevo(e.target.value)}
          />
          <CampoContrasena
            id="contrasena-cambiar-correo"
            etiqueta="Tu contraseña"
            autoComplete="current-password"
            required
            value={contrasena}
            onChange={(e) => setContrasena(e.target.value)}
          />
          <p className="-mt-2 mb-4 text-xs text-muted-foreground">
            Al confirmar el correo nuevo se cierran tus sesiones y entrás con él.
          </p>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <div className="grid grid-cols-[1fr_1.4fr] gap-2">
            <Button type="button" variant="outline" size="xl" onClick={cerrar} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" size="xl" disabled={enviando}>
              {enviando ? "Enviando..." : "Enviar enlace"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
