"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { readError, type Routine, apiFetch } from "@/lib/api";
import { GrupoOpciones, OpcionAsistente, PasoAsistente, RuedaNumero } from "@/components/Asistente";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { FraseDeCarga } from "@/components/FraseDeCarga";
import { IconoNivel } from "@/components/IconoNivel";
import { IconoObjetivo } from "@/components/IconoObjetivo";

type Paso = "eleccion" | "objetivo" | "nivel" | "tiempo" | "dias" | "split";
type Split = "full_body" | "upper_lower" | "ppl";
const TITULOS: Record<Paso, string> = {
  eleccion: "¿Qué querés hacer?",
  objetivo: "¿Cuál es tu objetivo?",
  nivel: "¿Cuál es tu nivel?",
  tiempo: "¿Cuánto querés que dure cada sesión?",
  dias: "¿Cuántos días por semana?",
  split: "¿Cómo querés repartir tus entrenamientos?",
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

function splitsPermitidos(nivel: string, objetivo: string, dias: number | null): Split[] {
  if (dias === null) return [];
  if (nivel === "principiante") return dias === 2 || dias === 3 ? ["full_body"] : [];
  const opciones: Split[] = ["full_body"];
  // Con tres días, torso/pierna deja un grupo grande en una sola sesión (decisión 90).
  // Con dos días de masa, el mínimo de R3 no cabe en el máximo de 9 series por grupo y día.
  if ([2, 4, 5, 6].includes(dias) && !(dias === 2 && objetivo === "masa")) opciones.push("upper_lower");
  // PPL clásico solo en dos vueltas; PPL de tres días contradice la frecuencia de la decisión 90.
  if (dias === 6) opciones.push("ppl");
  return opciones;
}

function splitPredeterminado(dias: number | null, nivel: string, objetivo: string): Split | "" {
  const disponibles = splitsPermitidos(nivel, objetivo, dias);
  const preferido: Split = dias === 4 || dias === 5 ? "upper_lower" : dias === 6 ? "ppl" : "full_body";
  return disponibles.includes(preferido) ? preferido : disponibles[0] ?? "";
}

const SPLIT_ETIQUETAS: Record<Split, { titulo: string; detalle: string }> = {
  full_body: { titulo: "Cuerpo completo", detalle: "Trabajás los seis grupos grandes en cada día." },
  upper_lower: { titulo: "Torso y pierna", detalle: "Alternás un día de pecho, espalda y hombros con uno de piernas." },
  ppl: { titulo: "Empuje, tirón y piernas", detalle: "Empuje: pecho y hombros · tirón: espalda · piernas. Con 6 días, hacés dos vueltas." },
};

function ayudaCompatibilidad(nivel: string, objetivo: string, dias: number | null): string {
  if (dias === null) return "Al elegir los días te mostramos las estructuras que se pueden usar.";
  if (nivel === "principiante") return "Para nivel principiante, Spotter ofrece Cuerpo completo con 2 o 3 días.";
  if (dias === 3) return "Con 3 días, solo aparece Cuerpo completo: así cada grupo grande puede repetirse durante la semana.";
  if (dias === 2 && objetivo === "masa") return "Con 2 días y objetivo masa, solo aparece Cuerpo completo: Torso/Piernas dejaría demasiado volumen de un grupo para un solo día.";
  if (dias === 6) return "Con 6 días podés elegir Cuerpo completo, Torso/Piernas o dos vueltas de Empuje/Tirón/Piernas.";
  return `Con ${dias} días podés elegir Cuerpo completo o Torso/Piernas. PPL requiere 6 días para completar dos vueltas.`;
}

// Los minutos por sesión (decisión 82), de 20 en 20 desde 40: hasta 60 para un principiante (R18),
// 80 para el resto (por ahora, decisión 88). El backend vuelve a comprobarlo.
// Por ahora no se pide (decisión 90): la IA decide la duración y el reparto de las series manda. El
// paso y todo lo demás quedan guardados; para volver a pedirlo alcanza con poner esto en `true`.
const PEDIR_TIEMPO = false;
const MINUTOS_MIN = 40;
const MINUTOS_PASO = 20;
const MINUTOS_HABITUAL = 60;
function minutosMaximo(nivel: string): number {
  return nivel === "principiante" ? 60 : 80;
}
// Un valor de una rutina vieja (por ejemplo 45) se lleva al más cercano de los que hay ahora.
function minutosValidos(minutos: number, nivel: string): number {
  const tope = Math.floor((minutosMaximo(nivel) - MINUTOS_MIN) / MINUTOS_PASO);
  const lugar = Math.round((minutos - MINUTOS_MIN) / MINUTOS_PASO);
  return MINUTOS_MIN + Math.min(tope, Math.max(0, lugar)) * MINUTOS_PASO;
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
  const [split, setSplit] = useState<Split | "">("");
  // Cuánto dura cada sesión: arranca en lo habitual (60) y al continuar viene el de la rutina.
  const [minutos, setMinutos] = useState(MINUTOS_HABITUAL);
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
  const objetivoActual = eleccion === "nueva" ? objetivo : (rutinaElegida?.goal ?? "");
  // Los pasos del asistente dependen de lo elegido: si hay rutinas, primero se elige cuál; una
  // rutina nueva suma objetivo y nivel; los días van al final porque dependen del nivel.
  const hayEleccion = !soloNueva && !continuando && rutinas !== null && rutinas.length > 0;
  const pasos: Paso[] = [
    ...(hayEleccion ? (["eleccion"] as const) : []),
    ...(eleccion === "nueva" ? (["objetivo", "nivel"] as const) : []),
    ...(PEDIR_TIEMPO ? (["tiempo"] as const) : []),
    "dias",
    "split",
  ];
  const actual = pasos.includes(paso) ? paso : pasos[0];
  const indice = pasos.indexOf(actual);
  const ultimo = actual === "split";
  const pasoListo =
    actual === "eleccion"
      ? eleccion !== ""
      : actual === "objetivo"
        ? objetivo !== ""
        : actual === "nivel"
          ? nivel !== ""
          : actual === "tiempo"
            ? Boolean(nivelActual)
            : actual === "dias"
              ? dias !== null && Boolean(nivelActual)
              : split !== "";

  function elegir(valor: string) {
    setEleccion(valor);
    const rutina = rutinas?.find((r) => String(r.id) === valor);
    setDias(rutina?.days_per_week ?? null);
    setMinutos(minutosValidos(rutina?.session_minutes ?? MINUTOS_HABITUAL, rutina?.level ?? ""));
    setSplit(rutina?.split_type ?? splitPredeterminado(rutina?.days_per_week ?? null, rutina?.level ?? "", rutina?.goal ?? ""));
  }

  function cambiarNivel(valor: string) {
    setNivel(valor);
    // Lo mismo con el tiempo: un principiante no pasa de 60.
    setMinutos(minutosValidos(minutos, valor));
    // Si los días elegidos no entran en el nivel nuevo (por ejemplo 4 para un principiante), se borran.
    if (dias !== null && !diasPermitidos(valor).includes(dias)) setDias(null);
    else setSplit(splitPredeterminado(dias, valor, objetivoActual));
  }

  function elegirDias(valor: number) {
    setDias(valor);
    const disponibles = splitsPermitidos(nivelActual, objetivoActual, valor);
    setSplit((actual) => disponibles.includes(actual as Split)
      ? actual
      : splitPredeterminado(valor, nivelActual, objetivoActual));
  }

  async function abrir() {
    setError("");
    setPreguntando(true);
    setPaso("eleccion");
    setEleccion("");
    setObjetivo("");
    setNivel("");
    setDias(null);
    setSplit("");
    setMinutos(MINUTOS_HABITUAL);
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
        setMinutos(minutosValidos(rutina.session_minutes ?? MINUTOS_HABITUAL, rutina.level));
        setSplit(rutina.split_type ?? splitPredeterminado(rutina.days_per_week ?? null, rutina.level, rutina.goal));
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
            ? { goal: objetivo, level: nivel, days: dias, split, ...(PEDIR_TIEMPO ? { minutes: minutos } : {}) }
            : { routine_id: Number(eleccion), days: dias, split, ...(PEDIR_TIEMPO ? { minutes: minutos } : {}) },
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
          <Button type="button" size="xl" variant={variante} className="w-full" onClick={abrir}>
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
            actual === "tiempo"
              ? nivelActual === "principiante"
                ? "Para empezar, hasta 60 minutos. Es el tiempo total, con descansos."
                : "Lo habitual son 60 minutos. Es el tiempo total, con descansos."
              : actual === "dias" && nivelActual === "principiante"
                ? "Para empezar, 2 o 3 días."
                : actual === "split"
                  ? ayudaCompatibilidad(nivelActual, objetivoActual, dias)
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
          {actual === "tiempo" && nivelActual && (
            <RuedaNumero valor={minutosValidos(minutos, nivelActual)} min={MINUTOS_MIN}
              max={minutosMaximo(nivelActual)} paso={MINUTOS_PASO} unidad="min" etiqueta="los minutos de cada sesión"
              onChange={setMinutos} />
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
                    onClick={() => elegirDias(d)}
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
          {actual === "split" && (
            <GrupoOpciones etiqueta="Estructura de la semana">
              {splitsPermitidos(nivelActual, objetivoActual, dias).map((opcion) => (
                <OpcionAsistente
                  key={opcion}
                  titulo={SPLIT_ETIQUETAS[opcion].titulo}
                  detalle={SPLIT_ETIQUETAS[opcion].detalle}
                  seleccionada={split === opcion}
                  onElegir={() => setSplit(opcion)}
                />
              ))}
            </GrupoOpciones>
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
          {/* La frase va arriba del disco y con otro estilo (cursiva y gris), para que no parezca parte del disco. */}
          <FraseDeCarga />
          <div className="relative size-24" aria-hidden="true">
            <div className="absolute inset-0 animate-[spin_1.1s_linear_infinite] rounded-full border-8 border-border border-t-disco-rojo motion-reduce:animate-none" />
            <div className="absolute inset-[26px] rounded-full bg-disco-tinta" />
            <div className="absolute inset-[42px] rounded-full bg-background" />
          </div>
          <h2 className="mt-6 mb-0 text-3xl">Armando tu semana</h2>
          {/* La leyenda del tiempo, fija abajo. */}
          <p className="absolute inset-x-0 bottom-0 m-0 px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-sm text-muted-foreground">
            La IA está pensando tu rutina. Puede tardar hasta 2 minutos. No cierres esta página.
          </p>
        </div>
      )}
      {error && !preguntando && <ErrorMessage>{error}</ErrorMessage>}
    </>
  );
}
