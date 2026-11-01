"use client";

import { useId, useLayoutEffect, useRef, useState } from "react";

import { ESPALDA, ESPALDA_MUJER, FRENTE, FRENTE_MUJER, DELTOIDE_MEDIAL, DORSAL_ANCHO, GEMELO_SOLEO, GLUTEO_MEDIO, PECHO_ALTO, TRICEPS_LARGO } from "@/lib/cuerpoMusculos";

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
  const idRecorte = useId().replace(/:/g, "");
  // El pecho se pinta en dos (alta y baja) cuando llegan las series de cada parte, solo de frente.
  // El hombro, igual: de frente la cabeza anterior y la lateral, de espalda la posterior y la lateral.
  const hombroPartido =
    intensidad.delt_side !== undefined &&
    (vista === "frente" ? intensidad.delt_front !== undefined : intensidad.delt_rear !== undefined);
  // La espalda, igual: dorsal ancho, espalda media y alta (trapecio, redondos) y lumbar.
  const espaldaPartida =
    vista === "espalda" &&
    intensidad.back_lats !== undefined &&
    intensidad.back_mid !== undefined &&
    intensidad.back_low !== undefined;
  // El glúteo, igual: mayor (las piezas grandes) y medio (las chicas de arriba).
  const gluteoPartido =
    vista === "espalda" && intensidad.glute_max !== undefined && intensidad.glute_med !== undefined;
  // El tríceps (cabeza larga, y lateral y medial) y los gemelos (gastrocnemio y sóleo), igual.
  const tricepsPartido = intensidad.triceps_long !== undefined && intensidad.triceps_side !== undefined;
  const gemelosPartidos = intensidad.calf_gastro !== undefined && intensidad.calf_soleus !== undefined;
  const pechoPartido = vista === "frente" && intensidad.chest_upper !== undefined && intensidad.chest_lower !== undefined;
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
      {pechoPartido && (
        <defs>
          <clipPath id={`${idRecorte}-alto`}>
            {PECHO_ALTO[cuerpo].map((d, i) => (
              <path key={i} d={d} />
            ))}
          </clipPath>
        </defs>
      )}
      {hombroPartido && (
        <defs>
          <clipPath id={`${idRecorte}-hombro`}>
            {DELTOIDE_MEDIAL[cuerpo][vista].map((d, i) => (
              <path key={i} d={d} />
            ))}
          </clipPath>
        </defs>
      )}
      {dibujo[vista].map((p) =>
        (p.slug === "triceps" && tricepsPartido) || (p.slug === "calves" && gemelosPartidos) ? (
          <g key={p.slug} stroke="#7d8794" strokeWidth={3} strokeLinejoin="round">
            {p.paths.map((d, i) => {
              const parte =
                p.slug === "triceps"
                  ? vista === "espalda" && TRICEPS_LARGO[cuerpo].includes(i)
                    ? intensidad.triceps_long
                    : intensidad.triceps_side
                  : vista === "espalda" && GEMELO_SOLEO[cuerpo].includes(i)
                    ? intensidad.calf_soleus
                    : intensidad.calf_gastro;
              return <path key={i} d={d} fill={COLORES[Math.min(4, parte)]} />;
            })}
          </g>
        ) : gluteoPartido && p.slug === "gluteal" ? (
          <g key={p.slug} stroke="#7d8794" strokeWidth={3} strokeLinejoin="round">
            {p.paths.map((d, i) => (
              <path
                key={i}
                d={d}
                fill={COLORES[Math.min(4, GLUTEO_MEDIO[cuerpo].includes(i) ? intensidad.glute_med : intensidad.glute_max)]}
              />
            ))}
          </g>
        ) : espaldaPartida && (p.slug === "upper-back" || p.slug === "trapezius" || p.slug === "lower-back") ? (
          <g key={p.slug} stroke="#7d8794" strokeWidth={3} strokeLinejoin="round">
            {p.paths.map((d, i) => {
              const parte =
                p.slug === "lower-back"
                  ? intensidad.back_low
                  : p.slug === "upper-back" && DORSAL_ANCHO[cuerpo].includes(i)
                    ? intensidad.back_lats
                    : intensidad.back_mid;
              return <path key={i} d={d} fill={COLORES[Math.min(4, parte)]} />;
            })}
          </g>
        ) : p.slug === "deltoids" && hombroPartido ? (
          // La cabeza lateral es el hombro entero; encima va la mitad del lado del cuerpo (anterior o posterior).
          <g key={p.slug} stroke="#7d8794" strokeWidth={3} strokeLinejoin="round">
            {p.paths.map((d, i) => (
              <path key={i} d={d} fill={COLORES[Math.min(4, intensidad.delt_side)]} />
            ))}
            <g clipPath={`url(#${idRecorte}-hombro)`} stroke="none">
              {p.paths.map((d, i) => (
                <path
                  key={i}
                  d={d}
                  fill={COLORES[Math.min(4, vista === "frente" ? intensidad.delt_front : intensidad.delt_rear)]}
                />
              ))}
            </g>
            {p.paths.map((d, i) => (
              <path key={`b${i}`} d={d} fill="none" />
            ))}
          </g>
        ) : p.slug === "chest" && pechoPartido ? (
          // La parte baja es el pectoral entero; encima va la parte alta, recortada con una curva.
          <g key={p.slug} stroke="#7d8794" strokeWidth={3} strokeLinejoin="round">
            {p.paths.map((d, i) => (
              <path key={i} d={d} fill={COLORES[Math.min(4, intensidad.chest_lower)]} />
            ))}
            <g clipPath={`url(#${idRecorte}-alto)`} stroke="none">
              {p.paths.map((d, i) => (
                <path key={i} d={d} fill={COLORES[Math.min(4, intensidad.chest_upper)]} />
              ))}
            </g>
            {p.paths.map((d, i) => (
              <path key={`b${i}`} d={d} fill="none" />
            ))}
          </g>
        ) : (
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
        ),
      )}
      </g>
    </svg>
  );
}
