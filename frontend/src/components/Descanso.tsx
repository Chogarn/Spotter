"use client";

import { Timer } from "lucide-react";
import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "cn";

// Reloj de descanso (#59, decisión 48). Lo arranca el usuario; dura lo que propuso la IA para el
// ejercicio (`rest_seconds`). El tiempo se calcula con la hora de fin y no contando segundos: con
// la pantalla apagada el navegador pausa los temporizadores y así no se atrasa.
// Vive en un contexto del layout de las pantallas con sesión para que siga corriendo al cambiar
// de pantalla (es el primer estado compartido entre pantallas; ver #17).

type Corriendo = {
  fin: number; // hora (ms) en que termina
  total: number; // duración en ms, con los ajustes de ±15 s (para el círculo)
  clave: string; // qué ejercicio lo arrancó: "semana-día-ejercicio"
  href: string; // adónde vuelve la franja
  nombre: string; // el ejercicio, para la franja
};

type Descanso = {
  corriendo: Corriendo | null;
  restanteMs: number;
  // La clave del ejercicio cuyo descanso acaba de terminar ("Listo, siguiente serie").
  terminado: string | null;
  iniciar: (datos: { segundos: number; clave: string; href: string; nombre: string }) => void;
  ajustar: (segundos: number) => void;
  saltar: () => void;
  olvidarAviso: () => void;
  // El ejercicio que muestra el círculo avisa que está a la vista, para no repetirlo en la franja.
  setMostrando: (mostrando: boolean) => void;
};

const Contexto = createContext<Descanso | null>(null);
const GUARDADO = "spotter_descanso";

export function useDescanso(): Descanso {
  const valor = useContext(Contexto);
  if (!valor) throw new Error("useDescanso va dentro de <DescansoProvider>");
  return valor;
}

// Lo guardado sobrevive a recargar la página; si el navegador no deja leerlo, se arranca vacío.
function leerGuardado(): Corriendo | null {
  try {
    const texto = sessionStorage.getItem(GUARDADO);
    const leido = texto ? (JSON.parse(texto) as Corriendo) : null;
    return leido && leido.fin > Date.now() ? leido : null;
  } catch {
    return null;
  }
}

function guardar(valor: Corriendo | null) {
  try {
    if (valor) sessionStorage.setItem(GUARDADO, JSON.stringify(valor));
    else sessionStorage.removeItem(GUARDADO);
  } catch {
    // Sin almacenamiento el reloj igual funciona mientras no se recargue la página.
  }
}

export function DescansoProvider({ children }: { children: React.ReactNode }) {
  const [corriendo, setCorriendo] = useState<Corriendo | null>(null);
  // La hora se lee recién en el navegador (no al prerenderizar): solo importa mientras corre.
  const [ahora, setAhora] = useState(0);
  const [terminado, setTerminado] = useState<string | null>(null);
  const [mostrando, setMostrandoEstado] = useState(false);

  // Recupera un descanso que seguía corriendo antes de recargar. Va en un callback (y no en el
  // render) porque el almacenamiento solo existe en el navegador, no al prerenderizar.
  useEffect(() => {
    const espera = window.setTimeout(() => {
      const guardado = leerGuardado();
      if (guardado) setCorriendo(guardado);
    }, 0);
    return () => window.clearTimeout(espera);
  }, []);

  // Mientras corre, se actualiza cuatro veces por segundo (una si se pidió reducir el movimiento).
  // Al llegar a cero: vibra (si el dispositivo lo permite), avisa y se apaga.
  useEffect(() => {
    if (!corriendo) return;
    const reducido = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = () => {
      const t = Date.now();
      setAhora(t);
      if (t < corriendo.fin) return;
      try {
        navigator.vibrate?.([300, 150, 300]);
      } catch {
        // Algunos navegadores no vibran; el aviso en pantalla alcanza.
      }
      setTerminado(corriendo.clave);
      setCorriendo(null);
      guardar(null);
    };
    tick();
    const intervalo = window.setInterval(tick, reducido ? 1000 : 250);
    // Al volver a mostrar la pantalla (se había apagado), se recalcula enseguida.
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [corriendo]);

  const iniciar = useCallback<Descanso["iniciar"]>(({ segundos, clave, href, nombre }) => {
    const valor = { fin: Date.now() + segundos * 1000, total: segundos * 1000, clave, href, nombre };
    setTerminado(null);
    setAhora(Date.now());
    setCorriendo(valor);
    guardar(valor);
  }, []);

  const ajustar = useCallback((segundos: number) => {
    setCorriendo((actual) => {
      if (!actual) return actual;
      const valor = {
        ...actual,
        fin: actual.fin + segundos * 1000,
        total: Math.max(actual.total + segundos * 1000, 1000),
      };
      guardar(valor);
      return valor;
    });
    setAhora(Date.now());
  }, []);

  const saltar = useCallback(() => {
    setCorriendo(null);
    guardar(null);
  }, []);

  const olvidarAviso = useCallback(() => setTerminado(null), []);
  const setMostrando = useCallback((valor: boolean) => setMostrandoEstado(valor), []);

  const restanteMs = corriendo ? Math.max(corriendo.fin - ahora, 0) : 0;

  return (
    <Contexto.Provider
      value={{ corriendo, restanteMs, terminado, iniciar, ajustar, saltar, olvidarAviso, setMostrando }}
    >
      {children}
      {corriendo && !mostrando && <FranjaDescanso corriendo={corriendo} restanteMs={restanteMs} />}
    </Contexto.Provider>
  );
}

// "1:24"
export function reloj(ms: number): string {
  const segundos = Math.ceil(ms / 1000);
  return `${Math.floor(segundos / 60)}:${String(segundos % 60).padStart(2, "0")}`;
}

// Para lectores de pantalla: "1 minuto 24 segundos".
function relojEnPalabras(ms: number): string {
  const segundos = Math.ceil(ms / 1000);
  const m = Math.floor(segundos / 60);
  const s = segundos % 60;
  const partes = [];
  if (m) partes.push(`${m} ${m === 1 ? "minuto" : "minutos"}`);
  if (s || !m) partes.push(`${s} ${s === 1 ? "segundo" : "segundos"}`);
  return partes.join(" ");
}

// La franja arriba de la barra de navegación cuando el reloj corre y no está a la vista.
function FranjaDescanso({ corriendo, restanteMs }: { corriendo: Corriendo; restanteMs: number }) {
  return (
    <Link
      href={corriendo.href}
      className="fixed inset-x-0 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-30 mx-auto flex max-w-xl items-center gap-3 rounded-full bg-primary px-4 py-2.5 text-primary-foreground no-underline shadow-md max-sm:mx-3"
      aria-label={`Descanso de ${corriendo.nombre}: quedan ${relojEnPalabras(restanteMs)}. Volver al ejercicio`}
    >
      <Timer className="size-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 flex-1 truncate text-sm">Descanso · {corriendo.nombre}</span>
      <span className="font-heading text-2xl leading-none font-bold tabular-nums">{reloj(restanteMs)}</span>
    </Link>
  );
}

// El círculo que ocupa el lugar de la serie mientras corre el descanso de este ejercicio.
export function RelojCircular({ subtitulo }: { subtitulo: string }) {
  const { corriendo, restanteMs, ajustar, saltar, setMostrando } = useDescanso();
  useEffect(() => {
    setMostrando(true);
    return () => setMostrando(false);
  }, [setMostrando]);
  if (!corriendo) return null;

  const radio = 80;
  const largo = 2 * Math.PI * radio;
  const fraccion = Math.min(restanteMs / corriendo.total, 1);

  return (
    <section className="mt-3 flex flex-col items-center">
      <p className="m-0 text-sm text-muted-foreground">{subtitulo}</p>
      <div role="timer" aria-label={`Descanso: quedan ${relojEnPalabras(restanteMs)}`} className="relative my-3 size-56">
        <svg viewBox="0 0 190 190" className="size-full -rotate-90" aria-hidden="true">
          <circle cx="95" cy="95" r={radio} className="fill-card stroke-border" strokeWidth="14" />
          <circle
            cx="95"
            cy="95"
            r={radio}
            fill="none"
            className="stroke-disco-tinta"
            strokeWidth="14"
            strokeLinecap="round"
            strokeDasharray={largo}
            strokeDashoffset={largo * (1 - fraccion)}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center" aria-hidden="true">
          <span className="text-sm text-muted-foreground">Descanso</span>
          <span className="font-heading text-6xl leading-none font-bold tabular-nums">{reloj(restanteMs)}</span>
          <span className="text-sm text-muted-foreground">de {reloj(corriendo.total)}</span>
        </div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="lg" type="button" onClick={() => ajustar(-15)}>
          −15 s
        </Button>
        <Button variant="outline" size="lg" type="button" onClick={() => ajustar(15)}>
          +15 s
        </Button>
      </div>
      <Button size="xl" className="mt-3 w-full" type="button" onClick={saltar}>
        Saltar descanso
      </Button>
    </section>
  );
}

// El botón redondo que arranca el descanso, al lado de "Serie hecha".
export function BotonDescanso({
  segundos,
  clave,
  href,
  nombre,
  className,
}: {
  segundos: number;
  clave: string;
  href: string;
  nombre: string;
  className?: string;
}) {
  const { iniciar } = useDescanso();
  return (
    <Button
      variant="outline"
      type="button"
      className={cn("size-12 border-2 border-primary", className)}
      onClick={() => iniciar({ segundos, clave, href, nombre })}
      aria-label={`Iniciar descanso de ${reloj(segundos * 1000)}`}
    >
      <Timer className="size-6" />
    </Button>
  );
}
