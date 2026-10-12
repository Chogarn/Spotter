"use client";

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

// Recuadro para confirmar algo que borra lo registrado (el tacho, decisión 43). Dice qué se pierde
// y el botón nombra la acción; se abre y se cierra desde quien lo usa.
export function Confirmar({
  abierto,
  titulo,
  texto,
  accion,
  onConfirmar,
  onCancelar,
}: {
  abierto: boolean;
  titulo: string;
  texto: string;
  accion: string;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <AlertDialog open={abierto} onOpenChange={(a) => !a && onCancelar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{titulo}</AlertDialogTitle>
          <AlertDialogDescription>{texto}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <Button
            type="button"
            className="bg-destructive text-white hover:bg-destructive/85"
            onClick={onConfirmar}
          >
            {accion}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
