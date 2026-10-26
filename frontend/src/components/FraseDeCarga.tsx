"use client";

import { useEffect, useState } from "react";

// Frases de entrenamiento para la pantalla de espera mientras la IA arma la semana (decisión 85):
// una espera de hasta 2 minutos se hace más corta si hay algo para leer. Son generales y no dan
// consejo médico. Cambian solas cada pocos segundos.
const FRASES = [
  "La constancia le gana a la motivación.",
  "Una serie bien hecha vale más que tres apuradas.",
  "Técnica primero, kilos después.",
  "El descanso también es parte del entrenamiento.",
  "Calentá antes de cargar peso.",
  "Controlá la bajada: ahí también se entrena.",
  "Progresar es sumar de a poco.",
  "Hidratate durante la sesión.",
  "Dormir bien también es parte del plan.",
  "Hoy no hace falta ser perfecto, hace falta ir.",
  "Cada semana cuenta, incluso las malas.",
  "Lo que se mide, se mejora.",
];

const SEGUNDOS = 5;

// Solo se dibuja durante una generación (después de un toque), nunca en el servidor: por eso se
// puede arrancar en una frase al azar sin problemas de hidratación.
export function FraseDeCarga() {
  const [i, setI] = useState(() => Math.floor(Math.random() * FRASES.length));

  useEffect(() => {
    const id = setInterval(() => setI((n) => (n + 1) % FRASES.length), SEGUNDOS * 1000);
    return () => clearInterval(id);
  }, []);

  return (
    // `key` hace que el texto se vuelva a dibujar y repita la entrada suave; con "reducir movimiento"
    // el cambio es directo. La región avisa a un lector de pantalla sin interrumpirlo.
    <p
      key={i}
      aria-live="off"
      className="mx-auto mt-0 mb-10 max-w-xs text-lg leading-snug font-normal text-muted-foreground italic animate-in fade-in duration-500 motion-reduce:animate-none"
    >
      “{FRASES[i]}”
    </p>
  );
}
