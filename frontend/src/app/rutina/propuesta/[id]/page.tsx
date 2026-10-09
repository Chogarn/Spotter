import { Suspense } from "react";

import { Cargando } from "@/components/Cargando";

import PropuestaView from "./PropuestaView";

// Esta página no lee `params` ella misma: se lo pasa a la vista, que lo lee dentro del <Suspense>.
export default function PropuestaPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<Cargando />}>
      <PropuestaView params={params} />
    </Suspense>
  );
}
