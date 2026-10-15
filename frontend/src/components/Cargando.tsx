import { cn } from "cn";

// Una barra a la que se le van cargando discos, de a uno, y vuelve a empezar: rojo, azul y
// amarillo, como los discos de gimnasio (la animación está en globals.css; con "reducir
// movimiento" quedan todos puestos). Es lo que se ve mientras llegan datos.
export function CargandoDiscos({ etiqueta = "Cargando", className }: { etiqueta?: string; className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex min-h-[calc(100svh-16rem)] flex-col items-center justify-center gap-2 text-muted-foreground", className)}
    >
      <svg viewBox="0 0 96 48" aria-hidden="true" className="h-12 w-auto text-foreground">
        <rect x="4" y="22" width="88" height="4" rx="2" fill="currentColor" />
        {/* Como en una barra de verdad: los discos grandes van pegados al centro y los chicos, afuera. */}
        <rect x="31" y="6" width="7" height="36" rx="3" className="carga-disco carga-disco-a fill-disco-rojo" />
        <rect x="58" y="6" width="7" height="36" rx="3" className="carga-disco carga-disco-a fill-disco-rojo" />
        <rect x="23" y="12" width="6" height="24" rx="2.5" className="carga-disco carga-disco-b fill-disco-azul" />
        <rect x="67" y="12" width="6" height="24" rx="2.5" className="carga-disco carga-disco-b fill-disco-azul" />
        <rect x="16" y="17" width="5" height="14" rx="2" className="carga-disco carga-disco-c fill-disco-amarillo" />
        <rect x="75" y="17" width="5" height="14" rx="2" className="carga-disco carga-disco-c fill-disco-amarillo" />
      </svg>
      <span className="text-sm">{etiqueta}…</span>
    </div>
  );
}

// Lo que se ve mientras la pantalla lee la URL (el <Suspense> de las páginas con parámetros) o
// mientras llegan los datos de una pantalla entera.
export function Cargando() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4">
      <CargandoDiscos />
    </main>
  );
}
