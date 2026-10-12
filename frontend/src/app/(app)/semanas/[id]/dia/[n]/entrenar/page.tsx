import { Suspense } from "react";

import { Cargando } from "@/components/Cargando";

import EntrenarView from "./EntrenarView";

// Esta página no lee `params` ella misma: se lo pasa a la vista, que lo lee dentro del <Suspense>.
export default function EntrenarPage({ params }: { params: Promise<{ id: string; n: string }> }) {
  return (
    <Suspense fallback={<Cargando />}>
      <EntrenarView params={params} />
    </Suspense>
  );
}
