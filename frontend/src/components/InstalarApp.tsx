"use client";

import { Download } from "lucide-react";
import { useEffect, useState, useSyncExternalStore } from "react";

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "cn";

// Botón "Instalar la app en tu teléfono" (PWA, 2026-11-07). Solo aparece en un teléfono y si la
// app todavía no está instalada:
// - Android (Chrome y otros que lo permiten): el navegador avisa con `beforeinstallprompt` que se
//   puede instalar; el botón abre su propio aviso, "¿Instalar Spotter?". Si el navegador no avisa
//   (ya instalada, o no la deja instalar), el botón no aparece.
// - iPhone y iPad: ningún navegador deja que una web abra ese aviso, así que el botón muestra los
//   pasos del menú Compartir.
// En la computadora no se ve.

// El evento de Chrome no está en los tipos de TypeScript: solo lo que usamos.
type AvisoInstalar = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

// Chrome puede avisar antes de que React termine de cargar la página: se guarda el aviso apenas
// llega, a nivel de módulo, y el componente lo toma al montarse.
let avisoTemprano: AvisoInstalar | null = null;
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    avisoTemprano = e as AvisoInstalar;
  });
}

type Plataforma = "ios" | "movil" | "otra";

function leerPlataforma(): Plataforma {
  // Abierta desde el ícono: ya está instalada, no hay nada que ofrecer.
  const instalada =
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (instalada) return "otra";
  const ua = navigator.userAgent;
  // El iPad se presenta como una Mac; se lo reconoce porque tiene pantalla táctil.
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (ios) return "ios";
  return /Android|Mobi/.test(ua) ? "movil" : "otra";
}

const sinSuscripcion = () => () => {};

export function InstalarApp({ className }: { className?: string }) {
  // Solo se sabe en el navegador: al preparar la página en el servidor no se muestra nada.
  const plataforma = useSyncExternalStore(sinSuscripcion, leerPlataforma, () => null);
  const [aviso, setAviso] = useState<AvisoInstalar | null>(null);
  const [instalada, setInstalada] = useState(false);
  const [pasosAbiertos, setPasosAbiertos] = useState(false);

  useEffect(() => {
    const alAvisar = (e: Event) => {
      e.preventDefault();
      setAviso(e as AvisoInstalar);
    };
    const alInstalar = () => {
      setAviso(null);
      setInstalada(true);
    };
    window.addEventListener("beforeinstallprompt", alAvisar);
    window.addEventListener("appinstalled", alInstalar);
    // Si el aviso llegó antes de montarse, se toma acá.
    const temprano = avisoTemprano;
    if (temprano) queueMicrotask(() => setAviso(temprano));
    return () => {
      window.removeEventListener("beforeinstallprompt", alAvisar);
      window.removeEventListener("appinstalled", alInstalar);
    };
  }, []);

  if (instalada || plataforma === null || plataforma === "otra") return null;
  if (plataforma === "movil" && !aviso) return null;

  async function instalar() {
    if (plataforma === "ios") {
      setPasosAbiertos(true);
      return;
    }
    if (!aviso) return;
    await aviso.prompt();
    await aviso.userChoice;
    // El aviso de Chrome sirve una sola vez, se acepte o no.
    avisoTemprano = null;
    setAviso(null);
  }

  return (
    <>
      <Button type="button" variant="ghost" size="lg" className={cn("gap-2", className)} onClick={instalar}>
        <Download aria-hidden="true" />
        Instalar la app en tu teléfono
      </Button>

      <AlertDialog open={pasosAbiertos} onOpenChange={setPasosAbiertos}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Instalar en iPhone</AlertDialogTitle>
          </AlertDialogHeader>
          <ol className="m-0 grid gap-2 pl-5 text-left">
            <li>
              Tocá <strong>Compartir</strong> (el cuadrado con la flecha hacia arriba) en la barra del navegador.
            </li>
            <li>
              Elegí <strong>Agregar a pantalla de inicio</strong>.
            </li>
            <li>
              Tocá <strong>Agregar</strong>. Spotter queda con su ícono.
            </li>
          </ol>
          <AlertDialogFooter>
            <Button type="button" onClick={() => setPasosAbiertos(false)}>
              Entendido
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
