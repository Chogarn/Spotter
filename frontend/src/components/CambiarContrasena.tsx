"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { CampoContrasena } from "@/components/Acceso";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { readError, apiFetch } from "@/lib/api";
import { cn } from "cn";

// Cambiar la contraseña (decisión 80): una fila de la tarjeta de Cuenta que se abre con tres campos
// (la actual, la nueva y la nueva repetida). El servidor pide la actual y cierra las sesiones de los
// demás aparatos; esta sigue abierta. Las reglas de la nueva son las del registro: de 8 a 128.
export function CambiarContrasena() {
  const [abierto, setAbierto] = useState(false);
  const [actual, setActual] = useState("");
  const [nueva, setNueva] = useState("");
  const [repetida, setRepetida] = useState("");
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  function cerrar() {
    setAbierto(false);
    setActual("");
    setNueva("");
    setRepetida("");
    setError("");
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (nueva.length < 8) return setError("La contraseña nueva tiene que tener al menos 8 caracteres.");
    if (nueva !== repetida) return setError("Las contraseñas nuevas no coinciden.");
    setEnviando(true);
    try {
      const res = await apiFetch(`/auth/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: actual, new_password: nueva }),
      });
      if (res.ok) {
        cerrar();
        setListo(true);
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
          setListo(false);
          if (abierto) cerrar();
          else setAbierto(true);
        }}
        aria-expanded={abierto}
        className="flex min-h-12 w-full items-center justify-between gap-2 rounded-xl text-left outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span>Cambiar contraseña</span>
        <ChevronDown aria-hidden="true" className={cn("size-4 shrink-0 text-muted-foreground transition-transform", abierto && "rotate-180")} />
      </button>

      {listo && (
        <p role="status" className="mx-0 mt-1 mb-2 rounded-xl bg-disco-verde/15 px-3 py-2 text-sm">
          Listo, cambiaste tu contraseña. Las sesiones abiertas en otros aparatos se cerraron.
        </p>
      )}

      {abierto && (
        <form onSubmit={enviar} className="pt-2 pb-3">
          <CampoContrasena
            id="contrasena-actual"
            etiqueta="Contraseña actual"
            autoComplete="current-password"
            required
            value={actual}
            onChange={(e) => setActual(e.target.value)}
          />
          <CampoContrasena
            id="contrasena-nueva"
            etiqueta="Contraseña nueva"
            autoComplete="new-password"
            required
            minLength={8}
            maxLength={128}
            value={nueva}
            onChange={(e) => setNueva(e.target.value)}
          />
          <p className="-mt-2 mb-4 text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
          <CampoContrasena
            id="contrasena-repetida"
            etiqueta="Repetí la contraseña nueva"
            autoComplete="new-password"
            required
            value={repetida}
            onChange={(e) => setRepetida(e.target.value)}
          />
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <div className="grid grid-cols-[1fr_1.4fr] gap-2">
            <Button type="button" variant="outline" size="xl" onClick={cerrar} disabled={enviando}>
              Cancelar
            </Button>
            <Button type="submit" size="xl" disabled={enviando}>
              {enviando ? "Guardando..." : "Cambiar contraseña"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
