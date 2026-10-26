import { CalendarCheck, CalendarDays, ChartLine, Radar, Scale, User } from "lucide-react";

import { Franja } from "@/components/Franja";
import { TarjetaAcceso } from "@/components/TarjetaAcceso";

// Progreso: el índice. Cada estadística es su propia pantalla (sin pestañas dentro de pestañas) y
// se llega a ellas desde acá.
export default function Progreso() {
  return (
    <main className="flex flex-1 flex-col">
      <Franja titulo="Progreso" aros="azul" volver={{ href: "/" }} />
      <div className="mx-auto w-full max-w-xl px-4 pt-5">
        <nav aria-label="Tu progreso" className="grid grid-cols-1 gap-2.5">
          <TarjetaAcceso href="/progreso/resumenes" Icono={CalendarCheck} texto="Resúmenes de cada semana" />
          <TarjetaAcceso href="/progreso/musculos" Icono={Radar} texto="Series por músculo" />
          <TarjetaAcceso href="/progreso/mapa" Icono={User} texto="Mapa muscular" />
          <TarjetaAcceso href="/progreso/ejercicios" Icono={ChartLine} texto="Evolución por ejercicio" />
          <TarjetaAcceso href="/progreso/calendario" Icono={CalendarDays} texto="Calendario" />
          <TarjetaAcceso href="/progreso/cuerpo" Icono={Scale} texto="Cuerpo y peso" />
        </nav>
      </div>
    </main>
  );
}
