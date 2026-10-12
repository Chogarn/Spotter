import { BarraNavegacion } from "@/components/BarraNavegacion";

// Pantallas con sesión: todas llevan la barra de abajo. Bienvenida, login y registro quedan
// fuera de este grupo (los paréntesis no cambian las direcciones).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      {/* Espacio al final para que la barra fija no tape el contenido. */}
      <div className="flex flex-1 flex-col pb-24">{children}</div>
      <BarraNavegacion />
    </>
  );
}
