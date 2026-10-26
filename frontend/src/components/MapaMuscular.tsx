import { ESPALDA, ESPALDA_MUJER, FRENTE, FRENTE_MUJER } from "@/lib/cuerpoMusculos";

export type Vista = "frente" | "espalda";
export type Cuerpo = "masculino" | "femenino";

// Azules de menos a más series (0 = sin trabajar). El azul es la carga en Disco; el rojo queda
// para "te falta" en el radar.
const COLORES = ["#ffffff", "#b9d0f0", "#6f9ee0", "#1f5fbf", "#123a7a"];

const DIBUJOS = {
  masculino: { frente: FRENTE, espalda: ESPALDA, caja: { frente: "0 0 724 1448", espalda: "724 0 724 1448" } },
  femenino: {
    frente: FRENTE_MUJER,
    espalda: ESPALDA_MUJER,
    caja: { frente: "-50 -40 734 1538", espalda: "756 0 774 1448" },
  },
};

// La silueta del cuerpo con cada músculo pintado según su intensidad (0 a 4). Las piezas que
// no están en `intensidad` quedan sin pintar. El dibujo sale del sexo del perfil.
export function MapaMuscular({
  cuerpo,
  vista,
  intensidad,
  descripcion,
}: {
  cuerpo: Cuerpo;
  vista: Vista;
  intensidad: Record<string, number>;
  descripcion: string;
}) {
  const dibujo = DIBUJOS[cuerpo];
  return (
    <svg
      viewBox={dibujo.caja[vista]}
      className="mx-auto block h-auto w-full max-w-80"
      role="img"
      aria-label={descripcion}
    >
      {/* El cuerpo: la silueta es una línea fina gris alrededor de todas las piezas juntas (un trazo
          gris y otro blanco un poco más angosto encima); los músculos van adentro, en blanco o pintados. */}
      <g fill="#b6bec8" stroke="#b6bec8" strokeWidth={66} strokeLinejoin="round" aria-hidden="true">
        {dibujo[vista].map((p) => p.paths.map((d, i) => <path key={`${p.slug}-${i}`} d={d} />))}
      </g>
      <g fill="#ffffff" stroke="#ffffff" strokeWidth={60} strokeLinejoin="round" aria-hidden="true">
        {dibujo[vista].map((p) => p.paths.map((d, i) => <path key={`${p.slug}-${i}`} d={d} />))}
      </g>
      {dibujo[vista].map((p) => (
        <g
          key={p.slug}
          fill={COLORES[Math.min(4, intensidad[p.slug] ?? 0)]}
          stroke="#7d8794"
          strokeWidth={3}
          strokeLinejoin="round"
        >
          {p.paths.map((d, i) => (
            <path key={i} d={d} />
          ))}
        </g>
      ))}
    </svg>
  );
}
