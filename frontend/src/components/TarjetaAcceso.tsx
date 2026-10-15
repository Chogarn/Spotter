import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { cn } from "cn";

const CLASES =
  "flex flex-col gap-2 rounded-2xl bg-card p-4 text-left font-medium no-underline outline-none hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-60";

// Una tarjeta de acceso (los atajos de Inicio): un ícono y un texto. Es un enlace con `href` o un
// botón con `onClick`; se ve igual. Un solo lugar para que todas las tarjetas de acceso coincidan.
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
      <Icono className="size-6" aria-hidden="true" />
      {texto}
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
