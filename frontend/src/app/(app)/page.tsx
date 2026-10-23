"use client";

import { CalendarCheck, CalendarDays, ChartLine, Lightbulb, ListChecks, Scale, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Disco, estadoDia } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Franja } from "@/components/Franja";
import { Logo } from "@/components/Logo";
import { NuevaRutina } from "@/components/NuevaRutina";
import { OpcionesSiguiente, ResumenUltimaSemana, useUltimaSemana } from "@/components/SiguienteSemana";
import { TarjetaAcceso } from "@/components/TarjetaAcceso";
import { Button } from "@/components/ui/button";
import { readError, apiFetch, type SessionUser, type WeekDetail } from "@/lib/api";
import { CargandoDiscos } from "@/components/Cargando";

// Inicio (#60, decisión 51): la portada para quien inició sesión. Saluda, muestra cómo va la
// semana y qué toca hoy, y da accesos rápidos. La semana en curso con todos sus días vive en
// Entrenar (`/entrenar`).
export default function Inicio() {
  // La última semana cerrada y su rutina: para ofrecer la semana siguiente o una rutina nueva.
  const ultima = useUltimaSemana();
  const [cargando, setCargando] = useState(true);
  const [usuario, setUsuario] = useState<SessionUser | null>(null);
  const [semana, setSemana] = useState<WeekDetail | null>(null);
  const [pendiente, setPendiente] = useState<number | null>(null);
  const [error, setError] = useState("");
  // Subir `recarga` vuelve a pedir todo (por ejemplo, si al generar ya había una semana activa).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    apiFetch(`/auth/me`)
      .then(async (res) => {
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
      {/* Franja de saludo: el logo y "Hola, nombre", con dos aros asomando (decisión 77). La semana va en la tarjeta. */}
      <Franja
        aros="inicio"
        arriba={<Logo className="mb-3 text-2xl" />}
        titulo={nombre ? `Hola, ${nombre}` : "Hola"}
      />

      <div className="mx-auto w-full max-w-xl px-4 pt-5">
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {cargando && <CargandoDiscos />}

        {!cargando && semana && (
          <section className="mb-4 rounded-2xl border-2 border-disco-tinta bg-card p-5">
            {/* La semana en curso: la rutina, su número y los discos de los días. */}
            <p className="m-0 text-sm text-muted-foreground">
              {semana.routine_name} · semana {semana.number}
            </p>
            <div className="mt-2 mb-4 flex items-center gap-1.5">
              {semana.days.map((d) => (
                <Disco key={d.day_index} estado={estadoDia[d.state]} hoy={d.day_index === proximo?.day_index} />
              ))}
              <span className="ml-1.5 text-sm text-muted-foreground">
                {hechos} de {semana.days.length} días
              </span>
            </div>
            {proximo ? (
              <>
                <p className="m-0 text-sm font-medium text-disco-azul">Próximo entrenamiento</p>
                <h2 className="mt-0 mb-1 text-4xl">
                  Día {proximo.day_index} · {proximo.title}
                </h2>
                <p className="mt-0 mb-4 text-sm text-muted-foreground">
                  ~{proximo.minutes} min · {proximo.exercise_count} ejercicios
                </p>
                <Button
                  size="xl"
                  className="w-full"
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
                <Button size="xl" className="w-full" nativeButton={false} render={<Link href="/entrenar" />}>
                  Ir a Entrenar
                </Button>
              </>
            )}
          </section>
        )}

        {!cargando && !semana && (
          <section className="mb-4 rounded-2xl border-2 border-disco-tinta bg-card p-5">
            {ultima ? (
              <>
                <p className="m-0 text-sm text-muted-foreground">{ultima.rutina.name}</p>
                <h2 className="mt-0 mb-2 text-4xl">Semana {ultima.semana.number} completada</h2>
                <div className="mb-3">
                  <ResumenUltimaSemana ultima={ultima} />
                </div>
              </>
            ) : (
              <h2 className="mt-0 mb-1 text-4xl">Armá tu próxima semana</h2>
            )}
            <p className="mt-0 mb-4 text-sm text-muted-foreground">
              La IA mira lo que hiciste y propone la semana siguiente. Nada se guarda hasta que la aceptes.
            </p>
            {ultima !== undefined && (
              <OpcionesSiguiente ultima={ultima} onConflict={() => setRecarga((n) => n + 1)} conRutinaNueva={false} />
            )}
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

        <nav aria-label="Accesos rápidos">
          <h2 className="mt-0 mb-2 text-xl">Tus rutinas</h2>
          <div className="mb-5 grid grid-cols-2 gap-2.5">
            <TarjetaAcceso href="/rutinas" Icono={ListChecks} texto="Tus rutinas" />
            {/* Abre directo el asistente de rutina nueva; con una semana en curso, avisa. */}
            <NuevaRutina hayActiva={semana !== null}>
              {(abrir) => <TarjetaAcceso onClick={abrir} disabled={cargando} Icono={Sparkles} texto="Nueva rutina" />}
            </NuevaRutina>
          </div>
          <h2 className="mt-0 mb-2 text-xl">Tu progreso</h2>
          <div className="grid grid-cols-2 gap-2.5">
            <TarjetaAcceso href="/progreso" Icono={CalendarCheck} texto="Resúmenes" />
            <TarjetaAcceso href="/progreso/estadisticas" Icono={ChartLine} texto="Estadísticas" />
            <TarjetaAcceso href="/progreso/calendario" Icono={CalendarDays} texto="Calendario" />
            <TarjetaAcceso href="/progreso/cuerpo" Icono={Scale} texto="Cuerpo" />
          </div>
        </nav>
      </div>
    </main>
  );
}
