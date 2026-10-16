import { cn } from "cn";

// Logo de Spotter (decisión 76): la palabra en Barlow Condensed con la O hecha un disco rojo de frente.
// Es texto y no un dibujo: el tamaño se da con el tamaño de letra (`text-2xl`, `text-5xl`...) y el
// color de las letras es el del texto, así sirve sobre fondo claro y oscuro. El disco es el único
// color: el rojo de la serie hecha.
export function Logo({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Spotter"
      className={cn("inline-flex items-center font-heading font-bold tracking-wide uppercase leading-none", className)}
    >
      <span aria-hidden="true">sp</span>
      <svg aria-hidden="true" viewBox="0 0 40 40" className="mx-[0.03em] size-[0.8em] shrink-0">
        <circle cx="20" cy="20" r="14.5" fill="none" strokeWidth="8" className="stroke-disco-rojo" />
      </svg>
      <span aria-hidden="true">tter</span>
    </span>
  );
}
