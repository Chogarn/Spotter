import { Franja } from "@/components/Franja";
import { RadarMusculos } from "@/components/RadarMusculos";

// Mapa muscular: las mismas series por músculo, pintadas sobre el cuerpo. Solo lectura.
export default function MapaPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Franja titulo="Mapa muscular" aros="azul" volver={{ href: "/progreso" }} compacta />
      <div className="mx-auto w-full max-w-xl px-4 pt-3">
        <RadarMusculos modo="mapa" />
      </div>
    </main>
  );
}
