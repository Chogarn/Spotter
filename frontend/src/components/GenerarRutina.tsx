"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { API, readError, type Routine } from "@/lib/api";
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

const NIVELES = [
  ["principiante", "principiante"],
  ["intermedio", "intermedio"],
  ["avanzado", "avanzado"],
];
const OBJETIVOS = [
  ["masa", "masa"],
  ["fuerza", "fuerza"],
  ["perder_grasa", "perder grasa"],
  ["condicion_general", "condición general"],
  ["mantenerme_activo", "mantenerme activo"],
];

// Botón que, antes de llamar a la IA, pregunta qué hacer (continuar una rutina o empezar una
// nueva con su nivel y objetivo), con Cancelar. `onConflict` avisa a la pantalla si el servidor
// dice que ya hay una semana activa.
export function GenerarRutina({
  etiqueta,
  onConflict,
}: {
  etiqueta: string;
  onConflict?: () => void;
}) {
  const router = useRouter();
  const [preguntando, setPreguntando] = useState(false);
  // Rutinas que se pueden continuar (null = cargando). `eleccion`: id de una rutina o "nueva".
  const [rutinas, setRutinas] = useState<Routine[] | null>(null);
  const [eleccion, setEleccion] = useState("");
  const [nivel, setNivel] = useState("");
  const [objetivo, setObjetivo] = useState("");
  const [error, setError] = useState("");
  // `pidiendo`: esperando a la IA. `navegando`: abriendo la propuesta; se apaga solo cuando la
  // nueva página está lista (así esta pantalla no queda "generando" al volver a ella).
  const [pidiendo, setPidiendo] = useState(false);
  const [navegando, startTransition] = useTransition();
  const generando = pidiendo || navegando;

  const listo = eleccion === "nueva" ? Boolean(nivel && objetivo) : eleccion !== "";

  async function abrir() {
    setError("");
    setPreguntando(true);
    setEleccion("");
    setRutinas(null);
    try {
      const res = await fetch(`${API}/routines`);
      if (!res.ok) throw new Error(await readError(res));
      const lista: Routine[] = await res.json();
      setRutinas(lista);
      if (lista.length === 0) setEleccion("nueva"); // sin rutinas no hay nada que continuar
    } catch (e) {
      setPreguntando(false);
      setError(e instanceof Error ? e.message : "No se pudo conectar con el servidor");
    }
  }

  async function generar() {
    setError("");
    setPidiendo(true);
    try {
      const res = await fetch(`${API}/proposals/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          eleccion === "nueva" ? { goal: objetivo, level: nivel } : { routine_id: Number(eleccion) },
        ),
      });
      if (res.ok) {
        const propuesta = await res.json();
        startTransition(() => router.push(`/rutina/propuesta/${propuesta.id}`));
        setPidiendo(false);
        return;
      }
      setError(await readError(res));
      if (res.status === 409) onConflict?.();
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setPidiendo(false);
  }

  function cancelar() {
    setPreguntando(false);
    setError("");
  }

  return (
    <>
      {!preguntando && !generando && (
        <Button type="button" onClick={abrir}>
          {etiqueta}
        </Button>
      )}

      <AlertDialog
        open={preguntando && !generando}
        onOpenChange={(abierto) => {
          if (!abierto) cancelar();
        }}
      >
        <AlertDialogContent className="sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Generar rutina</AlertDialogTitle>
            <AlertDialogDescription>
              Elegí si querés continuar una rutina o empezar una nueva. La IA propone y vos decidís:
              nada se guarda hasta que aceptes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {rutinas === null && <p>Cargando...</p>}
          {rutinas !== null && rutinas.length > 0 && (
            <fieldset style={{ marginBottom: "1rem" }}>
              <legend>¿Qué querés hacer?</legend>
              {rutinas.map((r) => (
                <label key={r.id} style={{ display: "block" }}>
                  <input
                    type="radio"
                    name="eleccion"
                    checked={eleccion === String(r.id)}
                    onChange={() => setEleccion(String(r.id))}
                  />{" "}
                  Continuar «{r.name}»
                </label>
              ))}
              <label style={{ display: "block" }}>
                <input
                  type="radio"
                  name="eleccion"
                  checked={eleccion === "nueva"}
                  onChange={() => setEleccion("nueva")}
                />{" "}
                Empezar una rutina nueva
              </label>
            </fieldset>
          )}
          {eleccion === "nueva" && (
            <>
              <Opciones titulo="Nivel" nombre="nivel" valor={nivel} opciones={NIVELES} onChange={setNivel} />
              <Opciones
                titulo="Objetivo"
                nombre="objetivo"
                valor={objetivo}
                opciones={OBJETIVOS}
                onChange={setObjetivo}
              />
            </>
          )}
          {error && <p style={{ color: "crimson" }}>{error}</p>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button type="button" onClick={generar} disabled={!listo}>
              Generar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {generando && (
        <p>
          Tu rutina se está generando. Puede tardar hasta 2 minutos.
          <br />
          No cierres esta página.
        </p>
      )}
      {error && !preguntando && <p style={{ color: "crimson" }}>{error}</p>}
    </>
  );
}

function Opciones({
  titulo,
  nombre,
  valor,
  opciones,
  onChange,
}: {
  titulo: string;
  nombre: string;
  valor: string;
  opciones: string[][];
  onChange: (v: string) => void;
}) {
  return (
    <fieldset style={{ marginBottom: "1rem" }}>
      <legend>{titulo}</legend>
      {opciones.map(([v, etiqueta]) => (
        <label key={v} style={{ marginRight: "1rem" }}>
          <input type="radio" name={nombre} checked={valor === v} onChange={() => onChange(v)} />{" "}
          {etiqueta}
        </label>
      ))}
    </fieldset>
  );
}
