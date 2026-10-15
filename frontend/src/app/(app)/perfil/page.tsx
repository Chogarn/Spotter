"use client";

import { Check, LogOut, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { errorText, apiFetch, type SessionUser } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";
import { type DatosPerfil, type PasoPerfil, PerfilAsistente, SEXOS } from "@/components/PerfilAsistente";
import { cn } from "cn";
import { Cargando } from "@/components/Cargando";

type Form = DatosPerfil;

// Las tarjetas del perfil y qué pasos del asistente abre cada lápiz.
type Tarjeta = "nombre" | "cuerpo" | "limitaciones";
const PASOS: Record<Tarjeta, PasoPerfil[]> = {
  nombre: ["nombre"],
  cuerpo: ["edad", "peso", "altura", "sexo"],
  limitaciones: ["limitaciones"],
};

// Perfil: se ven los datos guardados y cada lápiz abre los pasos de esa tarjeta (el mismo
// asistente de una pregunta por pantalla). Un usuario sin perfil todavía (recién registrado) lo
// completa todo de una vez.
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
      {/* Franja oscura como la de Inicio, con el borde de un disco asomando: el nombre grande, el
          correo y el lápiz para cambiarlo. */}
      <section className="relative overflow-hidden bg-primary px-4 pt-8 pb-7 text-primary-foreground">
        <div className="mx-auto max-w-xl">
          {usuario && <p className="m-0 truncate text-sm text-primary-foreground/70">{usuario.email}</p>}
          <div className="mt-1 flex items-center gap-3">
            <h1 className="my-0 min-w-0 truncate text-5xl">{nombre || "Tu nombre"}</h1>
            <div className="relative z-10 shrink-0">{lapiz(
                "nombre",
                "el nombre",
                // Sobre la franja oscura: transparente con borde claro, como los botones de la bienvenida.
                "border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
              )}
            </div>
          </div>
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full border-[18px] border-disco-rojo"
        />
      </section>

      <div className="mx-auto w-full max-w-xl px-4 pt-5">
      <section className="mb-3 rounded-2xl bg-card p-4">
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="my-0 text-xl">Tu cuerpo</h2>
          {lapiz("cuerpo", "tus datos del cuerpo")}
        </div>
        {/* Los tres números en fila y el sexo debajo, a todo el ancho, con el mismo formato. */}
          <div className="grid grid-cols-3 gap-2">
            <Dato valor={form.age} unidad="años" />
            <Dato valor={Number(form.weight_kg).toLocaleString("es-AR")} unidad="kg" azul />
            <Dato valor={form.height_cm} unidad="cm" />
            <div className="col-span-3">
              <Dato valor={SEXOS.find(([v]) => v === form.sex)?.[1] ?? "Sin indicar"} unidad="sexo" />
            </div>
          </div>
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

      {/* Cerrar sesión vive en el Perfil (decisión 42), separado y en rojo para no tocarlo sin querer. */}
      <div className="mt-6 flex justify-center">
        <Button variant="ghost" type="button" onClick={cerrarSesion} className="text-destructive hover:text-destructive">
          <LogOut aria-hidden="true" />
          Cerrar sesión
        </Button>
      </div>
      </div>
    </main>
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
