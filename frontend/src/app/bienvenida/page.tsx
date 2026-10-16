import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Logo } from "@/components/Logo";

// Pantalla de inicio para quien no tiene sesión. Se ve en "/" (el proxy reescribe la raíz a esta
// ruta cuando no hay cookie de sesión); quien ya inició sesión ve Inicio.
// Estilo Disco: fondo tinta con tres discos apilados (acá son decoración, no estados).
const PUNTOS = [
  "La IA arma tu semana según tu nivel y tu objetivo",
  "Anotás lo que hacés, serie por serie",
  "La semana siguiente sube según lo que hiciste",
];

export default function Bienvenida() {
  return (
    <main className="relative flex flex-1 flex-col overflow-hidden bg-primary text-primary-foreground">
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-[55%]">
        <span className="absolute -top-20 -right-24 size-80 rounded-full border-[36px] border-disco-rojo" />
        <span className="absolute top-36 right-10 size-52 rounded-full border-[28px] border-disco-azul" />
        <span className="absolute top-12 right-44 size-32 rounded-full border-[20px] border-disco-amarillo" />
      </div>

      <div className="relative mx-auto mt-auto w-full max-w-md px-5 pt-[45vh] pb-10">
        {/* El logo es el título: la palabra y el disco, grandes. */}
        <h1 className="m-0 text-7xl leading-[0.9]">
          <Logo className="text-[5.5rem]" />
        </h1>
        <p className="mt-3 mb-5 text-lg text-primary-foreground/80">Tu entrenador de gimnasio con IA.</p>
        <ul className="m-0 mb-7 grid list-none gap-2.5 p-0">
          {PUNTOS.map((punto) => (
            <li key={punto} className="flex items-start gap-2.5">
              <span aria-hidden="true" className="mt-1.5 size-2.5 shrink-0 rounded-full bg-primary-foreground" />
              {punto}
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-3">
          <Button
            size="xl"
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Iniciar sesión
          </Button>
          <Button
            size="xl"
            variant="outline"
            className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            nativeButton={false}
            render={<Link href="/registro" />}
          >
            Crear cuenta
          </Button>
        </div>
      </div>
    </main>
  );
}
