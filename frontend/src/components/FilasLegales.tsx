"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Confirmar } from "@/components/Confirmar";
import { ErrorMessage } from "@/components/ErrorMessage";
import { apiFetch, errorText } from "@/lib/api";
import { TEXTO_CONSENTIMIENTO_SALUD } from "@/lib/legal";

export type EstadoLegal = {
  avisoAceptadoEl: string | null;
  avisoVersion: string | null;
  saludConsentidaEl: string | null;
};

function fecha(iso: string | null): string {
  if (!iso) return "";
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// Perfil › Cuenta › "Legal y privacidad": el aviso aceptado (lleva a la página) y el consentimiento
// de datos de salud, que se retira o se vuelve a dar acá. Retirarlo apaga "Generar rutina"; los datos
// quedan guardados (decisión del usuario, 2026-11-12).
export function FilasLegales({ estado, onCambio }: { estado: EstadoLegal; onCambio: (e: EstadoLegal) => void }) {
  const [confirmando, setConfirmando] = useState<"retirar" | "dar" | null>(null);
  const [error, setError] = useState("");
  const consentido = estado.saludConsentidaEl !== null;

  async function cambiar(accion: "retirar" | "dar") {
    setConfirmando(null);
    setError("");
    try {
      const res =
        accion === "retirar"
          ? await apiFetch(`/profile/consent/health`, { method: "DELETE" })
          : await apiFetch(`/profile/consent`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ accept_legal_notice: true, accept_health_consent: true }),
            });
      if (!res.ok) {
        setError(errorText((await res.json()).detail));
        return;
      }
      const p = await res.json();
      onCambio({
        avisoAceptadoEl: p.legal_notice_accepted_at,
        avisoVersion: p.legal_notice_version,
        saludConsentidaEl: p.health_consent_at,
      });
    } catch {
      setError("No se pudo conectar con el servidor");
    }
  }

  return (
    <section className="mb-3 rounded-2xl bg-card px-4 py-1">
      <h2 className="mt-3 mb-1 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Legal y privacidad</h2>
      <Link
        href="/aviso-legal"
        className="flex min-h-14 items-center justify-between gap-2 text-foreground no-underline"
      >
        <span>
          Aviso legal
          {estado.avisoVersion && (
            <span className="block text-sm text-muted-foreground">Versión {estado.avisoVersion}</span>
          )}
        </span>
        <span className="flex items-center gap-1 text-sm font-semibold text-disco-verde-texto">
          {estado.avisoAceptadoEl ? `Aceptado el ${fecha(estado.avisoAceptadoEl)}` : "Sin aceptar"}
          <ChevronRight className="size-4 text-muted-foreground" aria-hidden="true" />
        </span>
      </Link>
      <div className="flex min-h-14 items-center justify-between gap-2 border-t border-border">
        <span>
          Datos de salud
          <span className="block text-sm text-muted-foreground">
            {consentido ? `Consentido el ${fecha(estado.saludConsentidaEl)}` : "Sin consentimiento: no se generan rutinas"}
          </span>
        </span>
        <button
          type="button"
          onClick={() => setConfirmando(consentido ? "retirar" : "dar")}
          className="shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold text-disco-azul outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {consentido ? "Retirar" : "Dar consentimiento"}
        </button>
      </div>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <Confirmar
        abierto={confirmando === "retirar"}
        titulo="¿Retirar el consentimiento?"
        texto="Sin tu consentimiento no se puede usar Generar rutina ni pedir la semana siguiente, y no se manda nada más a la IA. Tus datos quedan guardados: si querés borrarlos, borrá tu cuenta. Podés volver a darlo cuando quieras."
        accion="Retirar"
        onConfirmar={() => cambiar("retirar")}
        onCancelar={() => setConfirmando(null)}
      />
      <Confirmar
        abierto={confirmando === "dar"}
        titulo="Dar el consentimiento"
        texto={TEXTO_CONSENTIMIENTO_SALUD}
        accion="Consiento"
        destructivo={false}
        onConfirmar={() => cambiar("dar")}
        onCancelar={() => setConfirmando(null)}
      />
    </section>
  );
}
