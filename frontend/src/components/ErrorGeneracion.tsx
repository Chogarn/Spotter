"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";

// Por qué falló "Generar rutina". Los cuatro primeros llegan del servidor en el encabezado
// `X-Error-Code`; "sin_conexion" es cuando el pedido ni siquiera llegó.
export type MotivoFallo = "ia_no_respondio" | "tope_minuto" | "tope_dia" | "reglas" | "sin_conexion";
export const MOTIVOS: MotivoFallo[] = ["ia_no_respondio", "tope_minuto", "tope_dia", "reglas"];

const ESPERA_MINUTO = 60; // segundos; es lo que dice el `Retry-After` del servidor

// El tope diario de Gemini se reinicia a medianoche del Pacífico: la hora local de ese momento.
function proximoReinicio(ahora: Date): { hora: string; manana: boolean } {
  const partes = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Los_Angeles",
      hourCycle: "h23",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
    })
      .formatToParts(ahora)
      .map((p) => [p.type, Number(p.value)]),
  );
  const relojPacifico = Date.UTC(partes.year, partes.month - 1, partes.day, partes.hour, partes.minute, partes.second);
  const diferencia = relojPacifico - Math.floor(ahora.getTime() / 1000) * 1000;
  const reinicio = new Date(Date.UTC(partes.year, partes.month - 1, partes.day + 1) - diferencia);
  return {
    hora: reinicio.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }),
    manana: reinicio.toDateString() !== ahora.toDateString(),
  };
}

function Guardadas({ children }: { children: React.ReactNode }) {
  return (
    <p className="m-0 mt-2 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 text-sm">
      <span className="font-bold text-disco-verde-texto" aria-hidden="true">✓</span>
      {children}
    </p>
  );
}

// Cuando la generación falla, la pantalla completa de carga se convierte en esta: qué pasó, sin
// palabras técnicas, y qué se puede hacer. Lo elegido en el asistente no se pierde. "Probar de
// nuevo" siempre lo toca la persona: no hay reintentos automáticos (cada intento gasta cuota).
export function ErrorGeneracion({
  motivo,
  detalle,
  onReintentar,
  onVolver,
  onInicio,
}: {
  motivo: MotivoFallo;
  detalle?: string;
  onReintentar: () => void;
  onVolver: () => void;
  onInicio: () => void;
}) {
  // La cuenta del tope por minuto arranca al mostrarse y habilita el botón sola.
  const [hasta] = useState(() => Date.now() + ESPERA_MINUTO * 1000);
  const [quedan, setQuedan] = useState(ESPERA_MINUTO);
  useEffect(() => {
    if (motivo !== "tope_minuto") return;
    const reloj = setInterval(() => {
      const s = Math.max(0, Math.ceil((hasta - Date.now()) / 1000));
      setQuedan(s);
      if (s === 0) clearInterval(reloj);
    }, 250);
    return () => clearInterval(reloj);
  }, [motivo, hasta]);
  const [reinicio] = useState(() => proximoReinicio(new Date()));

  const color = {
    ia_no_respondio: "border-disco-amarillo",
    tope_minuto: "border-disco-azul",
    tope_dia: "border-muted-foreground",
    reglas: "border-disco-rojo",
    sin_conexion: "border-muted-foreground",
  }[motivo];

  let titulo: string;
  let cuerpo: React.ReactNode;
  if (motivo === "ia_no_respondio") {
    titulo = "La IA está con mucha demanda";
    cuerpo = (
      <>
        <p className="m-0">No es tu culpa ni de tus datos. Suele resolverse en unos minutos.</p>
        <Guardadas>Tus elecciones quedaron guardadas</Guardadas>
      </>
    );
  } else if (motivo === "tope_minuto") {
    titulo = "Un respiro y seguimos";
    cuerpo = (
      <>
        <p className="m-0 font-heading text-5xl font-bold text-foreground" aria-hidden="true">
          {Math.floor(quedan / 60)}:{String(quedan % 60).padStart(2, "0")}
        </p>
        <p className="m-0">Hubo muchos pedidos en este minuto. Cuando termine la cuenta, podés probar de nuevo.</p>
        <Guardadas>Tus elecciones quedaron guardadas</Guardadas>
      </>
    );
  } else if (motivo === "tope_dia") {
    titulo = "Por hoy la IA descansa";
    cuerpo = (
      <>
        <p className="m-0">
          Llegamos al límite gratuito del día. Vuelve a estar disponible{" "}
          <strong className="text-foreground">{reinicio.manana ? "mañana" : "hoy"} a las {reinicio.hora}</strong>.
        </p>
        <Guardadas>Cuando vuelvas, tus elecciones van a estar listas</Guardadas>
      </>
    );
  } else if (motivo === "reglas") {
    titulo = "No salió una rutina que cumpla todo";
    cuerpo = (
      <>
        <p className="m-0">
          La IA armó una, pero no respetaba las reglas de volumen y reparto, así que no te la mostramos.
          Probá de nuevo: cada intento sale distinto.
        </p>
        {detalle && (
          <details className="mt-1 w-full rounded-xl bg-card px-3 py-2 text-left text-sm">
            <summary className="cursor-pointer">Ver detalle</summary>
            <p className="m-0 mt-2 break-words">{detalle}</p>
          </details>
        )}
      </>
    );
  } else {
    titulo = "Sin conexión";
    cuerpo = (
      <>
        <p className="m-0">No pudimos hablar con Spotter. Revisá tu internet y probá de nuevo.</p>
        <Guardadas>Tus elecciones quedaron guardadas</Guardadas>
      </>
    );
  }

  const esperando = motivo === "tope_minuto" && quedan > 0;

  return (
    <div role="alert" className="fixed inset-0 z-[100] flex flex-col overflow-y-auto bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-10 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-base leading-snug text-muted-foreground">
          {/* Un disco quieto, del color del motivo (el de la carga gira). */}
          <div className={cn("relative mb-2 size-24 rounded-full border-[12px]", color)} aria-hidden="true">
            <div className="absolute inset-[14px] rounded-full bg-disco-tinta" />
            <div className="absolute inset-[30px] rounded-full bg-background" />
          </div>
          <h2 className="m-0 font-heading text-3xl leading-tight font-bold text-foreground">{titulo}</h2>
          {cuerpo}
        </div>
        <div className="mt-6 flex flex-col gap-3">
          {motivo === "tope_dia" ? (
            <Button type="button" size="xl" className="w-full" onClick={onInicio}>
              Volver al inicio
            </Button>
          ) : (
            <>
              <Button type="button" size="xl" className="w-full" onClick={onReintentar} disabled={esperando}>
                {esperando ? `Probar en ${quedan} s` : "Probar de nuevo"}
              </Button>
              <Button type="button" size="xl" variant="outline" className="w-full" onClick={onVolver}>
                {motivo === "reglas" ? "Cambiar la estructura" : "Volver"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
