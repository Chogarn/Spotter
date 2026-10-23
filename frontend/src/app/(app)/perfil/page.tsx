"use client";

import { Check, LogOut, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { errorText, apiFetch, type SessionUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Franja } from "@/components/Franja";
import { type DatosPerfil, type PasoPerfil, PerfilAsistente, SEXOS } from "@/components/PerfilAsistente";
import { CambiarContrasena } from "@/components/CambiarContrasena";
import { FilaProximamente } from "@/components/Proximamente";
import { cn } from "cn";
import { Cargando } from "@/components/Cargando";

type Form = DatosPerfil;

// Cada dato del perfil se edita por separado (decisión 85): cada lápiz abre solo la pregunta de ese
// dato, nunca varias juntas.
type Tarjeta = "nombre" | "edad" | "peso" | "altura" | "sexo" | "limitaciones";
const PASOS: Record<Tarjeta, PasoPerfil[]> = {
  nombre: ["nombre"],
  edad: ["edad"],
  peso: ["peso"],
  altura: ["altura"],
  sexo: ["sexo"],
  limitaciones: ["limitaciones"],
};

// Perfil: se ven los datos guardados y cada lápiz abre la pregunta de ese dato (el mismo asistente
// de una pregunta por pantalla, con un solo paso). Un usuario sin perfil todavía (recién
// registrado) lo completa todo de una vez.
export default function PerfilPage() {
  const router = useRouter();
  // Lo último guardado (null = todavía no hay perfil).
  const [guardado, setGuardado] = useState<Form | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  // El borrador del asistente va por usuario: hay que saber quién es antes de mostrarlo.
  const [usuarioListo, setUsuarioListo] = useState(false);
  const [editando, setEditando] = useState<Tarjeta | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [pestana, setPestana] = useState<"perfil" | "cuenta">("perfil");

  useEffect(() => {
    apiFetch(`/auth/me`)
      .then(async (res) => {
        if (res.ok) setUsuario(await res.json());
      })
      .catch(() => {})
      .finally(() => setUsuarioListo(true));
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
          birth_date: p.birth_date ?? "",
          weight_kg: String(Number(p.weight_kg)),
          height_cm: String(p.height_cm),
          sex: p.sex ?? "",
          limitations: p.limitations ?? "",
          accept_legal_notice: p.legal_notice_accepted,
        };
        setGuardado(leido);
      })
      .catch((e) => setError(e.message))
      .finally(() => setCargando(false));
  }, []);

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
          birth_date: datos.birth_date || null,
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

  if (cargando || !usuarioListo) return <Cargando />;

  // Sin perfil guardado (recién registrado), un asistente con una pregunta por pantalla.
  if (guardado === null) {
    return (
      <PerfilAsistente
        nombreInicial={usuario?.name ?? ""}
        claveBorrador={usuario ? `spotter:perfil-borrador:${usuario.id}` : undefined}
        guardando={guardando}
        error={error}
        enviar={async (datos) => {
          const ok = await enviar(datos);
          if (ok) router.push("/");
          return ok;
        }}
      />
    );
  }

  // Editar una tarjeta: los pasos de esa tarjeta, con lo guardado ya puesto.
  if (editando !== null) {
    return (
      <PerfilAsistente
        key={editando}
        nombreInicial={usuario?.name ?? ""}
        inicial={guardado}
        pasos={PASOS[editando]}
        guardando={guardando}
        error={error}
        onCancelar={() => {
          setEditando(null);
          setError("");
        }}
        enviar={async (datos) => {
          const ok = await enviar(datos);
          if (ok) setEditando(null);
          return ok;
        }}
      />
    );
  }

  const form = guardado;
  const nombre = form.name || usuario?.name || "";
  const lapiz = (t: Tarjeta, etiqueta: string, className?: string) => (
    <Button size="icon-lg" variant="outline" type="button" onClick={() => setEditando(t)}
      className={className} aria-label={`Cambiar ${etiqueta}`}>
      <Pencil />
    </Button>
  );

  return (
    <main className="flex flex-1 flex-col">
      {/* Franja con el nombre grande y el lápiz para cambiarlo (decisión 77: aros verdes). */}
      <Franja
        aros="verde"
        titulo={nombre || "Tu nombre"}
        acciones={lapiz(
          "nombre",
          "el nombre",
          // Sobre la franja oscura: transparente con borde claro, como los botones de la bienvenida.
          "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
        )}
      />

      <div className="mx-auto w-full max-w-xl px-4 pt-5">
      {/* Dos partes (decisión 75): el perfil de entrenamiento y la cuenta (correo, contraseña y sesión). */}
      <div role="tablist" aria-label="Perfil y cuenta" className="mb-4 flex rounded-full bg-muted p-1">
        {(["perfil", "cuenta"] as const).map((p) => (
          <button
            key={p}
            type="button"
            role="tab"
            id={`tab-${p}`}
            aria-selected={pestana === p}
            aria-controls={`panel-${p}`}
            onClick={() => setPestana(p)}
            className={cn(
              "flex-1 rounded-full py-2 text-center text-sm font-medium outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
              pestana === p ? "bg-primary text-primary-foreground" : "text-foreground",
            )}
          >
            {p === "perfil" ? "Perfil" : "Cuenta"}
          </button>
        ))}
      </div>

      {pestana === "perfil" ? (
      <div role="tabpanel" id="panel-perfil" aria-labelledby="tab-perfil">
      <section className="mb-3 rounded-2xl bg-card p-4">
        <div className="mb-3">
          <h2 className="my-0 text-xl">Tu cuerpo</h2>
        </div>
        {/* A la vista, lo que cambia: el peso y el IMC, que se calcula con el peso y la altura (por eso
            no tiene lápiz ni lo pide el asistente). Lo demás, plegado (decisión 86). */}
        <div className="grid grid-cols-2 gap-2">
          <Dato
            valor={Number(form.weight_kg).toLocaleString("es-AR")}
            unidad="kg"
            azul
            editar={() => setEditando("peso")}
            etiqueta="el peso"
          />
          <Dato valor={imc(form.weight_kg, form.height_cm)} unidad="IMC" />
        </div>
        <p className="mt-2 mb-0 text-xs text-muted-foreground">
          El IMC se calcula con tu peso y tu altura. Es orientativo: no distingue músculo de grasa.
        </p>
        <details className="mt-3 border-t border-border pt-2">
          <summary className="cursor-pointer py-1.5 font-medium">Datos personales</summary>
          <div className="mt-2 grid grid-cols-2 gap-2">
            <Dato valor={form.age} unidad="años" editar={() => setEditando("edad")} etiqueta="la edad" />
            <Dato valor={form.height_cm} unidad="cm de altura" editar={() => setEditando("altura")} etiqueta="la altura" />
            <div className="col-span-2">
              <Dato
                valor={SEXOS.find(([v]) => v === form.sex)?.[1] ?? "Sin indicar"}
                unidad="sexo"
                editar={() => setEditando("sexo")}
                etiqueta="el sexo"
              />
            </div>
          </div>
        </details>
      </section>

      <section className="mb-3 rounded-2xl bg-card p-4">
        <div className="mb-1 flex items-center justify-between gap-2">
          <h2 className="my-0 text-xl">
            Lesiones o limitaciones
          </h2>
          {lapiz("limitaciones", "tus limitaciones")}
        </div>
        <p className="mt-0 mb-2 text-sm text-muted-foreground">La IA las tiene en cuenta al armar tu semana.</p>
        <p className="m-0 whitespace-pre-wrap">{form.limitations || "Ninguna indicada."}</p>
      </section>

      {/* El aviso médico: una vez aceptado no se puede desmarcar (lo exige el backend). */}
      <p className="mb-4 flex items-center gap-2 px-1 text-sm text-muted-foreground">
        <Check className="size-4" aria-hidden="true" /> Aceptaste que la app no da consejo médico.
      </p>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      </div>
      ) : (
      <div role="tabpanel" id="panel-cuenta" aria-labelledby="tab-cuenta">
        <section className="mb-3 rounded-2xl bg-card p-4">
          <h2 className="mt-0 mb-2 text-xl">Tu cuenta</h2>
          <p className="m-0 text-sm text-muted-foreground">Correo</p>
          <p className="m-0 break-all">{usuario?.email ?? "—"}</p>
        </section>

        {/* Todavía sin hacer (decisión 75): los botones están en su lugar y avisan al tocarlos. */}
        <section className="mb-3 rounded-2xl bg-card px-4 py-1">
          <FilaProximamente texto="Cambiar correo" mensaje="Cambiar el correo todavía no está disponible." />
          <CambiarContrasena />
          <FilaProximamente texto="Borrar cuenta" mensaje="Borrar la cuenta todavía no está disponible." peligro />
        </section>

        {/* Cerrar sesión vive en la Cuenta (decisiones 42 y 75), separado y en rojo para no tocarlo sin querer. */}
        <div className="mt-6 flex justify-center">
          <Button variant="ghost" type="button" onClick={cerrarSesion} className="text-destructive hover:text-destructive">
            <LogOut aria-hidden="true" />
            Cerrar sesión
          </Button>
        </div>
      </div>
      )}
      </div>
    </main>
  );
}

// Un dato del cuerpo en lectura: el número grande y su unidad.
function Dato({
  valor,
  unidad,
  azul = false,
  editar,
  etiqueta,
}: {
  valor: string;
  unidad: string;
  azul?: boolean;
  editar?: () => void;
  etiqueta?: string;
}) {
  return (
    <div className="relative rounded-xl bg-muted px-1 py-2.5 text-center">
      <p className={cn("m-0 font-heading text-3xl leading-none font-bold", azul && "text-disco-azul")}>{valor || "—"}</p>
      <p className="m-0 mt-1 text-xs text-muted-foreground">{unidad}</p>
      {editar && (
        <button
          type="button"
          onClick={editar}
          aria-label={`Cambiar ${etiqueta}`}
          className="absolute top-1 right-1 inline-flex size-8 items-center justify-center rounded-full text-muted-foreground outline-none hover:bg-background focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <Pencil className="size-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// Índice de masa corporal: peso (kg) dividido por la altura (m) al cuadrado, con un decimal. Es un
// número informativo, sin categoría ni consejo (decisión 86). "—" si falta algún dato.
function imc(pesoKg: string, alturaCm: string): string {
  const peso = Number(pesoKg);
  const altura = Number(alturaCm) / 100;
  if (!peso || !altura) return "—";
  return (peso / (altura * altura)).toLocaleString("es-AR", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
}
