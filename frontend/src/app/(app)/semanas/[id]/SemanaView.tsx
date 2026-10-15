"use client";

import { ChevronRight, LockOpen } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { use, useEffect, useState } from "react";

import { BackButton } from "@/components/BackButton";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { readError, type WeekDetail, apiFetch } from "@/lib/api";
import { dayStateText, shortDate, statusText } from "@/lib/format";
import { cn } from "cn";
import { Disco, estadoDia } from "@/components/Disco";
import { ErrorMessage } from "@/components/ErrorMessage";
import { CargandoDiscos } from "@/components/Cargando";

export default function SemanaView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [semana, setSemana] = useState<WeekDetail | null>(null);
  const [error, setError] = useState("");
  // Reabrir una semana cerrada (decisión 66): recuadro de confirmación y su error, si hay.
  const [reabriendo, setReabriendo] = useState(false);
  const [trabajando, setTrabajando] = useState(false);
  const [errorReabrir, setErrorReabrir] = useState("");

  async function reabrir() {
    setErrorReabrir("");
    setTrabajando(true);
    try {
      const res = await apiFetch(`/weeks/${id}/reopen`, { method: "POST" });
      if (!res.ok) {
        setErrorReabrir(await readError(res));
        setTrabajando(false);
        return;
      }
      setTrabajando(false);
      router.push("/entrenar");
    } catch {
      setErrorReabrir("No se pudo conectar con el servidor");
      setTrabajando(false);
    }
  }

  useEffect(() => {
    apiFetch(`/weeks/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(await readError(res));
        setSemana(await res.json());
      })
      .catch((e) => setError(e.message));
  }, [id]);

  return (
    <main className="mx-auto max-w-xl px-4 pt-6">
      <BackButton href={semana ? `/rutinas/${semana.routine_id}` : "/rutinas"}>
        ← {semana ? semana.routine_name : "Tus rutinas"}
      </BackButton>
      {error && <ErrorMessage>{error}</ErrorMessage>}
      {!semana && !error && <CargandoDiscos />}
      {semana && (
        <>
          {/* Título grande y etiquetas, como la pantalla de la rutina y la del día. */}
          <h1 className="mt-2 mb-0 text-6xl">Semana {semana.number}</h1>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span
              className={cn(
                "rounded-full px-3 py-1 text-sm",
                semana.status === "active" ? "bg-disco-rojo text-white" : "bg-card text-muted-foreground",
              )}
            >
              {semana.status === "active" ? "En curso" : semana.status === "closed" ? "Completada" : statusText[semana.status]}
            </span>
            <span className="rounded-full bg-card px-3 py-1 text-sm">Desde el {shortDate(semana.week_start)}</span>
            <span className="rounded-full bg-card px-3 py-1 text-sm">{semana.days.length} días</span>
          </div>
          {/* Cada día como las tarjetas de ejercicio del día; la flecha avisa que se entra tocándola. */}
          <ul className="m-0 mt-4 mb-4 grid list-none gap-2.5 p-0">
            {semana.days.map((d) => (
              <li key={d.day_index}>
                <Link
                  href={`/semanas/${semana.id}/dia/${d.day_index}?desde=rutinas`}
                  className="flex items-center gap-3 rounded-2xl bg-card px-4 py-3.5 no-underline hover:bg-muted"
                >
                  <Disco estado={estadoDia[d.state]} />
                  <span className="flex-1">
                    <span className="block font-heading text-[1.35rem] leading-tight font-bold">
                      Día {d.day_index} · {d.title}
                    </span>
                    <span className="block font-heading text-lg leading-tight font-semibold text-muted-foreground">
                      ~{d.minutes} min · {d.exercise_count} ejercicios
                      {d.state !== "pending" && <> · {dayStateText[d.state]}</>}
                    </span>
                  </span>
                  <ChevronRight className="size-6 shrink-0 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>

          {semana.status === "active" && (
            <p>
              <small className="text-muted-foreground">
                La semana se cierra desde <Link href="/entrenar">Entrenar</Link>.
              </small>
            </p>
          )}
          {semana.status === "closed" && (
            <>
              <section className="mt-6">
                <span className="font-heading text-2xl font-bold">Semana completada</span>
              </section>
              {/* Reabrir (decisión 66): vuelve a estar en curso; el servidor avisa si no se puede. */}
              <p className="mb-2">
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => {
                    setErrorReabrir("");
                    setReabriendo(true);
                  }}
                >
                  <LockOpen className="size-4" aria-hidden="true" />
                  Reabrir semana
                </Button>
              </p>
              <p>
                <small className="text-muted-foreground">
                  <Link href="/entrenar">Andá a Entrenar</Link> para generar la siguiente.
                </small>
              </p>
              <AlertDialog
                open={reabriendo}
                onOpenChange={(abierto) => !abierto && !trabajando && setReabriendo(false)}
              >
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>¿Reabrir la semana {semana.number}?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Vuelve a estar en curso para que registres lo que falta. Se borra el comentario de
                      cierre y, al volver a cerrarla, escribís uno nuevo. No se pierde nada de lo
                      registrado.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  {errorReabrir && <ErrorMessage>{errorReabrir}</ErrorMessage>}
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={trabajando}>Cancelar</AlertDialogCancel>
                    <Button type="button" disabled={trabajando} onClick={reabrir}>
                      {trabajando ? "Reabriendo…" : "Reabrir semana"}
                    </Button>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              {semana.closing_note && (
                <>
                  <h2>Cómo te sentiste esta semana</h2>
                  <p style={{ whiteSpace: "pre-wrap" }}>{semana.closing_note}</p>
                </>
              )}
            </>
          )}
        </>
      )}
    </main>
  );
}
