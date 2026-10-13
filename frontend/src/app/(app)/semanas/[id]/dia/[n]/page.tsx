import { Suspense } from "react";

import { Cargando } from "@/components/Cargando";

import DiaView from "./DiaView";

// Esta página no lee `params` ni `searchParams` ella misma: se los pasa a la vista, que los lee
// dentro del <Suspense>. `?desde=rutinas` abre el día solo para mirar (decisión 53).
export default function DiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; n: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  return (
    <Suspense fallback={<Cargando />}>
      <DiaView params={params} searchParams={searchParams} />
    </Suspense>
  );
}
