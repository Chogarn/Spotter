# Mapa muscular, Fase 1: borrador de etiquetas `detail_muscles`

Estado: **borrador sin aprobar** (2026-10-26). Parte de `docs/mapa-muscular-detalle-borrador.md`. Las etiquetas salen de mi conocimiento de anatomía y **no las verifiqué con fuentes**: antes de aprobarlas hay que conseguirlas (EMG y textos de cinesiología) y que las mire una persona de educación física.

## Regla propuesta

- `detail_muscles` es una lista de partes finas que el ejercicio trabaja **como sinergista principal**. Los estabilizadores no entran (R5b, decisión 60).
- Cuentan 0,5 serie cada una (como las indirectas, decisión 61). Solo sirven para pintar el mapa: no cambian R3, el radar ni la IA.
- Fase 1 usa 4 partes: `forearm`, `adductors`, `tibialis` y `neck`.

## Hallazgo: dos de las cuatro no tienen ningún ejercicio

El catálogo de 117 ejercicios no tiene ninguno que trabaje **tibial** o **cuello** como parte principal, ni un ejercicio directo de antebrazo o aductores (curl de muñeca, máquina de aductores). El tibial y el cuello trabajan como estabilizadores (sentadilla, remo), y eso no suma.

| Parte | Ejercicios del catálogo que la etiquetarían | Resultado en el mapa |
|---|---|---|
| Aductores | 20 propuestos (abajo) | se pinta |
| Antebrazo | 1 propuesto (curl martillo) | se pinta, con muy poco |
| Tibial | ninguno | queda sin pintar |
| Cuello | ninguno | queda sin pintar |

## Etiquetas propuestas

**Aductores** (el aductor mayor extiende la cadera y trabaja con glúteo e isquios):

- Certeza media, sentadillas, prensa y zancadas (14): `sentadilla_barra`, `sentadilla_frontal_barra`, `sentadilla_goblet`, `sentadilla_goblet_kettlebell`, `sentadilla_bulgara`, `sentadilla_hack_maquina`, `sentadilla_smith`, `sentadilla_peso_corporal`, `prensa_piernas`, `prensa_una_pierna`, `zancadas_mancuernas`, `zancadas_peso_corporal`, `zancada_inversa_mancuernas`, `step_up_mancuernas`.
- Certeza baja, bisagra de cadera y puentes (6): `peso_muerto_convencional`, `peso_muerto_rumano_barra`, `peso_muerto_rumano_mancuernas`, `hip_thrust_barra`, `hip_thrust_mancuerna`, `puente_gluteos`.
- Sin etiqueta a propósito: `hip_thrust_maquina` y `kettlebell_swing` (poca evidencia), y `abduccion_cadera_maquina` y `caminata_lateral_banda` (trabajan el lado opuesto: abductores).

**Antebrazo** (braquiorradial, sinergista principal del codo con agarre neutro):

- Certeza media: `curl_martillo`.
- Sin etiqueta: curls con barra y mancuernas (el braquiorradial ayuda poco con la palma hacia arriba), y dominadas y remos (el agarre es estabilizador y no suma).

**Tibial y cuello:** ninguno.

## Lo que tenés que decidir

1. **Aductores:** ¿entran los 14 de certeza media y los 6 de certeza baja, o solo los 14?
2. **Antebrazo:** ¿vale pintarlo con un solo ejercicio (curl martillo)? Se vería casi siempre apagado.
3. **Tibial y cuello:** ¿se dejan sin pintar (el dibujo existe, pero ningún ejercicio lo trabaja) o se suman ejercicios al catálogo? Sumar ejercicios es otro trabajo: elegir ejercicios seguros (el cuello pide cuidado, sobre todo para principiantes), etiquetar R13, reindexar los vectores y que la persona de educación física los revise. **Mi recomendación: dejarlos sin pintar por ahora.**
4. **Fuentes:** antes de aprobar los 20 + 1, busco las fuentes (EMG de aductor mayor en sentadilla, peso muerto y hip thrust; braquiorradial en curl martillo) y las anoto en `docs/criterios-entrenamiento.md` como hacemos con las reglas.
