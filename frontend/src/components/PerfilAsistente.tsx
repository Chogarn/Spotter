"use client";

import { useState } from "react";

import { GrupoOpciones, OpcionAsistente, PasoAsistente, ReglaNumero } from "@/components/Asistente";
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

const SEXOS = [
  ["masculino", "Masculino"],
  ["femenino", "Femenino"],
  ["otro", "Otro"],
  ["", "Prefiero no indicarlo"],
];

const PASOS = ["nombre", "edad", "peso", "altura", "sexo", "limitaciones", "aviso"] as const;

// Perfil de un usuario nuevo: una pregunta por pantalla. Editar el perfil después se sigue
// haciendo con el lápiz de cada tarjeta. `enviar` guarda y devuelve si salió bien.
export function PerfilAsistente({
  nombreInicial,
  enviar,
  guardando,
  error,
}: {
  nombreInicial: string;
  enviar: (datos: DatosPerfil) => Promise<boolean>;
  guardando: boolean;
  error: string;
}) {
  const [indice, setIndice] = useState(0);
  // Lo que escribió la persona; mientras no escriba, vale el nombre de la cuenta (que llega tarde).
  const [escrito, setEscrito] = useState<string | null>(null);
  const nombre = escrito ?? nombreInicial;
  // Valores de partida de las reglas: hay que confirmarlos con "Continuar".
  const [edad, setEdad] = useState(30);
  const [peso, setPeso] = useState(70);
  const [altura, setAltura] = useState(170);
  const [sexo, setSexo] = useState("");
  const [limitaciones, setLimitaciones] = useState("");
  const [acepta, setAcepta] = useState(false);

  const paso = PASOS[indice];
  const ultimo = indice === PASOS.length - 1;
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

  const titulos: Record<(typeof PASOS)[number], string> = {
    nombre: "¿Cómo te llamás?",
    edad: "¿Cuántos años tenés?",
    peso: "¿Cuánto pesás?",
    altura: "¿Cuánto medís?",
    sexo: "¿Cuál es tu sexo?",
    limitaciones: "¿Tenés alguna lesión o limitación?",
    aviso: "Antes de empezar",
  };

  return (
    <PasoAsistente
      paso={indice + 1}
      total={PASOS.length}
      titulo={titulos[paso]}
      ayuda={
        paso === "sexo"
          ? "Es opcional."
          : paso === "limitaciones"
            ? "Es opcional. La IA lo tiene en cuenta al armar tu semana."
            : undefined
      }
      onAtras={indice > 0 ? () => setIndice(indice - 1) : undefined}
      onContinuar={siguiente}
      continuar={ultimo ? (guardando ? "Guardando..." : "Terminar") : paso === "limitaciones" && !limitaciones.trim() ? "Saltar" : "Continuar"}
      deshabilitado={(paso === "nombre" && !nombreLimpio) || (paso === "aviso" && !acepta)}
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
        <ReglaNumero valor={edad} min={14} max={100} paso={1} unidad="años" etiqueta="la edad"
          cadaCuantas={5} onChange={setEdad} />
      )}
      {paso === "peso" && (
        <ReglaNumero valor={peso} min={30} max={300} paso={0.5} unidad="kg" etiqueta="el peso"
          cadaCuantas={2} onChange={setPeso} />
      )}
      {paso === "altura" && (
        <ReglaNumero valor={altura} min={100} max={250} paso={1} unidad="cm" etiqueta="la altura"
          cadaCuantas={5} onChange={setAltura} />
      )}
      {paso === "sexo" && (
        <GrupoOpciones etiqueta="Sexo">
          {SEXOS.map(([valor, texto]) => (
            <OpcionAsistente key={valor} titulo={texto} seleccionada={sexo === valor}
              onElegir={() => setSexo(valor)} />
          ))}
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
