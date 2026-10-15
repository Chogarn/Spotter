"use client";

import { useEffect, useState } from "react";

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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { apiFetch, readError, type Proposal } from "@/lib/api";
import { cn } from "cn";

import { ErrorMessage } from "./ErrorMessage";

// Cambiar un ejercicio de la propuesta por otro del catálogo (decisión 65). La lista sale del
// backend (mismo músculo, tu nivel, sin los que ya están en la semana) y el cambio se aplica en
// todos los días donde aparece. Se monta solo cuando hay un ejercicio elegido.

type Alternativa = {
  id: string;
  name: string;
  description: string;
  equipment: string;
  level: string;
  mechanic: string;
};

const EQUIPO: Record<string, string> = {
  barbell: "barra",
  dumbbell: "mancuernas",
  machine: "máquina",
  cable: "polea",
  bodyweight: "peso corporal",
  band: "banda elástica",
  kettlebell: "kettlebell",
  other: "otro",
};

export function CambiarEjercicio({
  propuestaId,
  nombre,
  veces,
  onCerrar,
  onCambiado,
}: {
  propuestaId: string;
  nombre: string;
  // En cuántos días aparece el ejercicio: se cambia en todos.
  veces: number;
  onCerrar: () => void;
  onCambiado: (propuesta: Proposal) => void;
}) {
  const [opciones, setOpciones] = useState<Alternativa[] | null>(null);
  const [elegida, setElegida] = useState("");
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    apiFetch(`/proposals/${propuestaId}/alternatives?name=${encodeURIComponent(nombre)}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setOpciones(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [propuestaId, nombre]);

  async function cambiar() {
    if (!elegida) return;
    setError("");
    setTrabajando(true);
    try {
      const res = await apiFetch(`/proposals/${propuestaId}/swap`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from_name: nombre, to_id: elegida }),
      });
      if (!res.ok) {
        setError(await readError(res));
        setTrabajando(false);
        return;
      }
      onCambiado(await res.json());
    } catch {
      setError("No se pudo conectar con el servidor");
      setTrabajando(false);
    }
  }

  return (
    <AlertDialog open onOpenChange={(a) => !a && !trabajando && onCerrar()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cambiar {nombre}</AlertDialogTitle>
          <AlertDialogDescription>
            Elegí por cuál reemplazarlo.{" "}
            {veces > 1 ? `Está en ${veces} días: se cambia en todos. ` : ""}
            Las series y repeticiones quedan igual y el peso en blanco, para que lo ajustes al entrenar.
          </AlertDialogDescription>
        </AlertDialogHeader>

        {opciones === null && !error && <p className="m-0 text-muted-foreground">Buscando alternativas…</p>}
        {opciones?.length === 0 && (
          <p className="m-0 text-muted-foreground">
            No hay otros ejercicios de este músculo para tu nivel que no estén ya en la semana.
          </p>
        )}
        {opciones && opciones.length > 0 && (
          <RadioGroup
            value={elegida}
            onValueChange={(v) => setElegida(String(v))}
            aria-label="Ejercicios alternativos"
            className="max-h-[45vh] overflow-y-auto pr-1"
          >
            {opciones.map((o) => (
              <label
                key={o.id}
                className={cn(
                  "flex cursor-pointer items-start gap-3 rounded-xl border-2 border-transparent bg-muted px-3 py-2.5",
                  elegida === o.id && "border-disco-tinta bg-card",
                )}
              >
                <RadioGroupItem value={o.id} className="mt-1" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{o.name}</span>
                  <span className="block text-sm text-muted-foreground">
                    {EQUIPO[o.equipment] ?? o.equipment} · {o.level}
                  </span>
                  <span className="block text-sm">{o.description}</span>
                </span>
              </label>
            ))}
          </RadioGroup>
        )}
        {error && <ErrorMessage>{error}</ErrorMessage>}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={trabajando}>Cancelar</AlertDialogCancel>
          <Button type="button" disabled={!elegida || trabajando} onClick={cambiar}>
            {trabajando ? "Cambiando…" : "Cambiar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
