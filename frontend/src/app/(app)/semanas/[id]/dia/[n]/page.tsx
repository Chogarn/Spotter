import { Suspense } from "react";

import { Cargando } from "@/components/Cargando";

import DiaView from "./DiaView";

// Esta página no lee `params` ella misma: se lo pasa a la vista, que lo lee dentro del <Suspense>.
export default function DiaPage({ params }: { params: Promise<{ id: string; n: string }> }) {
  return (
    <Suspense fallback={<Cargando />}>
      <DiaView params={params} />
    </Suspense>
  );
}
