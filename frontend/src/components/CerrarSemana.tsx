"use client";

import { Lock } from "lucide-react";
import { useState } from "react";

import { readError, apiFetch } from "@/lib/api";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ErrorMessage";

// "Cerrar semana" con su recuadro: avisa los días sin completar (cuentan como no hechos) y deja
// un comentario opcional que la IA lee al armar la semana siguiente. Vive en Entrenar (decisión 44).
// `destacado`: botón principal (cuando ya se completaron todos los días); si no, un botón con
// borde y candado. El recuadro tiene el formato de tarjeta (decisión 57).
export function CerrarSemana({
  weekId,
  pendientes,
  destacado = false,
  onCerrada,
}: {
  weekId: number;
  pendientes: number[];
  destacado?: boolean;
  onCerrada: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [comentario, setComentario] = useState("");
  const [error, setError] = useState("");

  async function cerrar() {
    setError("");
    setCerrando(true);
    try {
      const res = await apiFetch(`/weeks/${weekId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ note: comentario.trim() || null }),
      });
      if (!res.ok) throw new Error(await readError(res));
      setConfirmando(false);
      onCerrada();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar con el servidor");
    }
    setCerrando(false);
  }

  const faltan = pendientes.length;
  const faltanTexto = `Te ${faltan === 1 ? "falta 1 día" : `faltan ${faltan} días`}`;

  return (
    <>
      {destacado ? (
        <Button type="button" size="lg" className="w-full" onClick={() => setConfirmando(true)}>
          Cerrar semana
        </Button>
      ) : (
        // Con días por hacer, un botón con borde a todo el ancho, menos fuerte que "Empezar día N".
        <Button
          type="button"
          variant="outline"
          size="xl"
          className="w-full border-2 border-disco-tinta"
          onClick={() => setConfirmando(true)}
        >
          <Lock data-icon="inline-start" />
          Cerrar semana
        </Button>
      )}
      {/* El recuadro con el formato de una tarjeta: pregunta, qué pasa y el botón con borde. */}
      <AlertDialog open={confirmando} onOpenChange={(abierto) => !cerrando && setConfirmando(abierto)}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-heading text-2xl font-bold">¿Terminaste la semana?</AlertDialogTitle>
            <AlertDialogDescription>
              {faltan > 0
                ? `${faltanTexto}: ${pendientes.map((n) => `Día ${n}`).join(", ")}. Se cuentan como no hechos. `
                : "Completaste todos los días. "}
              La IA arma la siguiente con lo que hiciste. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label htmlFor="comentario">¿Cómo te sentiste esta semana? ¿Algún dolor o molestia? (opcional)</Label>
            <Textarea
              id="comentario"
              rows={4}
              maxLength={1000}
              placeholder="Por ejemplo: me costó el press militar y me molestó la rodilla derecha en la sentadilla"
              value={comentario}
              disabled={cerrando}
              onChange={(e) => setComentario(e.target.value)}
            />
            <small>La IA lo lee al armar la semana siguiente: contale si algo te costó, te sobró o te dolió.</small>
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cerrando}>Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              className="border-2 border-disco-tinta"
              onClick={cerrar}
              disabled={cerrando}
            >
              {cerrando ? "Cerrando..." : "Cerrar semana"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
