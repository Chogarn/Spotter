# Mapa muscular con más detalle: borrador por fases

Estado: **borrador sin aprobar, sin código** (2026-10-26). Pedido del usuario: que el mapa pueda pintar todas las piezas y las partes de cada músculo, sin vista lateral. Se resuelve en el backend (catálogo y estadísticas) y en el dibujo.

## Qué falta pintar hoy

La librería (react-native-body-highlighter 3.2.0, copiada en `frontend/src/lib/cuerpoMusculos.ts`) trae 22 piezas. Hoy se pintan 13. Las 9 que quedan sin pintar:

| Pieza | Qué es | Partes que se podrían separar | Propuesta |
|---|---|---|---|
| `forearm` | antebrazo | flexores, extensores, braquiorradial | pintar |
| `adductors` | cara interna del muslo | una sola pieza en el dibujo | pintar |
| `tibialis` | espinilla | una sola pieza | pintar |
| `neck` | cuello | una sola pieza | pintar |
| `head`, `hands`, `feet`, `ankles`, `knees` | no son músculos de entrenamiento | no tienen | quedan como silueta (a confirmar) |

## Partes de los músculos que ya pintamos y hoy no se separan

Hay que dibujarlas: la librería no las trae.

- **Hombro** (`deltoids`): cabeza anterior, lateral y posterior.
- **Pecho:** parte alta (clavicular) y parte baja (esternal).
- **Espalda:** dorsal, romboides, trapecio (alto, medio y bajo) y lumbar.
- **Cuádriceps:** recto femoral, vasto lateral y vasto medial.
- **Bíceps:** cabeza larga y corta. **Tríceps:** larga, lateral y medial.
- **Glúteo:** mayor y medio.
- **Gemelos:** gastrocnemio y sóleo. **Isquios:** bíceps femoral y semitendinoso.

## Diseño propuesto

Una **capa de detalle encima de los 10 grupos actuales**, sin cambiar el enum `Muscle`:

- R3, R5b, R13, el prompt y la IA siguen con los 10 grupos. No cambian.
- Cada ejercicio del catálogo gana `detail_muscles`: qué partes finas trabaja, con directo e indirecto como R5b (indirecto cuenta 0,5).
- Las estadísticas devuelven, además de `muscles` y `others`, las series por parte fina.
- El mapa pinta por parte fina. El radar sigue con los grupos de siempre.

## Fases

1. **Fase 1: las 4 piezas que ya están dibujadas** (antebrazo, aductores, tibial y cuello). Incluye el campo `detail_muscles` en el catálogo (solo para esas partes), el conteo en el backend y el pintado. No hay que dibujar nada.
2. **Fase 2: hombro, pecho y espalda partidos.** Dibujar las piezas nuevas (el trabajo más grande) y etiquetar los ejercicios de esos grupos.
3. **Fase 3: piernas, brazos y glúteo.** Cuádriceps, bíceps, tríceps, glúteo, gemelos e isquios.
4. **Fase 4: revisión** de una persona con formación en educación física, junto con la del catálogo.

Cada fase termina con: qué revisar y qué decidí sin preguntar.

## Decisiones abiertas

1. ~~¿Cabeza, manos, pies, tobillos y rodillas quedan como silueta?~~ **Resuelta (2026-10-26):** quedan como silueta. Son estabilizadores o no son músculos de entrenamiento, y R5b dice que los estabilizadores no suman, así que no se pintan ni llevan series.
2. ¿Los `detail_muscles` de los 117 ejercicios se etiquetan con un borrador mío (con fuentes de anatomía) para que el usuario lo apruebe, como R13?
3. ¿Las partes finas cuentan para algún mínimo de series, o son solo para ver el mapa? Propuesta: **solo para ver**, sin reglas nuevas.
4. Si el catálogo cambia, ¿se vuelve a indexar? (Solo si `detail_muscles` entra en el texto que se embebe; propuesta: no entra.)
