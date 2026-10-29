# Parámetros de la generación de rutinas (para revisar)

**Estado al 2026-10-23.** Este documento junta **todo lo que Spotter pide y usa para armar una rutina**: lo que se le pregunta a la persona, lo que se le manda a la IA, las reglas que se le dan, y lo que el código comprueba. Está escrito leyendo el código y el prompt reales (`backend/app/ai/`), no de memoria.

**Cómo leerlo.** En las tablas, la columna **Origen** dice de dónde sale cada valor:
- **Fuente**: viene de una guía o estudio (el detalle y las citas están en `docs/criterios-entrenamiento.md`, reglas R1 a R36).
- **Diseño**: lo eligió el usuario de la app como decisión de diseño, sin una cifra publicada que lo respalde.
- **Técnico**: límite del sistema.

La columna **Lo comprueba** dice quién hace cumplir la regla: la **IA** (se le explica en el prompt), el **código** (valida y puede rechazar o avisar) o los dos.

Al final hay una lista de **puntos para discutir** con la persona que revise.

---

## 1. Lo que se le pide a la persona

### 1.1 Perfil (una sola vez, editable después)

| Dato | Detalle | ¿Va a la IA? |
|---|---|---|
| Nombre | Texto | No |
| Fecha de nacimiento | De ahí se calcula la edad (de 14 a 100 años) | Solo la edad |
| Peso | De 30 a 300 kg. Después se sigue semana a semana (ver 1.3) | Sí |
| Altura | De 100 a 250 cm | Sí |
| Sexo | Masculino, femenino u otro | Sí, si lo indicó |
| Lesiones o limitaciones | Texto libre, hasta 1.000 caracteres | Sí, como dato del usuario |
| Aviso legal | "La app no da consejo médico": se acepta una vez | No |

No se manda a la IA el nombre ni el correo.

### 1.2 Al empezar o continuar una rutina

| Dato | Opciones | Origen |
|---|---|---|
| **Objetivo** | masa · fuerza · perder grasa · mantenerme activo | Diseño |
| **Nivel** | principiante · intermedio · avanzado | Diseño |
| **Días por semana** | Principiante: 2 o 3. El resto: de 2 a 6 | Convención y decisión de producto (R11, R12): ninguna fuente prescribe una cantidad de días |
| **Estructura (split)** | Cuerpo completo · torso/pierna · empuje/tirón/piernas (PPL), según las opciones compatibles | Decisión de producto 91; no hay una estructura prescrita por las fuentes |
| Equipamiento | No se pregunta: se da por hecho un gimnasio completo | Diseño |
| *Tiempo por sesión* | **Apagado por ahora.** No se pide; la duración es solo un dato de control (ver 8) | Diseño |

Al **continuar** una rutina, el objetivo y el nivel quedan fijos y los días y el split guardados aparecen seleccionados; se pueden cambiar dentro de las opciones compatibles.

### 1.3 Durante y al cerrar la semana

| Dato | Detalle | ¿Va a la IA? |
|---|---|---|
| Lo realizado | Por cada serie: repeticiones (o minutos o segundos) y peso, si difiere del plan | Sí, en la semana siguiente |
| Ejercicio hecho y día completado | Se marcan con un tilde | Sí (un día no completado cuenta como no hecho) |
| Comentario de cierre | Texto opcional, hasta 1.000 caracteres: cómo se sintió, dolor, molestias | Sí, como dato del usuario |
| Peso y grasa corporal | Opcionales al cerrar la semana o cuando quiera | **No** |
| Marcas de carga y dolor por ejercicio | Ya no se piden en pantalla (decisión 85); si hay datos viejos, se mandan | Solo los viejos |

---

## 2. Lo que se le manda a la IA

1. **El perfil, sin nombre ni correo:** edad, peso, altura, sexo, nivel, objetivo, "gimnasio completo" y las limitaciones (encerradas entre etiquetas `<datos_usuario>` para que se tomen como datos y no como órdenes).
2. **Los días por semana** ("armá exactamente N días").
3. **La lista de ejercicios disponibles** (el catálogo filtrado, ver 6.4).
4. **Si continúa una rutina:** la última semana cerrada, serie por serie (lo planificado contra lo real), la **señal de cada ejercicio** que calcula el código (ver 9) y el comentario de cierre.
5. **Todas las reglas** de este documento, en el texto del prompt (`backend/app/ai/prompts/generar_rutina.md`).

La IA responde un JSON con la semana. El código lo valida y, si no cumple, pide una vez más (máximo 2 intentos).

---

## 3. Reglas según el objetivo

| Objetivo | Series semanales por grupo grande | Series por ejercicio | Repeticiones | Fuerza | Cardio por semana | Origen |
|---|---|---|---|---|---|---|
| **Masa** | 10 a 20 | (no fija; ver nota) | 6 a 15 (8 a 12 de referencia) | — | No lleva | Evidencia (R3, ACSM 2026, certeza media) |
| **Fuerza** | no fija | 2 a 3, con cargas de 80 % del máximo o más | 3 a 8; el ejercicio principal va primero | — | No lleva | Evidencia (R4, ACSM 2026) |
| **Perder grasa** | 2 a 4 series duras | — | — | Al menos 2 días, manteniendo la carga | 150 a 300 min, a intensidad moderada | Cardio: evidencia (R17, OMS 2020). Series: síntesis del investigador, certeza baja (R20) |
| **Mantenerme activo** | 6 a 10 | 2 a 3 | 6 a 15 | 2 a 3 sesiones | 150 a 300 min | Síntesis del investigador, certeza baja a moderada (R25; absorbió a "condición general", decisión 100) |

Notas:
- **Perder grasa:** si cardio y fuerza van el mismo día, la fuerza va primero; si se dividen, con 3 horas o más de separación. La alimentación queda fuera de la app. El código **rechaza** una rutina de perder grasa con cardio fuera de 150 a 300 min (R17).
- **En todos los objetivos:** no hace falta llegar al fallo; la idea es dejar **2 o 3 repeticiones en reserva**.
- Los **6 grupos grandes** son pecho, espalda, hombros, cuádriceps, isquios y glúteos. Bíceps, tríceps, gemelos y core no tienen un mínimo propio.
- R3 (10 o más series) **vale también para principiantes**. R20 y R25 son síntesis del investigador, no cifras publicadas.

---

## 4. La estructura de la semana

| Regla | Valor | Origen | Lo comprueba |
|---|---|---|---|
| Días por semana | 2 a 6 (R11); principiante 2 o 3 (R12) | Convención y decisión de producto | Código (rechaza) |
| Días exactamente iguales a los elegidos | Sí | Diseño | Código (rechaza) |
| Fuerza mínima | Al menos 2 días (R1) | Fuente | Código (rechaza) |
| Grupos cubiertos | Los 6 grupos grandes, al menos 1 serie (R1) | Fuente | Código (rechaza) |
| Frecuencia por grupo | La estructura elegida y el reparto de decisión 90 determinan los días por grupo; cada grupo grande aparece al menos 2 días cuando hay 3 o más días de fuerza | Fuente (ACSM 2026) y decisión de diseño 90 | Código valida el split; reparto reintenta y luego avisa |
| Descanso | Siempre al menos un día sin entrenar | Diseño | IA |

**Opciones por cantidad de días** (la persona elige una, decisión 91; el código valida compatibilidad y estructura):

| Días | Estructuras disponibles |
|---|---|
| 2 | Cuerpo completo; torso/pierna salvo objetivo masa |
| 3 | Cuerpo completo |
| 4 | Cuerpo completo o torso/pierna |
| 5 | Cuerpo completo o torso/pierna |
| 6 | Cuerpo completo, torso/pierna o PPL × 2 |

Principiante: solo 2 o 3 días de cuerpo completo.

---

## 5. Cómo se cuentan las series

- Una serie **directa** (músculo principal) vale **1**.
- Una serie **indirecta** (músculo secundario) vale **0,5** (decisión 61; convención con apoyo parcial: una metarregresión de Pelland 2026, vista solo por resumen).
- Cuentan solo los **sinergistas principales**; los estabilizadores no suman (R5b).
- Cardio y movilidad no suman series a ningún músculo.

---

## 6. Los ejercicios

### 6.1 Tipos y cómo se mide cada serie

| Tipo | Ejemplos | Cada serie se mide en |
|---|---|---|
| Fuerza (`strength`) | Press de banca, sentadilla | Repeticiones (1 a 50) y peso |
| Isométrico (`isometric`) | Plancha | Segundos (1 a 600) |
| Cardio (`cardio`) | Cinta, bicicleta, caminata | Minutos (1 a 180), sin peso ni descanso |

### 6.2 Límites técnicos de una rutina

Hasta 12 ejercicios por día, 10 series por ejercicio, hasta 4 músculos secundarios por ejercicio, de 1 a 7 días en el formato (el código exige de 2 a 6).

### 6.3 Orden, descanso y movilidad

| Parámetro | Valor | Origen |
|---|---|---|
| Orden dentro de la sesión | Grupos grandes antes que chicos; multiarticulares antes que monoarticulares | Diseño |
| Descanso | Autorregulado. Guía: 2 a 3 min (120 a 180 s) en multiarticulares pesados; 1 a 2 min (60 a 120 s) en accesorios. Campo editable, de 0 a 600 s | Convención con apoyo parcial (R8): el ACSM 2026 no recomienda tiempos |
| Movilidad y equilibrio | En 2 días por semana, un texto de 5 a 10 min, sin series | Convención, certeza baja (R26, ACSM 2011 en resumen) |
| Series por ejercicio | Según el objetivo: 2 a 3 (fuerza, mantenerme activo). No se pide "3 a 4" | Fuente (decisión 59) |

### 6.4 El catálogo y cómo se eligen los candidatos

- La IA elige **solo** de un catálogo de **124 ejercicios** (`backend/app/ai/exercises.json`): 117 aprobados por el usuario el 2026-10-14 y 7 agregados el 2026-10-26 (decisión 99) que esperan su aprobación. **Falta la revisión de una persona de educación física.**
- Cada ejercicio trae etiquetas obligatorias (R13): región (superior, inferior, core, cuerpo entero), dirección (empuje, tirón), músculo principal, músculos secundarios, mecánica (multiarticular o monoarticular), equipamiento y nivel.
- **Filtro del código:** nunca ejercicios de un nivel más alto que el de la persona; cardio solo en perder grasa y mantenerme activo.
- **Orden por parecido (vectores):** se ordena por similitud con el objetivo y el nivel, y al prompt van **hasta 6 ejercicios por grupo muscular** (cifra de diseño).
- **Las limitaciones NO entran en la búsqueda:** un vector mide parecido, no "evitar". Las limitaciones las razona la IA con el texto del perfil, y el código **no bloquea** ejercicios por una limitación escrita.
- El código **rechaza** cualquier ejercicio que no esté en el catálogo (con sus nombres alternativos), y corrige el nombre y las etiquetas con las del catálogo.

---

## 7. El reparto de las series entre los días (decisión 90)

Reglas de **diseño** elegidas por el usuario el 2026-10-23, que **no son R1 a R36** y no salen de las fuentes. Se cuentan **series directas**, solo en los 6 grupos grandes, y solo en los días de fuerza.

| Regla | Valor | Respaldo en evidencia |
|---|---|---|
| Días en que se trabaja cada grupo grande | Al menos 2, si la rutina tiene 3 o más días de fuerza | Medio (ACSM 2026) |
| Diferencia de series entre los días de un mismo grupo | 3 como máximo | Ninguno (diseño) |
| Series de un mismo grupo en un día | 9 como máximo (3 ejercicios de 3 series) | Parcial (preprint: unas 11 series fraccionadas por sesión) |
| Diferencia entre el día con más y el con menos series de grupos grandes | 4 como máximo | Ninguno (diseño) |
| Complemento (bíceps, tríceps, gemelos, abdominales) | Hasta 6 series por día; no cuenta para el volumen de los grupos grandes ni completa un día | Ninguno (diseño) |

Si no se cumplen, el código **pide la rutina de nuevo una vez**; si el segundo intento tampoco entra, la acepta con el aviso "Reparto".

---

## 8. La duración de cada sesión

**Por ahora no se elige:** el tiempo es solo un **dato de control** que se muestra (por ejemplo, "~68 min" en cada día) para ver cómo salen las rutinas.

**Cómo se estima (R34, el código y el prompt usan la misma cuenta):**

> repeticiones × **3 s** (en un isométrico, sus segundos) **+** descanso (series menos una, por `rest_seconds`) **+** **3,5 min** de cambio entre ejercicios **+** minutos de cardio **+** **7,5 min** de movilidad en los días que la tengan.

Los 3 segundos por repetición salen de un resumen del ACSM 2009 (certeza baja); el cambio de 3,5 minutos y la movilidad de 7,5 son estimaciones de diseño.

**Referencia de duración (R18, es una guía y no un tope):**

| Perfil | Referencia |
|---|---|
| Principiante y mantenerme activo | Cerca de 60 min |
| Intermedio con masa o fuerza | 60 a 90 min |
| Perder grasa | 60 min de fuerza, más el cardio |
| Avanzado con masa o fuerza | No definida |

El código **avisa** (no rechaza) si un día se aleja más de 15 minutos de la referencia. Si el volumen no entra en la duración de referencia, la IA actúa así (R35): **no suma días**, porque la persona ya los eligió; primero **alarga la sesión y lo avisa**; solo como último recurso recorta las series de menor prioridad (accesorios y músculos chicos: bíceps, tríceps, gemelos y core) y también lo avisa.

*Guardado y apagado:* la opción de que la persona elija el tiempo (decisiones 82, 88 y 89) sigue en el código con opciones de 40, 60 y 80 minutos, pero hoy no se muestra.

---

## 9. La progresión de la semana siguiente

### 9.1 La señal de cada ejercicio (la calcula el código)

Por cada ejercicio de la semana anterior, el código compara lo planificado con lo real, serie por serie, **primero el peso** y, si es igual, las repeticiones:

| Señal | Cuándo |
|---|---|
| **Superó** | Más de la mitad de las series superaron el plan y ninguna quedó por debajo |
| **Cumplió** | Cualquier otro caso |
| **No llegó** | Más de la mitad de las series quedaron por debajo del plan |
| **Sin registrar** | No se cargó ninguna serie |

Más peso con menos repeticiones cuenta como progresión (decisión 73).

### 9.2 Qué hace la IA con cada señal

| Señal | Qué hace | Origen |
|---|---|---|
| Superó | Sube la carga **entre 2 % y 10 %**, redondeada al salto de peso del equipo y nunca menos de un salto. Parte del **peso que realmente levantó** | Convención (R9, R28; ACSM 2009, que el ACSM 2026 reemplazó) |
| Cumplió | Mantiene la carga y las repeticiones | Fuente |
| No llegó | **Mantiene** la carga. Baja **un escalón respecto del peso planificado** (el peso lo calcula el código y se lo pasa a la IA; decisión 101) (el salto mínimo del equipo, sin porcentaje; si lo levantado ya fue más bajo, usa lo levantado) y lo cuenta como una baja en el resumen, solo si el comentario cuenta fatiga o cargas demasiado altas (o hay una marca vieja de "muy pesada") | Diseño (R36) |
| Sin registrar | Es información, no un error: no lo castiga ni lo rellena | Diseño |

Un dato aislado no decide: una sola serie rara no cambia la carga de todo el ejercicio. Mantiene los **mismos ejercicios** de la semana anterior (solo cambia uno si hay dolor o una limitación que lo pida).

### 9.3 Saltos de peso por equipo (los usa la IA para redondear)

| Equipo | Salto |
|---|---|
| Barra | 2,5 kg (discos de 1,25 por lado) |
| Mancuernas | 2,5 kg |
| Pesas rusas | 4 kg |
| Máquinas con discos olímpicos (prensa, hack) | 2,5 kg |
| Máquinas y poleas con pila de placas | 5 kg (puede no existir el peso exacto: la persona lo ajusta) |

Elegidos por el usuario; no hay una ficha del fabricante del gimnasio.

### 9.4 El código avisa

Si un peso propuesto sube **más de 10 %** sobre el último peso realizado, muestra un aviso (no rechaza).

---

## 10. Seguridad y dolor

- La IA **no da diagnósticos ni consejo médico**.
- Respeta las **lesiones o limitaciones** escritas: evita los ejercicios que las carguen, o baja la carga o cambia el ejercicio.
- **Semáforo de dolor de 0 a 10** (umbrales de diseño, aprobados como elección, sin valor validado):
  - hasta **2**: seguir;
  - de **3 a 5**: bajar la carga o el recorrido, o cambiar el ejercicio;
  - **más de 5**, o dolor articular, punzante, persistente, en reposo o con hormigueo: no incluir ejercicios que lo comprometan y agregar un aviso para que consulte a un profesional.
- Ante dolor en el comentario de cierre, no sube la carga de ese ejercicio.
- Una limitación como "silla de ruedas" solo llega a la IA como texto: el código **no la hace cumplir** (las restricciones motrices quedaron fuera del alcance, decisión 105).

---

## 11. Qué comprueba el código

### Rechaza la rutina (la IA tiene que rehacerla)
- Cantidad de días fuera de 2 a 6, o un principiante con 4 o más (R11, R12).
- Días distintos de los que eligió la persona.
- Split incompatible con los días, el nivel o el objetivo.
- Menos de 2 días de fuerza o faltan grupos grandes (R1).
- Perder grasa con cardio fuera de 150 a 300 min (R17).
- Ejercicios fuera del catálogo o con el tipo equivocado.

### Solo avisa (se ve en la pestaña Avisos)
- Volumen por objetivo fuera de rango (R3, R4, R20, R25), por ejemplo "chest: 8 series por semana y debería haber de 10 a 20".
- Duración de un día lejos de la referencia (R34).
- Un peso que sube más de 10 % (R9).
- El reparto entre días (sección 7): primero pide un reintento y después avisa.
- Que un día no trabaje los grupos de su foco en el split elegido (por ejemplo, un día de torso sin hombros como músculo principal): también pide un reintento y después avisa con la etiqueta "Split" (cambiado el 2026-10-26; antes rechazaba la rutina y la generación fallaba tras el reintento).

### Reintentos
Hasta **2 intentos** por generación (la llamada inicial y uno más). Cada intento cuenta en los topes de la IA.

---

## 12. Parámetros técnicos de la IA

| Parámetro | Valor |
|---|---|
| Modelo de generación | El que está configurado en el entorno (verificado el 2026-10-08: `gemini-3.5-flash-lite`) |
| Modelo de vectores (RAG) | `gemini-embedding-001`, 768 dimensiones |
| Topes de la app | 12 llamadas por minuto y 400 por día (el plan gratuito permite 15 y 500; Google aclara que no están garantizados) |
| Una generación a la vez | Por persona; si hay una en curso, la nueva se rechaza sin llamar a la IA |
| Tiempo máximo de una llamada | 120 segundos |
| Cuándo se llama | Solo cuando la persona toca "Generar rutina". Nunca en segundo plano ni por fecha |
| Qué se propone | La IA siempre **propone**: se guarda como propuesta y se escribe en el plan solo al aceptarla |

---

## 13. Qué es evidencia y qué es diseño (resumen)

**Con evidencia** (ver `criterios-entrenamiento.md`): fuerza al menos 2 días y todos los grupos grandes (ACSM 2026 y OMS 2020), volumen de masa de 10 a 20 series semanales, series por ejercicio de 2 a 3, 150 a 300 min de aeróbico (OMS 2020), 2 a 3 repeticiones en reserva.

**Convención con apoyo parcial o débil:** progresión de 2 % a 10 % por semana (ACSM 2009, reemplazado), indirectas a 0,5, descanso, movilidad, cantidad de días y reparto por defecto (ninguna fuente prescribe un split).

**Diseño del usuario, sin cifra publicada:** el semáforo de dolor y sus umbrales; el máximo de series por sesión y las diferencias entre días (sección 7); el cambio de 3,5 minutos entre ejercicios y los 7,5 de movilidad; "hasta 6 ejercicios por grupo" que llegan a la IA; los saltos de peso de las máquinas; el orden dentro de la sesión; bajar un escalón ante "no llegó" con fatiga; el reparto por defecto de 4, 5 y 6 días.

**Aviso general:** casi toda la evidencia de hipertrofia y fuerza viene de varones jóvenes y poco entrenados. Varias fuentes se leyeron por resumen y hay preprints sin revisión de pares.

---

## 14. Pendientes reales

- Revisión del catálogo de 124 ejercicios por una persona con formación en educación física.
- Consulta al profesor sobre si la recuperación con pgvector cumple lo que espera para el proyecto (decisión 58).
- Las restricciones motrices están fuera del alcance (decisión 105): no hay reglas R37 a R42 ni bloqueos nuevos.

Las reglas R1 a R36, el reparto de la decisión 90 y las tres estructuras de la decisión 91 ya están decididos. No volver a presentarlos como preguntas abiertas.
