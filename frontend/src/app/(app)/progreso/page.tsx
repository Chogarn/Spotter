import { ChartLine, Radar, Scale, User } from "lucide-react";

import { Franja } from "@/components/Franja";
import { TarjetaAcceso } from "@/components/TarjetaAcceso";

// Progreso: el índice. Cada estadística es su propia pantalla (sin pestañas dentro de pestañas) y
// se llega a ellas desde acá.
export default function Progreso() {
  return (
    <main className="flex flex-1 flex-col">
      <Franja titulo="Progreso" aros="azul" volver={{ href: "/" }} />
      <div className="mx-auto flex w-full max-w-xl flex-1 flex-col px-4 pt-5 pb-[calc(var(--alto-barra)+2.5rem)]">
        <nav aria-label="Tu progreso" className="grid flex-1 grid-cols-1 grid-rows-4 gap-3">
          <TarjetaAcceso grande href="/progreso/musculos" Icono={Radar} texto="Radar de músculos" />
          <TarjetaAcceso grande href="/progreso/mapa" Icono={User} texto="Mapa muscular" />
          <TarjetaAcceso grande href="/progreso/ejercicios" Icono={ChartLine} texto="Evolución por ejercicio" />
          <TarjetaAcceso grande href="/progreso/cuerpo" Icono={Scale} texto="Cuerpo y peso" />
        </nav>
      </div>
    </main>
  );
}
