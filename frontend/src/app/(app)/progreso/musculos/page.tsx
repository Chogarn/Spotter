import { Franja } from "@/components/Franja";
import { RadarMusculos } from "@/components/RadarMusculos";

// Radar de músculos: el radar contra el mínimo de R3, por semana, día, mes o año. Solo lectura.
export default function MusculosPage() {
  return (
    <main className="flex flex-1 flex-col">
      <Franja titulo="Radar de músculos" aros="azul" volver={{ href: "/progreso" }} compacta />
      <div className="mx-auto w-full max-w-xl px-4 pt-3">
        <RadarMusculos modo="radar" />
      </div>
    </main>
  );
}
