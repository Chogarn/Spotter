import { BarraNavegacion } from "@/components/BarraNavegacion";
import { DescansoProvider } from "@/components/Descanso";

// Pantallas con sesión: todas llevan la barra de abajo. Bienvenida, login y registro quedan
// fuera de este grupo (los paréntesis no cambian las direcciones). El reloj de descanso vive acá
// para que siga corriendo al cambiar de pantalla (#59).
export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <DescansoProvider>
      {/* Espacio al final para que la barra fija (y la franja del descanso) no tapen el contenido. */}
      <div className="flex flex-1 flex-col pb-40">{children}</div>
      <BarraNavegacion />
    </DescansoProvider>
  );
}
