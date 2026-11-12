"use client";

import { useEffect, useState } from "react";

import { BorrarCuenta } from "@/components/BorrarCuenta";
import { CasillasLegales } from "@/components/Consentimiento";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Button } from "@/components/ui/button";
import { apiFetch, errorText } from "@/lib/api";

// Pantalla para aceptar el aviso legal, encima de todo, para las cuentas con perfil que no aceptaron
// la versión vigente (las que ya existían antes del aviso, o cuando el aviso cambia). Las dos
// casillas son obligatorias, como en el perfil nuevo; desde acá también se puede borrar la cuenta.
// Un usuario sin perfil no la ve: acepta en el último paso del asistente del perfil.
export function AceptarAviso() {
  const [pendiente, setPendiente] = useState(false);
  const [aviso, setAviso] = useState(false);
  const [salud, setSalud] = useState(false);
  const [error, setError] = useState("");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    apiFetch(`/profile`)
      .then(async (res) => {
        if (!res.ok) return; // 404: sin perfil todavía
        const p = await res.json();
        if (!p.legal_notice_accepted) {
          setPendiente(true);
          setSalud(Boolean(p.health_consent));
        }
      })
      .catch(() => {});
  }, []);

  async function aceptar() {
    setError("");
    setEnviando(true);
    try {
      const res = await apiFetch(`/profile/consent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accept_legal_notice: true, accept_health_consent: true }),
      });
      if (!res.ok) {
        setError(errorText((await res.json()).detail));
      } else {
        // Recarga completa: las pantallas de abajo vuelven a leer el perfil con lo aceptado.
        window.location.reload();
        return;
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setEnviando(false);
  }

  if (!pendiente) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="aceptar-aviso-titulo"
      className="fixed inset-0 z-[95] overflow-y-auto bg-background"
    >
      <div className="mx-auto flex min-h-full w-full max-w-md flex-col px-4 pt-10 pb-10">
        <h1 id="aceptar-aviso-titulo" className="mt-0 mb-2 text-4xl">Antes de seguir</h1>
        <p className="mt-0 mb-4 text-muted-foreground">
          Sumamos el aviso legal y la privacidad de Spotter. Para seguir usando la app, leelo y aceptá las dos casillas.
        </p>
        <CasillasLegales aviso={aviso} salud={salud} onAviso={setAviso} onSalud={setSalud} />
        {error && <ErrorMessage>{error}</ErrorMessage>}
        <Button
          type="button"
          size="xl"
          className="mt-5 w-full"
          disabled={!(aviso && salud) || enviando}
          onClick={aceptar}
        >
          {enviando ? "Guardando..." : "Aceptar y seguir"}
        </Button>
        <div className="mt-6 rounded-2xl bg-card px-4 py-1">
          <BorrarCuenta />
        </div>
      </div>
    </div>
  );
}
