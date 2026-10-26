"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { GraficoCuerpo } from "@/components/GraficoCuerpo";
import { Confirmar } from "@/components/Confirmar";
import { ErrorMessage, InlineError } from "@/components/ErrorMessage";
import { errorText, readError, apiFetch, type Measurement } from "@/lib/api";
import { shortDate } from "@/lib/format";

// Un número escrito a mano ("78,4" o "78.4") a número; null si está vacío o no es un número.
export function aNumero(texto: string): number | null {
  const limpio = texto.trim().replace(",", ".");
  if (limpio === "") return null;
  const n = Number(limpio);
  return Number.isFinite(n) ? n : null;
}

function numero(v: number | string, decimales = 1): string {
  return Number(v).toLocaleString("es-AR", { minimumFractionDigits: decimales, maximumFractionDigits: decimales });
}

// Progreso → Cuerpo (decisión 87): el seguimiento del peso con su historial, cargado a mano. Se
// carga al cerrar la semana o acá, cuando quieras. Cada medición se puede corregir y borrar. El IMC
// es solo informativo y se calcula con la altura del perfil.
export function SeguimientoCuerpo() {
  const [filas, setFilas] = useState<Measurement[] | null>(null);
  const [error, setError] = useState("");
  // Qué se está editando: una medición, "nueva" o nada.
  const [formulario, setFormulario] = useState<Measurement | "nueva" | null>(null);
  const [aBorrar, setABorrar] = useState<Measurement | null>(null);
  const [pestana, setPestana] = useState<"resumen" | "lista">("resumen");

  const cargar = useCallback(() => {
    apiFetch(`/measurements`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setFilas(await res.json());
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  async function borrar(m: Measurement) {
    setABorrar(null);
    setError("");
    try {
      const res = await apiFetch(`/measurements/${m.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await readError(res));
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo conectar con el servidor");
    }
  }

  if (filas === null) {
    return error ? <ErrorMessage>{error}</ErrorMessage> : <p role="status">Cargando...</p>;
  }

  const ultima = filas[0];
  const conGrasa = filas.find((f) => f.body_fat_pct !== null);

  return (
    <>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      <div className="mb-3 flex gap-1 rounded-full bg-muted p-1" role="group" aria-label="Qué ver">
        {(
          [
            ["resumen", "Resumen"],
            ["lista", "Lista"],
          ] as const
        ).map(([id, texto]) => (
          <button
            key={id}
            type="button"
            aria-pressed={pestana === id}
            onClick={() => setPestana(id)}
            className={`flex-1 rounded-full px-3 py-1.5 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50 ${
              pestana === id ? "bg-disco-tinta font-medium text-white" : "text-muted-foreground"
            }`}
          >
            {texto}
          </button>
        ))}
      </div>
      {pestana === "resumen" && (
      <section className="mb-3 rounded-2xl bg-card p-4">
        <div className="grid grid-cols-2 gap-2">
          <Dato titulo="Peso actual" valor={ultima ? `${numero(ultima.weight_kg)} kg` : "—"} azul />
          <Dato titulo="IMC" valor={ultima?.bmi != null ? numero(ultima.bmi) : "—"} />
          {conGrasa && (
            <div className="col-span-2">
              <Dato
                titulo={`Grasa corporal (${shortDate(conGrasa.measured_on)})`}
                valor={`${numero(conGrasa.body_fat_pct!)} %`}
              />
            </div>
          )}
        </div>
        <p className="mt-2 mb-3 text-xs text-muted-foreground">
          El IMC es orientativo: no distingue músculo de grasa. La grasa corporal es la que te dio tu balanza.
        </p>
        <GraficoCuerpo filas={filas} />
      </section>
      )}

      {pestana === "lista" && (
      <section className="mb-3 rounded-2xl bg-card p-4">
        <h2 className="mt-0 mb-1 text-xl">Mediciones</h2>
        {filas.length === 0 ? (
          <p className="m-0 text-sm text-muted-foreground">Todavía no cargaste ninguna.</p>
        ) : (
          <ul className="m-0 list-none p-0">
            {filas.map((f) => (
              <li key={f.id} className="flex items-center gap-2 border-t border-border py-2 first:border-t-0">
                <div className="min-w-0 flex-1">
                  <p className="m-0 font-heading text-lg leading-tight font-bold">
                    {numero(f.weight_kg)} kg
                    {f.bmi != null && <span className="text-muted-foreground"> · IMC {numero(f.bmi)}</span>}
                    {f.body_fat_pct !== null && (
                      <span className="text-muted-foreground"> · grasa {numero(f.body_fat_pct)} %</span>
                    )}
                  </p>
                  <p className="m-0 text-xs text-muted-foreground">
                    {shortDate(f.measured_on)}
                    {f.week_number !== null && ` · semana ${f.week_number}`}
                  </p>
                </div>
                <Button
                  size="icon-lg"
                  variant="outline"
                  type="button"
                  aria-label={`Corregir la medición del ${shortDate(f.measured_on)}`}
                  onClick={() => setFormulario(f)}
                >
                  <Pencil />
                </Button>
                <Button
                  size="icon-lg"
                  variant="outline"
                  type="button"
                  aria-label={`Borrar la medición del ${shortDate(f.measured_on)}`}
                  onClick={() => setABorrar(f)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </section>
      )}

      <Button type="button" size="xl" className="w-full" onClick={() => setFormulario("nueva")}>
        Cargar peso
      </Button>

      {formulario !== null && (
        <Formulario
          key={formulario === "nueva" ? "nueva" : formulario.id}
          medicion={formulario === "nueva" ? null : formulario}
          onCerrar={() => setFormulario(null)}
          onGuardada={() => {
            setFormulario(null);
            cargar();
          }}
        />
      )}
      <Confirmar
        abierto={aBorrar !== null}
        titulo="¿Borrar esta medición?"
        texto={
          aBorrar
            ? `Se borra la del ${shortDate(aBorrar.measured_on)} (${numero(aBorrar.weight_kg)} kg). Tu peso del perfil pasa a ser el de la medición más nueva que quede.`
            : ""
        }
        accion="Borrar"
        onConfirmar={() => aBorrar && borrar(aBorrar)}
        onCancelar={() => setABorrar(null)}
      />
    </>
  );
}

function Dato({ titulo, valor, azul = false }: { titulo: string; valor: string; azul?: boolean }) {
  return (
    <div className="rounded-xl bg-muted px-3 py-2">
      <p className="m-0 text-xs text-muted-foreground">{titulo}</p>
      <p className={`m-0 font-heading text-2xl leading-tight font-bold ${azul ? "text-disco-azul" : ""}`}>{valor}</p>
    </div>
  );
}

// Cargar o corregir una medición, en un recuadro como el de cerrar la semana.
function Formulario({
  medicion,
  onCerrar,
  onGuardada,
}: {
  medicion: Measurement | null;
  onCerrar: () => void;
  onGuardada: () => void;
}) {
  // La fecha de hoy de la persona (no la UTC, que de noche ya es mañana).
  const ahora = new Date();
  const dos = (n: number) => String(n).padStart(2, "0");
  const hoy = `${ahora.getFullYear()}-${dos(ahora.getMonth() + 1)}-${dos(ahora.getDate())}`;
  const [fecha, setFecha] = useState(medicion?.measured_on ?? hoy);
  const [peso, setPeso] = useState(medicion ? String(Number(medicion.weight_kg)).replace(".", ",") : "");
  const [grasa, setGrasa] = useState(
    medicion?.body_fat_pct != null ? String(Number(medicion.body_fat_pct)).replace(".", ",") : "",
  );
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);

  async function guardar() {
    const kg = aNumero(peso);
    const pct = aNumero(grasa);
    if (kg === null || kg < 30 || kg > 300) return setError("Escribí un peso entre 30 y 300 kg");
    if (grasa.trim() !== "" && (pct === null || pct < 2 || pct > 70)) return setError("La grasa corporal va entre 2 y 70 %");
    setError("");
    setGuardando(true);
    try {
      const res = await apiFetch(medicion ? `/measurements/${medicion.id}` : `/measurements`, {
        method: medicion ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weight_kg: kg, body_fat_pct: pct, measured_on: fecha || null }),
      });
      if (!res.ok) {
        setError(errorText((await res.json()).detail));
        setGuardando(false);
        return;
      }
      onGuardada();
    } catch {
      setError("No se pudo conectar con el servidor");
      setGuardando(false);
    }
  }

  return (
    <AlertDialog open onOpenChange={(abierto) => !abierto && !guardando && onCerrar()}>
      <AlertDialogContent className="sm:max-w-lg">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-heading text-2xl font-bold">
            {medicion ? "Corregir medición" : "Cargar peso"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            Si ya cargaste otra ese día, se reemplaza. Tu peso del perfil queda en el de la medición más nueva.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid gap-3">
          <div>
            <Label htmlFor="med-fecha">Fecha</Label>
            <Input id="med-fecha" type="date" max={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="med-peso">Peso (kg)</Label>
            <Input
              id="med-peso"
              inputMode="decimal"
              placeholder="Ej: 78,4"
              value={peso}
              onChange={(e) => setPeso(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="med-grasa">Grasa corporal (%) (opcional)</Label>
            <Input
              id="med-grasa"
              inputMode="decimal"
              placeholder="Ej: 18,5"
              value={grasa}
              onChange={(e) => setGrasa(e.target.value)}
            />
            <small>Si tenés una balanza biométrica.</small>
          </div>
          {error && <InlineError>{error}</InlineError>}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={guardando}>Cancelar</AlertDialogCancel>
          <Button type="button" onClick={guardar} disabled={guardando}>
            {guardando ? "Guardando..." : "Guardar"}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
