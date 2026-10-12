"use client";

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
// `destacado`: botón principal (cuando ya se completaron todos los días); si no, va discreto.
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

  return (
    <>
      <Button
        type="button"
        variant={destacado ? "default" : "link"}
        size={destacado ? "lg" : "default"}
        className={destacado ? "w-full" : "px-0 text-muted-foreground"}
        onClick={() => setConfirmando(true)}
      >
        Cerrar semana
      </Button>
      <AlertDialog open={confirmando} onOpenChange={(abierto) => !cerrando && setConfirmando(abierto)}>
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Cerrar semana</AlertDialogTitle>
            <AlertDialogDescription>
              {pendientes.length > 0
                ? `Te faltan por completar: ${pendientes.map((n) => `Día ${n}`).join(", ")}. Esos días se cuentan como no hechos.`
                : "Completaste todos los días."}{" "}
              ¿Cerrar la semana? No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div>
            <Label htmlFor="comentario">¿Cómo te sentiste esta semana? (opcional)</Label>
            <Textarea
              id="comentario"
              rows={4}
              maxLength={1000}
              value={comentario}
              disabled={cerrando}
              onChange={(e) => setComentario(e.target.value)}
            />
            <small>La IA lo tiene en cuenta al armar la semana siguiente.</small>
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cerrando}>Cancelar</AlertDialogCancel>
            <Button type="button" onClick={cerrar} disabled={cerrando}>
              {cerrando ? "Cerrando..." : "Cerrar semana"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
