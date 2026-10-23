import { Suspense } from "react";

import { Cargando } from "@/components/Cargando";

import DiaView from "./DiaView";

// Esta página no lee `params` ni `searchParams` ella misma: se los pasa a la vista, que los lee
// dentro del <Suspense>. `?desde=rutinas` abre el día solo para mirar (decisión 53).
export default async function DiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; n: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  const { id, n } = await params;
  return (
    <Suspense fallback={<Cargando />}>
      {/* Next conserva el estado del page al navegar entre días; la key separa sus estados. */}
      <DiaView key={`${id}-${n}`} params={Promise.resolve({ id, n })} searchParams={searchParams} />
    </Suspense>
  );
}
