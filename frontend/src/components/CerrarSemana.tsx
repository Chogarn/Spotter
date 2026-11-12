"use client";

import { ChevronDown, Lock, TriangleAlert } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ErrorMessage";
import { cn } from "cn";

// "Cerrar semana" con su recuadro: avisa los días sin completar (cuentan como no hechos) y deja
// un comentario opcional que la IA lee al armar la semana siguiente. Vive en Entrenar (decisión 44).
// `destacado`: botón principal (cuando ya se completaron todos los días); si no, un botón con
// borde y candado. El recuadro tiene el formato de tarjeta (decisión 57).
export function CerrarSemana({
  weekId,
  pendientes,
  destacado = false,
  grande = false,
  onCerrada,
}: {
  weekId: number;
  pendientes: number[];
  destacado?: boolean;
  // `grande`: el botón destacado del tamaño de los demás de su pantalla (el festejo de la semana).
  grande?: boolean;
  onCerrada: () => void;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [cerrando, setCerrando] = useState(false);
  const [comentario, setComentario] = useState("");
  // El peso ya no se carga acá (decisión 131): va con "Cargar peso", en Inicio o en Progreso › Cuerpo.
  const [error, setError] = useState("");
  const [verComentario, setVerComentario] = useState(false);

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
        <Button type="button" size={grande ? "xl" : "lg"} className="w-full" onClick={() => setConfirmando(true)}>
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
            {faltan > 0 && (
              <p className="m-0 flex items-start gap-2 rounded-xl bg-disco-amarillo/30 px-3 py-2 text-sm text-disco-amarillo-texto">
                <TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                {faltanTexto} ({pendientes.map((n) => `Día ${n}`).join(", ")}). Se cuentan como no hechos.
              </p>
            )}
            <AlertDialogDescription>
              {faltan === 0 && "Completaste todos los días. "}
              La IA arma la semana siguiente con lo que hiciste. No se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="border-t border-border pt-3">
            <Desplegable titulo="¿Cómo te sentiste?" abierto={verComentario} onAlternar={() => setVerComentario((v) => !v)} cargado={!!comentario.trim()}>
            <Textarea
              id="comentario"
              rows={3}
              maxLength={1000}
              placeholder="Contale a la IA si algo te costó, te sobró o te dolió"
              value={comentario}
              disabled={cerrando}
              onChange={(e) => setComentario(e.target.value)}
            />
            </Desplegable>
          </div>
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cerrando}>Cancelar</AlertDialogCancel>
            <Button type="button" size="lg" onClick={cerrar} disabled={cerrando}>
              {cerrando ? "Cerrando..." : "Cerrar semana"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Una sección opcional que se despliega: cerrada es una sola línea, así la ventana queda corta.
function Desplegable({
  titulo,
  abierto,
  onAlternar,
  cargado,
  children,
}: {
  titulo: string;
  abierto: boolean;
  onAlternar: () => void;
  cargado: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        type="button"
        onClick={onAlternar}
        aria-expanded={abierto}
        className="flex w-full items-center gap-2 rounded-lg py-1 text-left font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <span className="flex-1">
          {titulo} <span className="font-normal text-muted-foreground">· opcional{cargado && !abierto ? " · cargado" : ""}</span>
        </span>
        <ChevronDown
          className={cn("size-5 text-muted-foreground transition-transform motion-reduce:transition-none", abierto && "rotate-180")}
          aria-hidden="true"
        />
      </button>
      {abierto && <div className="pt-2">{children}</div>}
    </div>
  );
}
