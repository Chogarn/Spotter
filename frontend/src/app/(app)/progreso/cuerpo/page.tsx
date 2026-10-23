import { Franja } from "@/components/Franja";
import { PestanasProgreso } from "@/components/PestanasProgreso";
import { SeguimientoCuerpo } from "@/components/SeguimientoCuerpo";

// Cuerpo: el seguimiento del peso (y la grasa corporal, si la medís), cargado a mano (decisión 87).
export default function CuerpoPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Franja titulo="Progreso" aros="azul" />
      <div className="mx-auto w-full max-w-xl px-4 pt-5">
        <PestanasProgreso actual="/progreso/cuerpo" />
        <SeguimientoCuerpo />
      </div>
    </main>
  );
}
