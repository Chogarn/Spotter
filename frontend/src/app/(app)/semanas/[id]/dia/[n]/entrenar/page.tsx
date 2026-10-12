import { Suspense } from "react";

import { Cargando } from "@/components/Cargando";

import EntrenarView from "./EntrenarView";

// Esta página no lee `params` ni `searchParams` ella misma: se los pasa a la vista, que los lee
// dentro del <Suspense>. `?ejercicio=K` abre ese ejercicio (desde la tarjeta del día).
export default function EntrenarPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; n: string }>;
  searchParams: Promise<{ ejercicio?: string }>;
}) {
  return (
    <Suspense fallback={<Cargando />}>
      <EntrenarView params={params} searchParams={searchParams} />
    </Suspense>
  );
}
