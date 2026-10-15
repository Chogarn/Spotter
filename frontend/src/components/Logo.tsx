import { cn } from "cn";

// Logo provisorio de Spotter: una barra con discos de perfil. La barra y los discos grandes toman
// el color del texto (sirve sobre fondo claro y oscuro); los chicos van en rojo.
export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 40"
      role="img"
      aria-label="Spotter"
      className={cn("h-8 w-auto", className)}
    >
      <rect x="2" y="18" width="60" height="4" rx="2" fill="currentColor" />
      <rect x="7" y="4" width="8" height="32" rx="3" fill="currentColor" />
      <rect x="49" y="4" width="8" height="32" rx="3" fill="currentColor" />
      <rect x="17" y="10" width="6" height="20" rx="2.5" className="fill-disco-rojo" />
      <rect x="41" y="10" width="6" height="20" rx="2.5" className="fill-disco-rojo" />
    </svg>
  );
}
