"use client";

import { CalendarCheck, CalendarDays, ChartLine, Lightbulb, ListChecks, Scale, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CerrarSemana } from "@/components/CerrarSemana";
import { Disco, estadoDia } from "@/components/Disco";
import { Festejo } from "@/components/Festejo";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Formulario } from "@/components/SeguimientoCuerpo";
import { Franja } from "@/components/Franja";
import { Logo } from "@/components/Logo";
import { NuevaRutina } from "@/components/NuevaRutina";
import { OpcionesSiguiente, useUltimaSemana } from "@/components/SiguienteSemana";
import { TarjetaAcceso } from "@/components/TarjetaAcceso";
import { Button } from "@/components/ui/button";
import { readError, apiFetch, type SessionUser, type WeekDetail } from "@/lib/api";
import { tituloDia } from "@/lib/format";
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
  // El recuadro para cargar el peso del día, sin salir de Inicio.
  const [cargandoPeso, setCargandoPeso] = useState(false);
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
          <section
            className={`mb-4 rounded-2xl border-2 bg-card p-5 ${proximo ? "border-disco-tinta" : "border-disco-amarillo"}`}
          >
            {/* La semana en curso: solo los discos de los días. */}
            <div className="mb-4 flex items-center gap-1.5">
              {semana.days.map((d) => (
                <Disco key={d.day_index} estado={estadoDia[d.state]} hoy={d.day_index === proximo?.day_index} />
              ))}
            </div>
            {proximo ? (
              <>
                <h2 className="mt-0 mb-0 text-4xl">Día {proximo.day_index}</h2>
                <p className="mt-0 mb-4 text-lg text-muted-foreground">{tituloDia(proximo.title)}</p>
                <Button
                  size="xl"
                  className="w-full"
                  nativeButton={false}
                  render={<Link href={`/semanas/${semana.id}/dia/${proximo.day_index}/entrenar`} />}
                >
                  Empezar
                </Button>
              </>
            ) : (
              <>
                {/* Todos los días hechos: lo que falta es cerrar la semana, y se hace desde acá. */}
                <p className="m-0 text-sm font-medium text-disco-tinta">
                  <span className="mr-1.5 rounded-full bg-disco-amarillo px-2 py-0.5">Falta cerrar la semana</span>
                </p>
                <h2 className="mt-2 mb-1 text-4xl">Completaste los {semana.days.length} días</h2>
                <p className="mt-0 mb-4 text-sm text-muted-foreground">
                  Cerrala para que la IA arme la siguiente con lo que hiciste.
                </p>
                <CerrarSemana weekId={semana.id} pendientes={[]} destacado onCerrada={() => setRecarga((n) => n + 1)} />
              </>
            )}
          </section>
        )}

        {!cargando && !semana && (
          <section className="mb-4 rounded-2xl border-2 border-disco-tinta bg-card p-5">
            {ultima ? (
              <>
                <Festejo />
                <h2 className="mt-0 mb-4 text-4xl">Semana {ultima.semana.number} completada</h2>
              </>
            ) : (
              <h2 className="mt-0 mb-4 text-4xl">Armá tu próxima semana</h2>
            )}
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
            <TarjetaAcceso href="/progreso/resumenes" Icono={CalendarCheck} texto="Resúmenes" />
            <TarjetaAcceso href="/progreso/calendario" Icono={CalendarDays} texto="Calendario" />
            <TarjetaAcceso href="/progreso" Icono={ChartLine} texto="Estadísticas" />
            <TarjetaAcceso onClick={() => setCargandoPeso(true)} Icono={Scale} texto="Cargar peso" />
          </div>
        </nav>
      </div>
      {cargandoPeso && (
        <Formulario medicion={null} onCerrar={() => setCargandoPeso(false)} onGuardada={() => setCargandoPeso(false)} />
      )}
    </main>
  );
}
