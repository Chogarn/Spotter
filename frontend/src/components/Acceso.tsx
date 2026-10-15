"use client";

import { ChevronLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Logo } from "@/components/Logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "cn";

// Pantallas de acceso (iniciar sesión y crear cuenta): una franja oscura arriba con el título y
// el borde de un disco asomando, y el formulario abajo, sobre el gris cemento (estilo Disco).
export function PantallaAcceso({
  titulo,
  bajada,
  disco,
  children,
}: {
  titulo: string;
  bajada: string;
  disco: "rojo" | "azul";
  children: React.ReactNode;
}) {
  return (
    <main className="flex flex-1 flex-col">
      <section className="relative overflow-hidden bg-primary px-4 pt-6 pb-8 text-primary-foreground">
        <div className="relative z-10 mx-auto max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-0.5 text-sm text-primary-foreground/70 no-underline hover:text-primary-foreground"
          >
            <ChevronLeft className="size-4" aria-hidden="true" />
            <Logo className="mx-1 h-4" />
            Spotter
          </Link>
          <h1 className="mt-3 mb-1 text-5xl">{titulo}</h1>
          <p className="m-0 text-primary-foreground/80">{bajada}</p>
        </div>
        <span
          aria-hidden="true"
          className={cn(
            "pointer-events-none absolute -top-12 -right-12 size-40 rounded-full border-[20px]",
            disco === "rojo" ? "border-disco-rojo" : "border-disco-azul",
          )}
        />
      </section>
      <div className="mx-auto w-full max-w-md px-4 pt-6 pb-10">{children}</div>
    </main>
  );
}

// Un campo del formulario de acceso: etiqueta arriba y campo alto, cómodo en el celular.
export function CampoAcceso({
  id,
  etiqueta,
  ...props
}: { id: string; etiqueta: string } & React.ComponentProps<typeof Input>) {
  return (
    <div className="mb-4 grid gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <Input id={id} className="h-12 rounded-xl bg-card px-3.5 text-base" {...props} />
    </div>
  );
}

// La contraseña, con un ojito para mostrarla u ocultarla.
export function CampoContrasena({
  id,
  etiqueta,
  ...props
}: { id: string; etiqueta: string } & Omit<React.ComponentProps<typeof Input>, "type">) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="mb-4 grid gap-1.5">
      <Label htmlFor={id}>{etiqueta}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          className="h-12 rounded-xl bg-card px-3.5 pr-12 text-base"
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar la contraseña" : "Mostrar la contraseña"}
          aria-pressed={visible}
          className="absolute top-1/2 right-1.5 flex size-9 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground outline-none hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {visible ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      </div>
    </div>
  );
}
