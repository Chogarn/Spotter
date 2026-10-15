"use client";

import { Mars, Venus, VenusAndMars, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { GrupoOpciones, OpcionAsistente, PasoAsistente, ReglaNumero, RuedaNumero } from "@/components/Asistente";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Los datos del perfil tal como los guarda la pantalla de Perfil.
export type DatosPerfil = {
  name: string;
  age: string;
  weight_kg: string;
  height_cm: string;
  sex: string;
  limitations: string;
  accept_legal_notice: boolean;
};

export const SEXOS = [
  ["masculino", "Masculino"],
  ["femenino", "Femenino"],
  ["otro", "Otro"],
];

// Un dibujo por opción, sobre el mismo disco oscuro que el de los objetivos.
const ICONOS_SEXO: Record<string, LucideIcon> = {
  masculino: Mars,
  femenino: Venus,
  otro: VenusAndMars,
};

export type PasoPerfil = "nombre" | "edad" | "peso" | "altura" | "sexo" | "limitaciones" | "aviso";
export const TODOS_LOS_PASOS: PasoPerfil[] = ["nombre", "edad", "peso", "altura", "sexo", "limitaciones", "aviso"];

const TITULOS: Record<PasoPerfil, string> = {
  nombre: "¿Cómo te llamás?",
  edad: "¿Cuántos años tenés?",
  peso: "¿Cuánto pesás?",
  altura: "¿Cuánto medís?",
  sexo: "¿Cuál es tu sexo?",
  limitaciones: "¿Tenés alguna lesión o limitación?",
  aviso: "Antes de empezar",
};

// Una pregunta por pantalla. Sin `inicial` es el perfil de un usuario nuevo (todos los pasos, con
// el aviso legal al final); con `inicial` y `pasos` es la edición de una tarjeta del perfil, con
// el dato actual ya puesto, y `onCancelar` vuelve sin guardar. `enviar` guarda y devuelve si salió bien.
export function PerfilAsistente({
  nombreInicial,
  inicial,
  pasos = TODOS_LOS_PASOS,
  enviar,
  guardando,
  error,
  onCancelar,
}: {
  nombreInicial: string;
  inicial?: DatosPerfil;
  pasos?: PasoPerfil[];
  enviar: (datos: DatosPerfil) => Promise<boolean>;
  guardando: boolean;
  error: string;
  onCancelar?: () => void;
}) {
  const editando = inicial !== undefined;
  const [indice, setIndice] = useState(0);
  // Lo que escribió la persona; mientras no escriba, vale el nombre guardado o el de la cuenta
  // (que llega tarde).
  const [escrito, setEscrito] = useState<string | null>(null);
  const nombre = escrito ?? (inicial?.name || nombreInicial);
  // Valores de partida de las reglas (los guardados al editar): hay que confirmarlos con "Continuar".
  const [edad, setEdad] = useState(() => Number(inicial?.age) || 30);
  const [peso, setPeso] = useState(() => Number(inicial?.weight_kg) || 70);
  const [altura, setAltura] = useState(() => Number(inicial?.height_cm) || 170);
  const [sexo, setSexo] = useState(inicial?.sex ?? "");
  const [limitaciones, setLimitaciones] = useState(inicial?.limitations ?? "");
  const [acepta, setAcepta] = useState(inicial?.accept_legal_notice ?? false);

  const paso = pasos[indice];
  const ultimo = indice === pasos.length - 1;
  const nombreLimpio = nombre.trim();

  function siguiente() {
    if (!ultimo) {
      setIndice(indice + 1);
      return;
    }
    void enviar({
      name: nombreLimpio,
      age: String(edad),
      weight_kg: String(peso),
      height_cm: String(altura),
      sex: sexo,
      limitations: limitaciones.trim(),
      accept_legal_notice: acepta,
    });
  }

  const etiquetaFinal = guardando ? "Guardando..." : editando ? "Guardar" : "Terminar";

  return (
    <PasoAsistente
      paso={indice + 1}
      total={pasos.length}
      titulo={TITULOS[paso]}
      ayuda={
        paso === "limitaciones"
            ? "Es opcional. La IA lo tiene en cuenta al armar tu semana."
            : undefined
      }
      onAtras={indice > 0 ? () => setIndice(indice - 1) : onCancelar}
      etiquetaAtras={indice > 0 ? "Volver" : "Cancelar"}
      onContinuar={siguiente}
      continuar={
        ultimo
          ? etiquetaFinal
          : paso === "limitaciones" && !limitaciones.trim()
            ? "Saltar"
            : "Continuar"
      }
      deshabilitado={(paso === "nombre" && !nombreLimpio) || (paso === "sexo" && !sexo) || (paso === "aviso" && !acepta)}
      ocupado={guardando}
      error={ultimo ? error : undefined}
      nota="Tus datos son privados y están protegidos."
    >
      {paso === "nombre" && (
        <Input
          aria-label="Nombre"
          autoFocus
          maxLength={100}
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setEscrito(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && nombreLimpio && siguiente()}
          className="h-14 rounded-xl bg-card px-4 text-center font-heading text-3xl font-bold"
        />
      )}
      {paso === "edad" && (
        <RuedaNumero valor={edad} min={14} max={100} unidad="años" etiqueta="la edad" onChange={setEdad} />
      )}
      {paso === "peso" && (
        <ReglaNumero valor={peso} min={30} max={300} paso={0.5} unidad="kg" etiqueta="el peso"
          cadaCuantas={2} onChange={setPeso} />
      )}
      {paso === "altura" && (
        <ReglaNumero valor={altura} min={100} max={250} paso={1} unidad="cm" etiqueta="la altura"
          cadaCuantas={5} vertical onChange={setAltura} />
      )}
      {paso === "sexo" && (
        <GrupoOpciones etiqueta="Sexo">
          {SEXOS.map(([valor, texto]) => {
            const Icono = ICONOS_SEXO[valor];
            return (
              <OpcionAsistente
                key={valor}
                titulo={texto}
                seleccionada={sexo === valor}
                icono={
                  <span
                    aria-hidden="true"
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-disco-tinta text-white"
                  >
                    <Icono className="size-6" />
                  </span>
                }
                onElegir={() => setSexo(valor)}
              />
            );
          })}
        </GrupoOpciones>
      )}
      {paso === "limitaciones" && (
        <Textarea
          aria-label="Lesiones o limitaciones"
          rows={5}
          maxLength={1000}
          value={limitaciones}
          onChange={(e) => setLimitaciones(e.target.value)}
          placeholder="Por ejemplo: me molesta la rodilla derecha en la sentadilla profunda"
          className="rounded-xl bg-card text-base"
        />
      )}
      {paso === "aviso" && (
        <div className="flex items-start gap-3 rounded-2xl bg-card p-4">
          <Checkbox id="aviso-legal" checked={acepta} onCheckedChange={(v) => setAcepta(v === true)}
            className="mt-0.5" />
          <Label htmlFor="aviso-legal" className="leading-snug font-normal">
            Entiendo que la app no da consejo médico.
          </Label>
        </div>
      )}
    </PasoAsistente>
  );
}
