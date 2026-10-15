"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { readError, type Routine, apiFetch } from "@/lib/api";
import { GrupoOpciones, OpcionAsistente, PasoAsistente } from "@/components/Asistente";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { IconoNivel } from "@/components/IconoNivel";
import { IconoObjetivo } from "@/components/IconoObjetivo";

type Paso = "eleccion" | "objetivo" | "nivel" | "dias";
const TITULOS: Record<Paso, string> = {
  eleccion: "¿Qué querés hacer?",
  objetivo: "¿Cuál es tu objetivo?",
  nivel: "¿Cuál es tu nivel?",
  dias: "¿Cuántos días por semana?",
};

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
  disparador,
}: {
  etiqueta: string;
  onConflict?: () => void;
  soloNueva?: boolean;
  continuar?: number;
  variante?: "default" | "outline";
  // Dibuja otro disparador (una tarjeta, por ejemplo) en lugar del botón; recibe la función que abre.
  disparador?: (abrir: () => void) => React.ReactNode;
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
  const [paso, setPaso] = useState<Paso>("eleccion");
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
  // Los pasos del asistente dependen de lo elegido: si hay rutinas, primero se elige cuál; una
  // rutina nueva suma objetivo y nivel; los días van al final porque dependen del nivel.
  const hayEleccion = !soloNueva && !continuando && rutinas !== null && rutinas.length > 0;
  const pasos: Paso[] = [
    ...(hayEleccion ? (["eleccion"] as const) : []),
    ...(eleccion === "nueva" ? (["objetivo", "nivel"] as const) : []),
    "dias",
  ];
  const actual = pasos.includes(paso) ? paso : pasos[0];
  const indice = pasos.indexOf(actual);
  const ultimo = actual === "dias";
  const pasoListo =
    actual === "eleccion"
      ? eleccion !== ""
      : actual === "objetivo"
        ? objetivo !== ""
        : actual === "nivel"
          ? nivel !== ""
          : dias !== null && Boolean(nivelActual);

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
    setPaso("eleccion");
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
      {!preguntando && !generando &&
        (disparador ? (
          disparador(abrir)
        ) : (
          <Button type="button" variant={variante} onClick={abrir}>
            {etiqueta}
          </Button>
        ))}

      {/* Un asistente: una pregunta por pantalla. Los pasos dependen de lo que se eligió. */}
      {preguntando && !generando && rutinas === null && (
        <div role="status" className="fixed inset-0 z-[90] flex items-center justify-center bg-background">
          Cargando...
        </div>
      )}
      {preguntando && !generando && rutinas !== null && (
        <PasoAsistente
          paso={indice + 1}
          total={pasos.length}
          titulo={TITULOS[actual]}
          ayuda={
            actual === "dias" && nivelActual === "principiante"
              ? "Para empezar, 2 o 3 días."
              : actual === "dias" && continuando && rutinaElegida
                ? `Continuás «${rutinaElegida.name}».`
                : undefined
          }
          onAtras={indice > 0 ? () => setPaso(pasos[indice - 1]) : cancelar}
          etiquetaAtras={indice > 0 ? "Volver" : "Cancelar"}
          onCancelar={cancelar}
          onContinuar={ultimo ? generar : () => setPaso(pasos[indice + 1])}
          continuar={ultimo ? "Generar rutina" : "Continuar"}
          deshabilitado={!pasoListo}
          error={error}
          nota={ultimo ? "La IA propone y vos decidís: nada se guarda hasta que aceptes." : undefined}
        >
          {actual === "eleccion" && (
            <GrupoOpciones etiqueta="¿Qué querés hacer?">
              {rutinas.map((r) => (
                <OpcionAsistente key={r.id} titulo={`Continuar «${r.name}»`}
                  seleccionada={eleccion === String(r.id)} onElegir={() => elegir(String(r.id))} />
              ))}
              <OpcionAsistente titulo="Empezar una rutina nueva" seleccionada={eleccion === "nueva"}
                onElegir={() => elegir("nueva")} />
            </GrupoOpciones>
          )}
          {actual === "objetivo" && (
            <GrupoOpciones etiqueta="Objetivo">
              {OBJETIVOS.map(([valor, etiqueta]) => (
                <OpcionAsistente key={valor} titulo={etiqueta} seleccionada={objetivo === valor}
                  icono={<IconoObjetivo objetivo={valor} tamano="md" />} onElegir={() => setObjetivo(valor)} />
              ))}
            </GrupoOpciones>
          )}
          {actual === "nivel" && (
            <GrupoOpciones etiqueta="Nivel">
              {NIVELES.map(([valor, etiqueta]) => (
                <OpcionAsistente key={valor} titulo={etiqueta} seleccionada={nivel === valor}
                  icono={<IconoNivel nivel={valor} />} onElegir={() => cambiarNivel(valor)} />
              ))}
            </GrupoOpciones>
          )}
          {actual === "dias" && (
            <div role="radiogroup" aria-label="Días por semana" className="grid grid-cols-3 gap-3">
              {[2, 3, 4, 5, 6].map((d) => {
                const permitido = diasPermitidos(nivelActual).includes(d);
                return (
                  <button
                    key={d}
                    type="button"
                    role="radio"
                    aria-checked={dias === d}
                    disabled={!permitido}
                    onClick={() => setDias(d)}
                    className={
                      "rounded-2xl border-2 py-5 font-heading text-4xl font-bold outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-35 " +
                      (dias === d ? "border-disco-azul bg-disco-azul text-white" : "border-transparent bg-card")
                    }
                  >
                    {d}
                  </button>
                );
              })}
            </div>
          )}
        </PasoAsistente>
      )}

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
