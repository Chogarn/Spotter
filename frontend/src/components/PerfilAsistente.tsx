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
  // AAAA-MM-DD, o vacío en un perfil viejo que solo tiene la edad.
  birth_date: string;
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

const MESES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
];

function diasDelMes(mes: number, anio: number): number {
  return new Date(anio, mes, 0).getDate();
}

// Años cumplidos hoy (la misma cuenta que hace el servidor).
function edadHoy(dia: number, mes: number, anio: number): number {
  const hoy = new Date();
  const antes = hoy.getMonth() + 1 < mes || (hoy.getMonth() + 1 === mes && hoy.getDate() < dia);
  return hoy.getFullYear() - anio - (antes ? 1 : 0);
}

// La fecha de partida de las ruedas: la guardada; si el perfil solo tiene la edad, esa edad
// a mitad de año (la persona la corrige); si no hay nada, 30 años atrás.
function fechaInicial(inicial?: DatosPerfil): { dia: number; mes: number; anio: number } {
  const anioHoy = new Date().getFullYear();
  const guardada = inicial?.birth_date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (guardada) return { anio: Number(guardada[1]), mes: Number(guardada[2]), dia: Number(guardada[3]) };
  const edad = Number(inicial?.age) || 30;
  return { anio: anioHoy - edad, mes: 6, dia: 15 };
}

const TITULOS: Record<PasoPerfil, string> = {
  nombre: "¿Cómo te llamás?",
  edad: "¿Cuándo naciste?",
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
  const [fecha, setFecha] = useState(() => fechaInicial(inicial));
  const [peso, setPeso] = useState(() => Number(inicial?.weight_kg) || 70);
  const [altura, setAltura] = useState(() => Number(inicial?.height_cm) || 170);
  const [sexo, setSexo] = useState(inicial?.sex ?? "");
  const [limitaciones, setLimitaciones] = useState(inicial?.limitations ?? "");
  const [acepta, setAcepta] = useState(inicial?.accept_legal_notice ?? false);

  // Si el mes elegido tiene menos días (31 de enero y se pasa a febrero), el día se ajusta.
  const dias = diasDelMes(fecha.mes, fecha.anio);
  const dia = Math.min(fecha.dia, dias);
  const edad = edadHoy(dia, fecha.mes, fecha.anio);
  const edadValida = edad >= 14 && edad <= 100;
  const fechaIso = `${fecha.anio}-${String(fecha.mes).padStart(2, "0")}-${String(dia).padStart(2, "0")}`;
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
      birth_date: fechaIso,
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
      deshabilitado={(paso === "nombre" && !nombreLimpio) || (paso === "edad" && !edadValida) || (paso === "sexo" && !sexo) || (paso === "aviso" && !acepta)}
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
        <div>
          <div className="grid grid-cols-[1fr_1.6fr_1.2fr] gap-2">
            <RuedaNumero compacta valor={dia} min={1} max={dias} unidad="" etiqueta="el día"
              onChange={(v) => setFecha((f) => ({ ...f, dia: v }))} />
            <RuedaNumero compacta valor={fecha.mes} min={1} max={12} unidad="" etiqueta="el mes"
              formato={(n) => MESES[n - 1]} onChange={(v) => setFecha((f) => ({ ...f, mes: v }))} />
            <RuedaNumero compacta valor={fecha.anio} min={new Date().getFullYear() - 100}
              max={new Date().getFullYear() - 14} unidad="" etiqueta="el año"
              onChange={(v) => setFecha((f) => ({ ...f, anio: v }))} />
          </div>
          <p className="mt-4 mb-0 text-center text-lg" role="status">
            {edadValida ? (
              <>Tenés <b className="font-heading text-2xl">{edad}</b> años</>
            ) : (
              "Tenés que tener entre 14 y 100 años"
            )}
          </p>
        </div>
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
