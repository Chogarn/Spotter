import { Suspense } from "react";

import { Cargando } from "@/components/Cargando";

import SemanaView from "./SemanaView";

// Esta página no lee `params` ella misma: se lo pasa a la vista, que lo lee dentro del <Suspense>
// (así Next puede preparar el resto de la pantalla sin esperar a la URL).
export default function SemanaPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Cargando />}>
      <SemanaView params={params} />
    </Suspense>
  );
}
