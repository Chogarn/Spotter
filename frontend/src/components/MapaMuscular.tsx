"use client";

import { useLayoutEffect, useRef, useState } from "react";

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
  // La caja de cada dibujo trae aire de sobra: se mide el cuerpo real y se recorta a él (con un margen
  // chico) para que no quede un hueco arriba ni abajo. Mientras se mide vale la caja de siempre.
  const grupo = useRef<SVGGElement>(null);
  const [recorte, setRecorte] = useState<{ clave: string; caja: string } | null>(null);
  const clave = `${cuerpo}-${vista}`;
  useLayoutEffect(() => {
    const b = grupo.current?.getBBox();
    if (!b || b.width === 0) return;
    const m = 20;
    setRecorte({ clave, caja: `${b.x - m} ${b.y - m} ${b.width + 2 * m} ${b.height + 2 * m}` });
  }, [clave]);
  return (
    <svg
      viewBox={recorte?.clave === clave ? recorte.caja : dibujo.caja[vista]}
      className="mx-auto block h-auto w-full max-w-80"
      role="img"
      aria-label={descripcion}
    >
      {/* Cada músculo va pintado según su intensidad (en blanco si no se trabajó), con un borde fino. Sin
          contorno aparte alrededor del cuerpo. */}
      <g ref={grupo}>
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
      </g>
    </svg>
  );
}
