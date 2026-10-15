import { cn } from "cn";

// Logo provisorio de Spotter: una barra con discos de perfil, como en una barra de verdad (los
// grandes adentro y los chicos afuera) y con los colores de los discos de gimnasio: rojo, azul y
// amarillo. La barra toma el color del texto, así sirve sobre fondo claro y oscuro.
export function Logo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 40" role="img" aria-label="Spotter" className={cn("h-8 w-auto", className)}>
      <rect x="2" y="18" width="60" height="4" rx="2" fill="currentColor" />
      <rect x="20" y="4" width="8" height="32" rx="3" className="fill-disco-rojo" />
      <rect x="36" y="4" width="8" height="32" rx="3" className="fill-disco-rojo" />
      <rect x="12" y="9" width="6" height="22" rx="2.5" className="fill-disco-azul" />
      <rect x="46" y="9" width="6" height="22" rx="2.5" className="fill-disco-azul" />
      <rect x="5" y="13.5" width="5" height="13" rx="2" className="fill-disco-amarillo" />
      <rect x="54" y="13.5" width="5" height="13" rx="2" className="fill-disco-amarillo" />
    </svg>
  );
}
