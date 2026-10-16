import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "cn";

const CLASES =
  "flex min-h-12 items-center gap-2 rounded-2xl bg-card px-3 text-left text-[15px] font-medium whitespace-nowrap no-underline outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60";

// Una tarjeta de acceso (los atajos de Inicio): un ícono y un texto corto, en una sola línea. Es un
// enlace con `href` o un botón con `onClick`; se ve igual. Un solo lugar para que todas las
// tarjetas de acceso coincidan.
export function TarjetaAcceso({
  texto,
  Icono,
  href,
  onClick,
  disabled,
  className,
}: {
  texto: string;
  Icono: LucideIcon;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  const contenido = (
    <>
      <Icono className="size-5 shrink-0" aria-hidden="true" />
      <span className="min-w-0 truncate">{texto}</span>
    </>
  );
  if (href) {
    return (
      <Link href={href} className={cn(CLASES, className)}>
        {contenido}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={cn(CLASES, className)}>
      {contenido}
    </button>
  );
}
