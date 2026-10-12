import Link from "next/link";

import { Button } from "@/components/ui/button";

// Pantalla de inicio para quien no tiene sesión. Se ve en "/" (el proxy reescribe la raíz a esta
// ruta cuando no hay cookie de sesión); quien ya inició sesión ve la portada.
export default function Bienvenida() {
  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "4rem 1.5rem" }}>
      <h1>Spotter</h1>
      <p>
        Entrenador de gimnasio con IA que arma tu semana según tu progreso real.
      </p>
      <div className="mt-6 flex flex-col gap-3">
        <Button size="lg" nativeButton={false} render={<Link href="/login" />}>
          Iniciar sesión
        </Button>
        <Button
          size="lg"
          variant="outline"
          nativeButton={false}
          render={<Link href="/registro" />}
        >
          Registrarse
        </Button>
      </div>
    </main>
  );
}
