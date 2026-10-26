import { Suspense } from "react";

import { Cargando } from "@/components/Cargando";

import DiaView from "./DiaView";

// El componente que resuelve los parámetros vive dentro de Suspense: Next puede esperar la ruta
// sin bloquear el prerenderizado. `?desde=rutinas` abre el día solo para mirar (decisión 53).
export default function DiaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; n: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  return (
    <Suspense fallback={<Cargando />}>
      <DiaConParametros params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function DiaConParametros({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; n: string }>;
  searchParams: Promise<{ desde?: string }>;
}) {
  const { id, n } = await params;
  return (
    // Next conserva el estado del page al navegar entre días; la key separa sus estados.
    <DiaView key={`${id}-${n}`} params={Promise.resolve({ id, n })} searchParams={searchParams} />
  );
}
