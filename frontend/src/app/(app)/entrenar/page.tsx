"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { CerrarSemana } from "@/components/CerrarSemana";
import { Disco, estadoDia } from "@/components/Disco";
import { GenerarRutina } from "@/components/GenerarRutina";
import { readError, apiFetch, type Routine, type RoutineDetail, type WeekDetail, type WeekSummary } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { ErrorMessage } from "@/components/ErrorMessage";

// Entrenar (`/entrenar`, decisiones 42 y 51): la semana en curso. Con una semana activa muestra el
// día que toca y el progreso; sin semana activa, la propuesta pendiente y "Generar rutina".
export default function Entrenar() {
  const [cargando, setCargando] = useState(true);
  // La semana activa con sus días, o null si no hay.
  const [semana, setSemana] = useState<WeekDetail | null>(null);
  // Id de la propuesta que quedó pendiente (se puede volver a ver), si hay una.
  const [pendiente, setPendiente] = useState<number | null>(null);
  const [error, setError] = useState("");

  // Subir `recarga` vuelve a pedir todo (por ejemplo, después de cerrar la semana).
  const [recarga, setRecarga] = useState(0);

  useEffect(() => {
    async function cargar() {
      const activa = await apiFetch(`/weeks/active`);
      if (activa.status === 404) return setSemana(null); // la semana pudo haberse cerrado
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
        else setError(await readError(res));
      })
      .catch(() => setError("No se pudo conectar con el servidor"));
  }, [recarga]);

  return (
    <main className="mx-auto max-w-xl px-4 pt-8">
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {cargando && <p>Cargando...</p>}
      {!cargando && semana && <SemanaActiva semana={semana} onCerrada={() => setRecarga((n) => n + 1)} />}
      {!cargando && !semana && (
        <SinSemana pendiente={pendiente} onConflict={() => setRecarga((n) => n + 1)} />
      )}
    </main>
  );
}

function SemanaActiva({ semana, onCerrada }: { semana: WeekDetail; onCerrada: () => void }) {
  const hechos = semana.days.filter((d) => d.state === "completed").length;
  const pendientes = semana.days.filter((d) => d.state !== "completed");
  const proximo = pendientes[0];

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {semana.routine_name} · semana {semana.number}
      </p>
      <div className="mt-2 mb-5 flex items-center gap-1.5">
        {semana.days.map((d) => (
          <Disco key={d.day_index} estado={estadoDia[d.state]} />
        ))}
        <span className="ml-1.5 text-sm text-muted-foreground">
          {hechos} de {semana.days.length} días
        </span>
      </div>

      <section className="rounded-2xl bg-card p-5">
        {proximo ? (
          <>
            <p className="m-0 text-sm text-muted-foreground">Te toca</p>
            <h1 className="m-0 text-6xl">Día {proximo.day_index}</h1>
            <p className="mt-1 mb-4 text-muted-foreground">
              {proximo.title} · ~{proximo.minutes} min · {proximo.exercise_count} ejercicios
            </p>
            <Button
              size="lg"
              className="h-11 w-full text-base"
              nativeButton={false}
              render={<Link href={`/semanas/${semana.id}/dia/${proximo.day_index}/entrenar`} />}
            >
              Empezar día {proximo.day_index}
            </Button>
          </>
        ) : (
          <>
            <h1 className="m-0 text-4xl">Completaste los {semana.days.length} días</h1>
            <p className="mt-1 mb-4 text-muted-foreground">
              Cerrá la semana para que la IA arme la siguiente con lo que hiciste.
            </p>
            <CerrarSemana weekId={semana.id} pendientes={[]} destacado onCerrada={onCerrada} />
          </>
        )}
      </section>

      <h2 className="text-lg">Días de la semana</h2>
      <ul className="m-0 grid list-none gap-2 p-0">
        {semana.days.map((d) => (
          <li key={d.day_index}>
            <Link
              href={`/semanas/${semana.id}/dia/${d.day_index}`}
              className="flex items-center gap-3 rounded-xl bg-card px-4 py-3 no-underline hover:bg-muted"
            >
              <Disco estado={estadoDia[d.state]} />
              <span className="flex-1">
                <span className="font-medium">Día {d.day_index}</span> · {d.title}
              </span>
              <span className="text-sm text-muted-foreground">~{d.minutes} min</span>
            </Link>
          </li>
        ))}
      </ul>

      {proximo && (
        <div className="mt-6">
          <CerrarSemana
            weekId={semana.id}
            pendientes={pendientes.map((d) => d.day_index)}
            onCerrada={onCerrada}
          />
        </div>
      )}
    </>
  );
}

function SinSemana({ pendiente, onConflict }: { pendiente: number | null; onConflict: () => void }) {
  // La rutina más nueva y su última semana: es la que se continúa. `undefined` = cargando;
  // `null` = no hay ninguna (nunca se generó una rutina).
  const [ultima, setUltima] = useState<{ rutina: Routine; semana: WeekSummary } | null | undefined>(undefined);

  useEffect(() => {
    async function cargar() {
      const res = await apiFetch(`/routines`);
      if (!res.ok) return setUltima(null);
      const lista: Routine[] = await res.json();
      const rutina = lista.find((r) => r.week_count > 0);
      if (!rutina) return setUltima(null);
      const det = await apiFetch(`/routines/${rutina.id}`);
      if (!det.ok) return setUltima(null);
      const detalle: RoutineDetail = await det.json();
      const semana = detalle.weeks[0]; // la más nueva
      setUltima(semana ? { rutina, semana } : null);
    }
    cargar().catch(() => setUltima(null));
  }, []);

  if (ultima === undefined) return <p>Cargando...</p>;

  const hechos = ultima?.semana.day_states.filter((s) => s === "completed").length ?? 0;

  return (
    <>
      {ultima ? (
        <>
          <p className="text-sm text-muted-foreground">{ultima.rutina.name}</p>
          <h1 className="mt-0 mb-2">Semana {ultima.semana.number} completada</h1>
          <div className="mb-4 flex items-center gap-1.5">
            {ultima.semana.day_states.map((s, i) => (
              <Disco key={i} estado={estadoDia[s]} />
            ))}
            <span className="ml-1.5 text-sm text-muted-foreground">
              {hechos} de {ultima.semana.day_count} días
            </span>
          </div>
        </>
      ) : (
        <h1 className="mt-0">Armá tu próxima semana</h1>
      )}
      <p className="text-muted-foreground">
        La IA mira lo que hiciste y propone la semana siguiente. Nada se guarda hasta que la aceptes.
      </p>
      {pendiente !== null && (
        <section className="my-4 rounded-2xl border-2 border-disco-amarillo bg-card p-4">
          <p className="m-0 font-medium">Tenés una propuesta sin revisar</p>
          <p className="mt-1 mb-3 text-sm text-muted-foreground">
            Revisala y aceptala o descartala antes de generar otra.
          </p>
          <Button variant="outline" nativeButton={false} render={<Link href={`/rutina/propuesta/${pendiente}`} />}>
            Ver propuesta
          </Button>
        </section>
      )}
      {ultima ? (
        <div className="mt-4 grid gap-2.5">
          <GenerarRutina
            etiqueta="Generar la semana siguiente"
            continuar={ultima.rutina.id}
            onConflict={onConflict}
          />
          <GenerarRutina etiqueta="Empezar una rutina nueva" soloNueva variante="outline" onConflict={onConflict} />
          <p className="mt-1 mb-0 text-sm">
            <Link href={`/semanas/${ultima.semana.id}`}>Ver la semana o reabrirla</Link>
          </p>
        </div>
      ) : (
        <div className="mt-4">
          <GenerarRutina etiqueta="Generar rutina" onConflict={onConflict} />
        </div>
      )}
    </>
  );
}
