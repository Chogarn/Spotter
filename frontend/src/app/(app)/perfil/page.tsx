"use client";

import { Check, LogOut, Minus, Pencil, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { errorText, apiFetch, type SessionUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ErrorMessage } from "@/components/ErrorMessage";
import { cn } from "cn";

type Form = {
  name: string;
  age: string;
  weight_kg: string;
  height_cm: string;
  sex: string;
  limitations: string;
  accept_legal_notice: boolean;
};

const VACIO: Form = {
  name: "",
  age: "",
  weight_kg: "",
  height_cm: "",
  sex: "",
  limitations: "",
  accept_legal_notice: false,
};

const SEXOS = [
  ["masculino", "Masculino"],
  ["femenino", "Femenino"],
  ["otro", "Otro"],
  ["", "Sin indicar"],
];

// Las tarjetas del perfil y qué campos guarda cada una.
type Tarjeta = "nombre" | "cuerpo" | "limitaciones";
const CAMPOS: Record<Tarjeta, (keyof Form)[]> = {
  nombre: ["name"],
  cuerpo: ["age", "weight_kg", "height_cm", "sex"],
  limitaciones: ["limitations"],
};

// Perfil: se ven los datos guardados y cada tarjeta se edita con su lápiz (tilde guarda, cruz
// cancela). Un usuario sin perfil todavía (recién registrado) lo completa todo de una vez.
export default function PerfilPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(VACIO);
  // Lo último guardado: sirve para cancelar y para guardar una tarjeta sin arrastrar las demás.
  const [guardado, setGuardado] = useState<Form | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  const [editando, setEditando] = useState<Tarjeta | null>(null);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    apiFetch(`/auth/me`)
      .then(async (res) => {
        if (res.ok) setUsuario(await res.json());
      })
      .catch(() => {});
  }, []);

  async function cerrarSesion() {
    await apiFetch(`/auth/logout`, { method: "POST" }).catch(() => {});
    router.push("/login");
  }

  useEffect(() => {
    apiFetch(`/profile`)
      .then(async (res) => {
        if (res.status === 404) return; // todavía no hay perfil: se completa todo
        if (!res.ok) throw new Error("No se pudo cargar el perfil");
        const p = await res.json();
        const leido: Form = {
          name: p.name,
          age: String(p.age),
          weight_kg: String(Number(p.weight_kg)),
          height_cm: String(p.height_cm),
          sex: p.sex ?? "",
          limitations: p.limitations ?? "",
          accept_legal_notice: p.legal_notice_accepted,
        };
        setForm(leido);
        setGuardado(leido);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  function cambiar<K extends keyof Form>(campo: K, valor: Form[K]) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function enviar(datos: Form): Promise<boolean> {
    setError("");
    setGuardando(true);
    try {
      const res = await apiFetch(`/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: datos.name,
          age: datos.age === "" ? null : Number(datos.age),
          weight_kg: datos.weight_kg === "" ? null : datos.weight_kg,
          height_cm: datos.height_cm === "" ? null : Number(datos.height_cm),
          sex: datos.sex || null,
          limitations: datos.limitations || null,
          accept_legal_notice: datos.accept_legal_notice,
        }),
      });
      if (!res.ok) {
        setError(errorText((await res.json()).detail));
        return false;
      }
      setGuardado(datos);
      return true;
    } catch {
      setError("No se pudo conectar con el servidor");
      return false;
    } finally {
      setGuardando(false);
    }
  }

  // Guarda solo los campos de una tarjeta: el resto va como estaba guardado.
  async function guardarTarjeta(tarjeta: Tarjeta) {
    if (!guardado) return;
    const datos = { ...guardado };
    for (const campo of CAMPOS[tarjeta]) (datos as Record<string, unknown>)[campo] = form[campo];
    if (await enviar(datos)) {
      setForm(datos);
      setEditando(null);
    }
  }

  function cancelar() {
    if (guardado) setForm(guardado);
    setEditando(null);
    setError("");
  }

  if (cargando) return <main className="mx-auto max-w-xl px-4 pt-8">Cargando...</main>;

  // Sin perfil guardado, todo se completa de una vez.
  const nuevo = guardado === null;
  const edita = (t: Tarjeta) => nuevo || editando === t;
  const nombre = form.name || usuario?.name || "";
  const acciones = (t: Tarjeta) =>
    nuevo ? null : (
      <AccionesTarjeta
        editando={editando === t}
        ocupado={guardando || (editando !== null && editando !== t)}
        etiqueta={t === "nombre" ? "el nombre" : t === "cuerpo" ? "tus datos del cuerpo" : "tus limitaciones"}
        onEditar={() => setEditando(t)}
        onGuardar={() => guardarTarjeta(t)}
        onCancelar={cancelar}
      />
    );

  return (
    <main className="mx-auto max-w-xl px-4 pt-8">
      {/* Encabezado: inicial, nombre grande y correo. */}
      <div className="mb-5 flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-3xl font-bold text-primary-foreground"
        >
          {nombre.trim().charAt(0).toUpperCase() || "?"}
        </span>
        <div className="min-w-0 flex-1">
          {edita("nombre") ? (
            <Input
              id="name"
              aria-label="Nombre"
              autoFocus={!nuevo}
              placeholder="Tu nombre"
              value={form.name}
              onChange={(e) => cambiar("name", e.target.value)}
              className="h-11 font-heading text-2xl font-bold"
            />
          ) : (
            <h1 className="my-0 truncate text-4xl">{nombre || "Tu nombre"}</h1>
          )}
          {usuario && <p className="m-0 truncate text-sm text-muted-foreground">{usuario.email}</p>}
        </div>
        {acciones("nombre")}
      </div>

      {nuevo && (
        <p className="mt-0 mb-4 rounded-2xl border-2 border-disco-amarillo bg-card p-4 text-sm">
          Completá tus datos: la IA los usa para armar tu rutina.
        </p>
      )}

      <section className="mb-3 rounded-2xl bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="my-0 text-xl">Tu cuerpo</h2>
          {acciones("cuerpo")}
        </div>
        {edita("cuerpo") ? (
          <>
            <div className="grid gap-2">
              <Selector etiqueta="Edad" unidad="años" valor={form.age} min={14} max={100} paso={1}
                onChange={(v) => cambiar("age", v)} />
              <Selector etiqueta="Peso" unidad="kg" valor={form.weight_kg} min={30} max={300} paso={0.5} azul
                onChange={(v) => cambiar("weight_kg", v)} />
              <Selector etiqueta="Altura" unidad="cm" valor={form.height_cm} min={100} max={250} paso={1}
                onChange={(v) => cambiar("height_cm", v)} />
            </div>
            <fieldset className="mt-4 border-0 p-0">
              <legend className="mb-1.5 text-sm text-muted-foreground">Sexo (opcional)</legend>
              <div className="flex rounded-full bg-muted p-1">
                {SEXOS.map(([valor, texto]) => (
                  <label
                    key={valor}
                    className={cn(
                      "flex-1 cursor-pointer rounded-full py-1.5 text-center text-sm has-focus-visible:ring-3 has-focus-visible:ring-ring/50",
                      form.sex === valor ? "bg-primary text-primary-foreground" : "text-foreground",
                    )}
                  >
                    <input type="radio" name="sex" value={valor} checked={form.sex === valor}
                      onChange={() => cambiar("sex", valor)} className="sr-only" />
                    {texto}
                  </label>
                ))}
              </div>
            </fieldset>
          </>
        ) : (
          // Los tres números en fila y el sexo debajo, a todo el ancho, con el mismo formato.
          <div className="grid grid-cols-3 gap-2">
            <Dato valor={form.age} unidad="años" />
            <Dato valor={Number(form.weight_kg).toLocaleString("es-AR")} unidad="kg" azul />
            <Dato valor={form.height_cm} unidad="cm" />
            <div className="col-span-3">
              <Dato valor={SEXOS.find(([v]) => v === form.sex)?.[1] ?? "Sin indicar"} unidad="sexo" />
            </div>
          </div>
        )}
      </section>

      <section className="mb-3 rounded-2xl bg-card p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="my-0 text-xl">
            <label htmlFor="limitations">Lesiones o limitaciones</label>
          </h2>
          {acciones("limitaciones")}
        </div>
        <p className="mt-0 mb-2 text-sm text-muted-foreground">La IA las tiene en cuenta al armar tu semana.</p>
        {edita("limitaciones") ? (
          <Textarea
            id="limitations"
            rows={3}
            value={form.limitations}
            onChange={(e) => cambiar("limitations", e.target.value)}
            placeholder="Por ejemplo: me molesta la rodilla derecha en la sentadilla profunda"
          />
        ) : (
          <p className="m-0 whitespace-pre-wrap">{form.limitations || "Ninguna indicada."}</p>
        )}
      </section>

      {/* El aviso médico: una vez aceptado no se puede desmarcar (lo exige el backend). */}
      {nuevo || !form.accept_legal_notice ? (
        <section className="mb-4 flex items-start gap-3 rounded-2xl bg-card p-4">
          <Checkbox
            id="accept_legal_notice"
            checked={form.accept_legal_notice}
            onCheckedChange={(marcado) => cambiar("accept_legal_notice", marcado)}
            className="mt-0.5"
          />
          <Label htmlFor="accept_legal_notice" className="leading-snug font-normal">
            Entiendo que la app no da consejo médico.
          </Label>
        </section>
      ) : (
        <p className="mb-4 flex items-center gap-2 px-1 text-sm text-muted-foreground">
          <Check className="size-4" aria-hidden="true" /> Aceptaste que la app no da consejo médico.
        </p>
      )}

      {nuevo && (
        <Button
          type="button"
          size="lg"
          className="h-12 w-full text-base"
          disabled={guardando}
          onClick={async () => {
            if (await enviar(form)) setForm(form);
          }}
        >
          {guardando ? "Guardando..." : "Guardar"}
        </Button>
      )}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Cerrar sesión vive en el Perfil (decisión 42), separado y en rojo para no tocarlo sin querer. */}
      <div className="mt-6 flex justify-center">
        <Button variant="ghost" type="button" onClick={cerrarSesion} className="text-destructive hover:text-destructive">
          <LogOut aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>
    </main>
  );
}

// Lápiz para editar; editando, tilde para guardar y cruz para cancelar (decisión 43).
function AccionesTarjeta({
  editando,
  ocupado,
  etiqueta,
  onEditar,
  onGuardar,
  onCancelar,
}: {
  editando: boolean;
  ocupado: boolean;
  etiqueta: string;
  onEditar: () => void;
  onGuardar: () => void;
  onCancelar: () => void;
}) {
  if (!editando) {
    return (
      <Button size="icon-lg" variant="outline" type="button" onClick={onEditar} disabled={ocupado}
        aria-label={`Cambiar ${etiqueta}`}>
        <Pencil />
      </Button>
    );
  }
  return (
    <span className="flex gap-1.5">
      <Button size="icon-lg" type="button" onClick={onGuardar} disabled={ocupado} aria-label={`Guardar ${etiqueta}`}>
        <Check />
      </Button>
      <Button size="icon-lg" variant="outline" type="button" onClick={onCancelar} disabled={ocupado}
        aria-label="Cancelar">
        <X />
      </Button>
    </span>
  );
}

// Un dato del cuerpo en lectura: el número grande y su unidad.
function Dato({ valor, unidad, azul = false }: { valor: string; unidad: string; azul?: boolean }) {
  return (
    <div className="rounded-xl bg-muted px-1 py-2.5 text-center">
      <p className={cn("m-0 font-heading text-3xl leading-none font-bold", azul && "text-disco-azul")}>{valor || "—"}</p>
      <p className="m-0 mt-1 text-xs text-muted-foreground">{unidad}</p>
    </div>
  );
}

// Selector con − y + a los costados del número (que también se puede escribir).
function Selector({
  etiqueta,
  unidad,
  valor,
  min,
  max,
  paso,
  azul = false,
  onChange,
}: {
  etiqueta: string;
  unidad: string;
  valor: string;
  min: number;
  max: number;
  paso: number;
  azul?: boolean;
  onChange: (valor: string) => void;
}) {
  const actual = valor === "" ? null : Number(valor);
  function mover(delta: number) {
    const base = actual ?? (min + max) / 2;
    const nuevo = Math.min(max, Math.max(min, Math.round((base + delta) / paso) * paso));
    onChange(String(nuevo));
  }
  return (
    <div className="flex items-center gap-2 rounded-xl bg-muted px-2 py-1.5">
      <span className="w-14 text-sm text-muted-foreground">{etiqueta}</span>
      <Button size="icon-lg" variant="outline" type="button" onClick={() => mover(-paso)}
        disabled={actual !== null && actual <= min} aria-label={`Bajar ${etiqueta.toLowerCase()}`}>
        <Minus />
      </Button>
      <input
        type="number"
        inputMode={paso < 1 ? "decimal" : "numeric"}
        step={paso}
        min={min}
        max={max}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`${etiqueta} en ${unidad}`}
        className={cn(
          "w-full min-w-0 flex-1 [appearance:textfield] border-0 bg-transparent p-0 text-center font-heading text-3xl font-bold outline-none focus-visible:underline [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          azul && "text-disco-azul",
        )}
      />
      <span className="w-8 text-sm text-muted-foreground">{unidad}</span>
      <Button size="icon-lg" variant="outline" type="button" onClick={() => mover(paso)}
        disabled={actual !== null && actual >= max} aria-label={`Subir ${etiqueta.toLowerCase()}`}>
        <Plus />
      </Button>
    </div>
  );
}
