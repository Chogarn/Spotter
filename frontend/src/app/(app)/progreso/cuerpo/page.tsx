import { Franja } from "@/components/Franja";
import { SeguimientoCuerpo } from "@/components/SeguimientoCuerpo";

// Cuerpo: el seguimiento del peso (y la grasa corporal, si la medís), cargado a mano (decisión 87).
export default function CuerpoPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Franja titulo="Cuerpo y peso" aros="azul" volver={{ href: "/progreso" }} compacta />
      <div className="mx-auto w-full max-w-xl px-4 pt-5">
        <SeguimientoCuerpo />
      </div>
    </main>
  );
}
