"use client";

import { Check, LogOut, Pencil } from "lucide-react";
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

// Perfil: encabezado con el nombre, "Tu cuerpo" (edad, peso y altura como recuadros con el número
// grande), sexo, lesiones o limitaciones, el aviso médico, Guardar y Cerrar sesión.
export default function PerfilPage() {
  const router = useRouter();
  const [form, setForm] = useState<Form>(VACIO);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  const [editandoNombre, setEditandoNombre] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

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
        if (res.status === 404) return; // todavía no hay perfil: formulario vacío
        if (!res.ok) throw new Error("No se pudo cargar el perfil");
        const p = await res.json();
        setForm({
          name: p.name,
          age: String(p.age),
          weight_kg: String(p.weight_kg),
          height_cm: String(p.height_cm),
          sex: p.sex ?? "",
          limitations: p.limitations ?? "",
          accept_legal_notice: p.legal_notice_accepted,
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

  function cambiar<K extends keyof Form>(campo: K, valor: Form[K]) {
    setGuardado(false);
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setGuardando(true);
    try {
      const res = await apiFetch(`/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          age: form.age === "" ? null : Number(form.age),
          weight_kg: form.weight_kg === "" ? null : form.weight_kg,
          height_cm: form.height_cm === "" ? null : Number(form.height_cm),
          sex: form.sex || null,
          limitations: form.limitations || null,
          accept_legal_notice: form.accept_legal_notice,
        }),
      });
      if (res.ok) {
        // El perfil es una sección de la barra: se queda acá y avisa que se guardó.
        setGuardado(true);
        setEditandoNombre(false);
      } else {
        setError(errorText((await res.json()).detail));
      }
    } catch {
      setError("No se pudo conectar con el servidor");
    }
    setGuardando(false);
  }

  if (cargando) return <main className="mx-auto max-w-xl px-4 pt-8">Cargando...</main>;

  const nombre = form.name || usuario?.name || "";

  return (
    <main className="mx-auto max-w-xl px-4 pt-8">
      <form onSubmit={guardar}>
        {/* Encabezado: inicial, nombre grande (se cambia con el lápiz) y correo. */}
        <div className="mb-5 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary font-heading text-3xl font-bold text-primary-foreground"
          >
            {nombre.trim().charAt(0).toUpperCase() || "?"}
          </span>
          <div className="min-w-0 flex-1">
            {editandoNombre ? (
              <Input
                id="name"
                aria-label="Nombre"
                autoFocus
                value={form.name}
                onChange={(e) => cambiar("name", e.target.value)}
                className="h-11 font-heading text-2xl font-bold"
              />
            ) : (
              <h1 className="my-0 truncate text-4xl">{nombre || "Tu nombre"}</h1>
            )}
            {usuario && <p className="m-0 truncate text-sm text-muted-foreground">{usuario.email}</p>}
          </div>
          <Button
            size="icon-lg"
            variant="outline"
            type="button"
            onClick={() => setEditandoNombre((v) => !v)}
            aria-label={editandoNombre ? "Listo con el nombre" : "Cambiar el nombre"}
          >
            {editandoNombre ? <Check /> : <Pencil />}
          </Button>
        </div>

        <section className="mb-3 rounded-2xl bg-card p-4">
          <h2 className="mt-0 mb-3 text-xl">Tu cuerpo</h2>
          <div className="grid grid-cols-3 gap-2">
            <Medida id="age" etiqueta="Edad en años" unidad="años" valor={form.age} onChange={(v) => cambiar("age", v)} />
            <Medida
              id="weight_kg"
              etiqueta="Peso en kilos"
              unidad="kg"
              valor={form.weight_kg}
              decimal
              azul
              onChange={(v) => cambiar("weight_kg", v)}
            />
            <Medida
              id="height_cm"
              etiqueta="Altura en centímetros"
              unidad="cm"
              valor={form.height_cm}
              onChange={(v) => cambiar("height_cm", v)}
            />
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
                  <input
                    type="radio"
                    name="sex"
                    value={valor}
                    checked={form.sex === valor}
                    onChange={() => cambiar("sex", valor)}
                    className="sr-only"
                  />
                  {texto}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="mb-3 rounded-2xl bg-card p-4">
          <h2 className="mt-0 mb-0.5 text-xl">
            <label htmlFor="limitations">Lesiones o limitaciones</label>
          </h2>
          <p className="mt-0 mb-2 text-sm text-muted-foreground">La IA las tiene en cuenta al armar tu semana.</p>
          <Textarea
            id="limitations"
            rows={3}
            value={form.limitations}
            onChange={(e) => cambiar("limitations", e.target.value)}
            placeholder="Por ejemplo: me molesta la rodilla derecha en la sentadilla profunda"
          />
        </section>

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

        <Button type="submit" size="lg" className="h-12 w-full text-base" disabled={guardando}>
          {guardando ? "Guardando..." : "Guardar cambios"}
        </Button>
        {guardado && (
          <p role="status" className="mt-2 text-center text-sm text-muted-foreground">
            Cambios guardados
          </p>
        )}
      </form>
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

// Un dato del cuerpo como recuadro con el número grande: el recuadro entero es el campo.
function Medida({
  id,
  etiqueta,
  unidad,
  valor,
  decimal = false,
  azul = false,
  onChange,
}: {
  id: string;
  etiqueta: string;
  unidad: string;
  valor: string;
  decimal?: boolean;
  azul?: boolean;
  onChange: (valor: string) => void;
}) {
  return (
    <label
      htmlFor={id}
      className="flex cursor-text flex-col items-center rounded-xl border-2 border-transparent bg-muted px-1 py-2 has-focus:border-disco-azul has-focus:bg-card"
    >
      <input
        id={id}
        type="number"
        inputMode={decimal ? "decimal" : "numeric"}
        step={decimal ? "0.1" : "1"}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        aria-label={etiqueta}
        className={cn(
          "w-full [appearance:textfield] border-0 bg-transparent p-0 text-center font-heading text-3xl leading-none font-bold outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
          azul && "text-disco-azul",
        )}
      />
      <span className="text-xs text-muted-foreground">{unidad}</span>
    </label>
  );
}
