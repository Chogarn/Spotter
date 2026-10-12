import { ChartLine } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

// Progreso: el lugar de la pantalla de resumen semanal (#28). Mientras no exista, lo dice
// (decisión 51: la barra ya tiene sus cinco lugares).
export default function Progreso() {
  return (
    <main className="mx-auto max-w-xl px-4 pt-8">
      <h1 className="mt-0">Progreso</h1>
      <section className="rounded-2xl bg-card p-6 text-center">
        <ChartLine className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
        <p className="mb-1 font-medium">Muy pronto vas a ver acá cómo venís</p>
        <p className="mt-0 mb-4 text-sm text-muted-foreground">
          El resumen de cada semana: qué subió, qué se mantuvo y cuántos días entrenaste.
        </p>
        <Button variant="outline" nativeButton={false} render={<Link href="/entrenar" />}>
          Ir a Entrenar
        </Button>
      </section>
    </main>
  );
}
