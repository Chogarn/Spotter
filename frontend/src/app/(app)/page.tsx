"use client";

import { ChartLine, Lightbulb, ListChecks, Sparkles, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Disco, estadoDia } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { GenerarRutina } from "@/components/GenerarRutina";
import { Button } from "@/components/ui/button";
import { readError, apiFetch, type SessionUser, type WeekDetail } from "@/lib/api";

// Inicio (#60, decisión 51): la portada para quien inició sesión. Saluda, muestra cómo va la
// semana y qué toca hoy, y da accesos rápidos. La semana en curso con todos sus días vive en
// Entrenar (`/entrenar`).
export default function Inicio() {
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  // La fecha se arma en el navegador (no al prerenderizar la página).
  const [fecha, setFecha] = useState("");
  const [semana, setSemana] = useState<WeekDetail | null>(null);
  const [pendiente, setPendiente] = useState<number | null>(null);
  const [error, setError] = useState("");
  // Subir `recarga` vuelve a pedir todo (por ejemplo, si al generar ya había una semana activa).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    apiFetch(`/auth/me`)
      .then(async (res) => {
        setFecha(
          new Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric", month: "long" }).format(new Date()),
        );
        if (res.ok) setUsuario(await res.json());
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    async function cargar() {
      const activa = await apiFetch(`/weeks/active`);
      if (activa.status === 404) return setSemana(null);
      if (!activa.ok) throw new Error(await readError(activa));
      const { id } = await activa.json();
      const detalle = await apiFetch(`/weeks/${id}`);
      if (!detalle.ok) throw new Error(await readError(detalle));
      setSemana(await detalle.json());
    }
    cargar()
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudo conectar con el servidor"))
      .finally(() => setCargando(false));
  }, [recarga]);

  useEffect(() => {
    apiFetch(`/proposals/pending`)
      .then(async (res) => {
        if (res.ok) setPendiente((await res.json()).id);
        else if (res.status === 404) setPendiente(null);
      })
      .catch(() => {});
  }, [recarga]);

  const hechos = semana ? semana.days.filter((d) => d.state === "completed").length : 0;
  const proximo = semana?.days.find((d) => d.state !== "completed");
  const nombre = usuario?.name?.trim();

  return (
    <main className="flex flex-1 flex-col">
      {/* Franja de saludo, como el carnet de un gimnasio, con el borde de un disco asomando. */}
      <section className="relative overflow-hidden bg-primary px-4 pt-8 pb-7 text-primary-foreground">
        <div className="mx-auto max-w-xl">
          <p className="m-0 text-sm text-primary-foreground/70 first-letter:uppercase">{fecha || " "}</p>
          <h1 className="my-1 text-5xl">{nombre ? `Hola, ${nombre}` : "Hola"}</h1>
          {semana && (
            <>
              <p className="m-0 text-primary-foreground/80">
                {semana.routine_name} · semana {semana.number}
              </p>
              <div className="mt-3 flex items-center gap-1.5">
                {semana.days.map((d) => (
                  <Disco key={d.day_index} estado={estadoDia[d.state]} className="border-primary-foreground" />
                ))}
                <span className="ml-1.5 text-sm text-primary-foreground/70">
                  {hechos} de {semana.days.length} días
                </span>
              </div>
            </>
          )}
        </div>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 size-36 rounded-full border-[18px] border-disco-rojo"
        />
      </section>

      <div className="mx-auto w-full max-w-xl px-4 pt-5">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {cargando && <p>Cargando...</p>}

        {!cargando && semana && (
          <section className="mb-4 rounded-2xl border-2 border-disco-tinta bg-card p-5">
            {proximo ? (
              <>
                <p className="m-0 text-sm text-muted-foreground">Hoy te toca</p>
                <h2 className="mt-0 mb-1 text-4xl">
                  Día {proximo.day_index} · {proximo.title}
                </h2>
                <p className="mt-0 mb-4 text-sm text-muted-foreground">
                  ~{proximo.minutes} min · {proximo.exercise_count} ejercicios
                </p>
                <Button
                  size="lg"
                  className="h-12 w-full text-base"
                  nativeButton={false}
                  render={<Link href={`/semanas/${semana.id}/dia/${proximo.day_index}/entrenar`} />}
                >
                  Empezar día {proximo.day_index}
                </Button>
              </>
            ) : (
              <>
                <h2 className="mt-0 mb-1 text-4xl">Completaste los {semana.days.length} días</h2>
                <p className="mt-0 mb-4 text-sm text-muted-foreground">
                  Cerrá la semana en Entrenar para que la IA arme la siguiente.
                </p>
                <Button size="lg" className="h-12 w-full text-base" nativeButton={false} render={<Link href="/entrenar" />}>
                  Ir a Entrenar
                </Button>
              </>
            )}
          </section>
        )}

        {!cargando && !semana && (
          <section className="mb-4 rounded-2xl border-2 border-disco-tinta bg-card p-5">
            <h2 className="mt-0 mb-1 text-4xl">Armá tu próxima semana</h2>
            <p className="mt-0 mb-4 text-sm text-muted-foreground">
              La IA mira lo que hiciste y propone la semana siguiente. Nada se guarda hasta que la aceptes.
            </p>
            <GenerarRutina etiqueta="Generar rutina" onConflict={() => setRecarga((n) => n + 1)} />
          </section>
        )}

        {pendiente !== null && (
          <Link
            href={`/rutina/propuesta/${pendiente}`}
            className="mb-4 flex items-center gap-3 rounded-2xl border-2 border-disco-amarillo bg-card px-4 py-3 no-underline hover:bg-muted"
          >
            <Lightbulb className="size-5 shrink-0" aria-hidden="true" />
            <span className="flex-1">Tenés una propuesta de la IA sin revisar</span>
            <span className="text-sm font-medium">Ver</span>
          </Link>
        )}

        <nav aria-label="Accesos rápidos" className="grid grid-cols-2 gap-2.5">
          <Acceso href="/rutinas" Icono={ListChecks} texto="Tus rutinas" />
          <Acceso href="/rutinas" Icono={Sparkles} texto="Nueva rutina" />
          <Acceso href="/progreso" Icono={ChartLine} texto="Progreso" />
        </nav>
      </div>
    </main>
  );
}

function Acceso({ href, Icono, texto }: { href: string; Icono: LucideIcon; texto: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-2 rounded-2xl bg-card p-4 font-medium no-underline hover:bg-muted"
    >
      <Icono className="size-6" aria-hidden="true" />
      {texto}
    </Link>
  );
}
