"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { readError, type Routine, apiFetch } from "@/lib/api";
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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ErrorMessage } from "@/components/ErrorMessage";
import { IconoObjetivo } from "@/components/IconoObjetivo";

const NIVELES = [
  ["principiante", "principiante"],
  ["intermedio", "intermedio"],
  ["avanzado", "avanzado"],
];
// Los días por semana que se pueden elegir (decisión 52): R12 para principiantes (2 o 3) y R11
// para el resto (2 a 6). El backend vuelve a comprobarlo.
function diasPermitidos(nivel: string): number[] {
  return nivel === "principiante" ? [2, 3] : [2, 3, 4, 5, 6];
}

const OBJETIVOS = [
  ["masa", "masa"],
  ["fuerza", "fuerza"],
  ["perder_grasa", "perder grasa"],
  ["condicion_general", "condición general"],
  ["mantenerme_activo", "mantenerme activo"],
];

// Botón que, antes de llamar a la IA, pregunta qué hacer (continuar una rutina o empezar una
// nueva con su nivel y objetivo), con Cancelar. `onConflict` avisa a la pantalla si el servidor
// dice que ya hay una semana activa. Con `soloNueva` (desde Rutinas) va directo a una rutina nueva:
// sin la opción de continuar. Con `continuar` (id de una rutina; Entrenar después de cerrar una
// semana) va directo a la semana siguiente de esa rutina: solo confirma los días por semana.
export function GenerarRutina({
  etiqueta,
  onConflict,
  soloNueva = false,
  continuar,
  variante = "default",
}: {
  etiqueta: string;
  onConflict?: () => void;
  soloNueva?: boolean;
  continuar?: number;
  variante?: "default" | "outline";
}) {
  const router = useRouter();
  const [preguntando, setPreguntando] = useState(false);
  // Rutinas que se pueden continuar (null = cargando). `eleccion`: id de una rutina o "nueva".
  const [rutinas, setRutinas] = useState<Routine[] | null>(null);
  const [eleccion, setEleccion] = useState("");
  const [nivel, setNivel] = useState("");
  const [objetivo, setObjetivo] = useState("");
  // Cuántos días por semana: obligatorio. Al continuar, viene la cantidad actual de la rutina.
  const [dias, setDias] = useState<number | null>(null);
  const [error, setError] = useState("");
  // `pidiendo`: esperando a la IA. `navegando`: abriendo la propuesta; se apaga solo cuando la
  // nueva página está lista (así esta pantalla no queda "generando" al volver a ella).
  const [pidiendo, setPidiendo] = useState(false);
  const [navegando, startTransition] = useTransition();
  const generando = pidiendo || navegando;

  // Mientras la IA trabaja, el navegador avisa antes de recargar o cerrar la pestaña: se perdería
  // la espera (y la generación ya gastó cuota de la IA).
  useEffect(() => {
    if (!generando) return;
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", avisar);
    return () => window.removeEventListener("beforeunload", avisar);
  }, [generando]);

  // El nivel que manda en los días: el elegido (rutina nueva) o el de la rutina que se continúa.
  const rutinaElegida = rutinas?.find((r) => String(r.id) === eleccion);
  const continuando = continuar !== undefined;
  const nivelActual = eleccion === "nueva" ? nivel : (rutinaElegida?.level ?? "");
  const listo =
    (eleccion === "nueva" ? Boolean(nivel && objetivo) : eleccion !== "") &&
    dias !== null &&
    Boolean(nivelActual);

  function elegir(valor: string) {
    setEleccion(valor);
    const rutina = rutinas?.find((r) => String(r.id) === valor);
    setDias(rutina?.days_per_week ?? null);
  }

  function cambiarNivel(valor: string) {
    setNivel(valor);
    // Si los días elegidos no entran en el nivel nuevo (por ejemplo 4 para un principiante), se borran.
    if (dias !== null && !diasPermitidos(valor).includes(dias)) setDias(null);
  }

  async function abrir() {
    setError("");
    setPreguntando(true);
    setEleccion("");
    setDias(null);
    setRutinas(null);
    if (soloNueva) {
      setRutinas([]);
      setEleccion("nueva");
      return;
    }
    try {
      const res = await apiFetch(`/routines`);
      if (!res.ok) throw new Error(await readError(res));
      const lista: Routine[] = await res.json();
      setRutinas(lista);
      if (continuar !== undefined) {
        const rutina = lista.find((r) => r.id === continuar);
        if (!rutina) throw new Error("No se encontró la rutina para continuar");
        setEleccion(String(rutina.id));
        setDias(rutina.days_per_week ?? null);
      } else if (lista.length === 0) {
        setEleccion("nueva"); // sin rutinas no hay nada que continuar
      }
    } catch (e) {
      setPreguntando(false);
      setError(e instanceof Error ? e.message : "No se pudo conectar con el servidor");
    }
  }

  async function generar() {
    setError("");
    setPidiendo(true);
    try {
      const res = await apiFetch(`/proposals/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          eleccion === "nueva"
            ? { goal: objetivo, level: nivel, days: dias }
            : { routine_id: Number(eleccion), days: dias },
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
        <Button type="button" variant={variante} onClick={abrir}>
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
            <AlertDialogTitle>
              {soloNueva ? "Nueva rutina" : continuando ? "Generar la semana siguiente" : "Generar rutina"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {soloNueva
                ? "Elegí tu nivel y tu objetivo."
                : continuando
                  ? "La IA mira lo que hiciste y propone la semana siguiente."
                  : "Elegí si querés continuar una rutina o empezar una nueva."}{" "}
              La IA propone y vos decidís: nada se guarda hasta que aceptes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {rutinas === null && <p>Cargando...</p>}
          {continuando && rutinaElegida && (
            <p className="m-0 font-medium">Continuás «{rutinaElegida.name}»</p>
          )}
          {rutinas !== null && rutinas.length > 0 && !continuando && (
            <fieldset>
              <legend>¿Qué querés hacer?</legend>
              <RadioGroup value={eleccion} onValueChange={(v) => elegir(String(v))}>
                {rutinas.map((r) => (
                  <Label key={r.id} className="gap-2">
                    <RadioGroupItem value={String(r.id)} />
                    Continuar «{r.name}»
                  </Label>
                ))}
                <Label className="gap-2">
                  <RadioGroupItem value="nueva" />
                  Empezar una rutina nueva
                </Label>
              </RadioGroup>
            </fieldset>
          )}
          {eleccion === "nueva" && (
            <>
              <Opciones titulo="Nivel" nombre="nivel" valor={nivel} opciones={NIVELES} onChange={cambiarNivel} />
              <Opciones
                titulo="Objetivo"
                nombre="objetivo"
                valor={objetivo}
                opciones={OBJETIVOS}
                onChange={setObjetivo}
                conIcono
              />
            </>
          )}
          {nivelActual && (
            <fieldset className="border-0 p-0">
              <legend className="mb-1.5 text-sm font-medium">¿Cuántos días por semana querés entrenar?</legend>
              <div className="flex gap-2">
                {diasPermitidos(nivelActual).map((d) => (
                  <label
                    key={d}
                    className={
                      "flex size-11 cursor-pointer items-center justify-center rounded-full border-2 font-heading text-xl font-bold has-focus-visible:ring-3 has-focus-visible:ring-ring/50 " +
                      (dias === d ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card")
                    }
                  >
                    <input
                      type="radio"
                      name="dias"
                      value={d}
                      checked={dias === d}
                      onChange={() => setDias(d)}
                      className="sr-only"
                    />
                    {d}
                  </label>
                ))}
              </div>
              {nivelActual === "principiante" && (
                <p className="mt-1.5 mb-0 text-xs text-muted-foreground">Para empezar, 2 o 3 días.</p>
              )}
            </fieldset>
          )}
          {error && <ErrorMessage>{error}</ErrorMessage>}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <Button type="button" onClick={generar} disabled={!listo}>
              Generar
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Mientras se genera, una pantalla completa que tapa todo (también la barra de abajo): no
          hay nada que tocar, así no se puede salir ni pedir otra generación (decisión 67). */}
      {generando && (
        <div
          role="status"
          aria-live="polite"
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-6 text-center"
        >
          <div className="relative size-24" aria-hidden="true">
            <div className="absolute inset-0 animate-[spin_1.1s_linear_infinite] rounded-full border-8 border-border border-t-disco-rojo motion-reduce:animate-none" />
            <div className="absolute inset-[26px] rounded-full bg-disco-tinta" />
            <div className="absolute inset-[42px] rounded-full bg-background" />
          </div>
          <h2 className="mt-6 mb-1.5 text-3xl">Armando tu semana</h2>
          <p className="m-0 max-w-xs text-muted-foreground">
            La IA está pensando tu rutina. Puede tardar hasta 2 minutos. No cierres esta página.
          </p>
        </div>
      )}
      {error && !preguntando && <ErrorMessage>{error}</ErrorMessage>}
    </>
  );
}

function Opciones({
  titulo,
  nombre,
  valor,
  opciones,
  onChange,
  conIcono = false,
}: {
  titulo: string;
  nombre: string;
  valor: string;
  opciones: string[][];
  onChange: (v: string) => void;
  // Un dibujo al lado de cada opción (solo el objetivo).
  conIcono?: boolean;
}) {
  return (
    <fieldset>
      <legend>{titulo}</legend>
      <RadioGroup name={nombre} value={valor} onValueChange={(v) => onChange(String(v))}>
        {opciones.map(([v, etiqueta]) => (
          <Label key={v} className="gap-2">
            <RadioGroupItem value={v} />
            {conIcono && <IconoObjetivo objetivo={v} tamano="xs" />}
            {etiqueta}
          </Label>
        ))}
      </RadioGroup>
    </fieldset>
  );
}
