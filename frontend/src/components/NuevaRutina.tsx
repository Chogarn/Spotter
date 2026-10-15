"use client";

import Link from "next/link";
import { useState } from "react";

import { GenerarRutina } from "@/components/GenerarRutina";
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

// "Nueva rutina" (decisión 50): abre directo el asistente para que la IA arme una rutina nueva
// (objetivo, nivel y días). Con una semana activa no se puede generar: en vez del asistente avisa
// que primero hay que cerrarla desde Entrenar. `children` dibuja el disparador (un botón, una
// tarjeta) y recibe la función que abre el asistente o el aviso, así se usa desde Rutinas e Inicio.
export function NuevaRutina({
  hayActiva,
  children,
}: {
  hayActiva: boolean;
  children: (abrir: () => void) => React.ReactNode;
}) {
  const [avisando, setAvisando] = useState(false);
  if (!hayActiva) {
    return <GenerarRutina etiqueta="Nueva rutina" soloNueva disparador={children} />;
  }
  return (
    <>
      {children(() => setAvisando(true))}
      <AlertDialog open={avisando} onOpenChange={setAvisando}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Tenés una semana en curso</AlertDialogTitle>
            <AlertDialogDescription>
              Para empezar una rutina nueva, primero cerrá la semana en curso desde Entrenar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button nativeButton={false} render={<Link href="/entrenar" />}>
              Ir a Entrenar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
