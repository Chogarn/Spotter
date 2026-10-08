# Decisiones de Spotter

Las decisiones importantes del producto, con quién las tomó, por qué y qué se descartó.

**Cómo leerlo**
- **Origen:** *Tuya* si la propuso o la impuso el estudiante; *Elegida entre opciones* si la IA ofreció alternativas y él eligió una.
- **Por qué:** va en palabras del estudiante. Donde figura **(completar)**, falta que lo escriba él: la IA no inventa motivos.

## Decisiones

### 1. El objetivo es obligatorio
- **Origen:** tuya.
- **Por qué:** "el usuario tiene que definir su objetivo sí o sí". *(completar el resto)*
- **Descartaste:** que la IA fije los objetivos, como decía la idea original que se le mandó al profesor.

### 2. Dos caminos para empezar
La app crea la primera rutina, o el usuario carga la que ya hace con un formulario: nombre del ejercicio, series × repeticiones y peso en kg.
- **Origen:** tuya.
- **Por qué:** que la app "se la mejore en base a sus objetivos". *(completar el resto)*
- **Descartaste:** solo crear desde cero; cargar la rutina por texto libre o por foto.

### 3. Se compara lo planificado con lo real
- **Origen:** tuya.
- **Por qué:** "así se hace el análisis y la reestructuración para la siguiente semana".
- **Descartaste:** registrar solo lo que se hizo.

### 4. Un tilde por ejercicio
Sin cambios significa "lo hice como estaba planificado"; si el usuario carga otros números, queda lo real.
- **Origen:** tuya.
- **Por qué:** que para el flujo de trabajo sea más sencillo.
- **Descartaste:** marcar solo el día entero.

### 5. Botón "Día completado"
Con una nota opcional de cómo se sintió.
- **Origen:** tuya.
- **Por qué:** control del usuario y algo de satisfacción y motivación.
- **Descartaste:** que la sesión no tenga un cierre.

### 6. El cierre de la semana es manual
Se hace con un botón; nunca se genera la semana siguiente por fecha.
- **Origen:** tuya.
- **Por qué:** la persona puede haber descansado o haberse atrasado, y "el usuario debe tener el control de eso".
- **Descartaste:** que la semana siguiente se genere sola.

### 7. Los días se llaman "Día 1, Día 2"
- **Origen:** tuya.
- **Por qué:** "no soy partidario de marcar días de la semana".
- **Descartaste:** lunes, martes, etc.

### 8. Se puede cerrar la semana con días sin hacer
La IA recibe esos días como información para reacondicionar el plan.
- **Origen:** tuya.
- **Por qué:** que el sistema sepa que no se hizo y lo use como información para la IA.
- **Descartaste:** bloquear el cierre hasta completar todo.

### 9. La IA propone y el usuario decide
Se muestra una vista previa y el usuario acepta o descarta.
- **Origen:** elegida entre opciones.
- **Por qué:** *(completar; tené en cuenta lo que dijo el profesor: la IA no puede ser quien toma las decisiones)*
- **Descartaste:** que los cambios se apliquen directo.

### 10. Los ejercicios no salen de un catálogo fijo
La IA los elige y la tabla de ejercicios se completa sola.
- **Origen:** elegida entre opciones.
- **Por qué:** no estabas seguro de querer un catálogo fijo de ejercicios. *(completar el resto)*
- **Descartaste:** un catálogo fijo precargado.

### 11. Las series de un ejercicio se pueden desglosar
Un ejercicio se ve como una fila compacta con un tilde ("press de pecho · 4 × 10 · 50 kg"); al desplegarlo, cada serie tiene sus propias repeticiones y su propio peso (por ejemplo 10 × 50, 8 × 55, 6 × 60, 4 × 65).
- **Origen:** tuya.
- **Por qué:** "poder desglosar el ejercicio en cada serie y, por ejemplo, modificar el peso de cada una". *(completar la razón)*
- **Descartaste:** un único peso por ejercicio; valores generales con ajustes solo cuando cambia una serie.

### 12. Durante el día se edita lo que se hizo, con el plan a la vista
Si el usuario cambia una serie mientras entrena, registra lo real; el plan queda visible como referencia ("tocaba 8 × 55 kg").
- **Origen:** elegida entre opciones.
- **Por qué:** *(completar; es lo que permite comparar lo planificado con lo real)*
- **Descartaste:** que lo que se escribe reemplace el plan.

### 13. Cada ejercicio de la rutina tiene indicaciones de ejecución
Un texto opcional, por ejemplo "bajar lento, mantener la fuerza arriba". Es propio de esa rutina: el usuario lo escribe o lo edita, y la IA puede proponerlo.
- **Origen:** la idea es tuya; dónde guardarla la elegiste entre mis opciones.
- **Por qué:** los ejercicios a veces traen indicaciones de cómo hacerlos, como hacerlos lento o mantener la fuerza arriba. *(completar el resto)*
- **Descartaste:** una descripción general de técnica por ejercicio generada por la IA; dejarlo para más adelante.

### 14. Las reglas de entrenamiento salen de un documento con fuentes
La app solo aplica las reglas R1 a R16 de [`criterios-entrenamiento.md`](criterios-entrenamiento.md), cada una con su fuente y su nivel de certeza. Las que se pueden medir las comprueba el código; el resto se le explica a Gemini en una skill.
- **Origen:** tuya (las aprobaste).
- **Por qué:** *(completar)*
- **Descartaste:** que la IA decida las reglas de entrenamiento por su cuenta o de memoria.

### 15. "Perder grasa" significa más cardio y menos fuerza
Es un objetivo con más cardio y menos énfasis en la fuerza; la fuerza se mantiene en el mínimo (al menos 2 días por semana). La alimentación queda fuera de la app y se da por hecho que la persona la maneja.
- **Origen:** tuya.
- **Por qué:** "perder grasa es algo más al estilo un poco más de cardio, no tanta fuerza, es para bajar de peso". *(completar el resto)*
- **Descartaste:** el mismo entrenamiento de fuerza con una sugerencia de cardio en texto; sacar el objetivo del MVP.

### 16. El cardio es un ejercicio con duración
Un ejercicio de cardio se mide en minutos y entra en el mismo flujo que los demás (tilde, "Día completado", planificado frente a real).
- **Origen:** elegida entre opciones.
- **Por qué:** *(completar)*
- **Descartaste:** un bloque de cardio aparte por día; dejar el cardio solo como sugerencia de la IA.

### 17. La IA decide los minutos de cardio, dentro de un rango
Para "perder grasa", la IA elige los minutos de cardio semanales de cada persona según su perfil y la rutina que le asigne, dentro de **150 a 300 minutos por semana**. El código comprueba que no se salga del rango y el usuario puede editarlos.
- **Origen:** tuya (el rango lo elegiste entre mis opciones).
- **Por qué:** los minutos de cardio dependen de los datos del usuario y de la rutina que se le asigne, así que no tiene sentido un número fijo. *(completar el resto)*
- **Descartaste:** un número fijo para todos; que la IA elija sin ningún límite; los rangos de 150 a 250 y de 150 o más sin tope.

### 18. Las 10 series semanales valen también para principiantes
El piso de 10 series o más por semana por grupo muscular (R3, masa muscular) no baja para quien empieza.
- **Origen:** tuya.
- **Por qué:** considerás que 10 series semanales **no son demasiadas** para un principiante. *(completar el resto; un dato a favor: la evidencia del ACSM 2026 viene sobre todo de personas sin experiencia)*
- **Descartaste:** un piso más bajo para principiantes.

### 19. La IA determina los días de la semana
La cantidad de días (entre 2 y 6) la determina la IA según los parámetros de la persona: objetivo, nivel, volumen necesario y, en el camino B, la rutina que cargó. El usuario no los elige, pero si prefiere **entrenar más días** puede pedirlo y la IA recalcula (nunca menos). No existe el pedido "solo puedo 3 días".
- **Origen:** tuya.
- **Por qué:** querés que la cantidad de días la defina la rutina y no el usuario; si la persona quiere más días, que la IA recalcule. *(completar el resto)*
- **Descartaste:** que el usuario elija sus días por semana; una semana fija de 5 días para todos (lo decidiste antes y lo cambiaste el mismo día); que los días dependan solo del nivel.
- **Historial:** el 2026-10-08 se decidió primero "5 días para todos" y luego esta regla, que la reemplaza.

### 20. La IA también determina la duración de cada sesión
El usuario no ingresa cuánto tiempo tiene por sesión: lo determina la IA, igual que los días. Si prefiere entrenar más (más días o sesiones más largas), puede pedirlo y la IA recalcula; nunca menos.
- **Origen:** tuya.
- **Por qué:** querés que la IA decida el tiempo de sesión y que se trate igual que los días. *(completar el resto)*
- **Descartaste:** pedirle al usuario la duración de su sesión, que era un dato obligatorio del perfil.
- **Referencia (R18):** no es un tope. Principiante y mantenerme activo cerca de 60 minutos; intermedio con masa o fuerza de 60 a 90; la IA puede pasarse si el volumen o el usuario lo piden.

### 21. Los principiantes entrenan 2 o 3 días
Cuerpo completo, 2 o 3 días por semana, con sesiones de unos 60 minutos (R12).
- **Origen:** tuya (la mantuviste cuando se discutió pasar a 5 días de 60 minutos).
- **Por qué:** *(completar)*
- **Descartaste:** 5 días para todos, incluidos los principiantes.

### 22. Se suman las reglas R19 a R31
Reglas para perder grasa (fuerza y cardio), condición general y mantenerse activo, repeticiones, progresión, esfuerzo como repeticiones en reserva, descarga por señales y dolor. Están en [`criterios-entrenamiento.md`](criterios-entrenamiento.md) con su fuente, certeza y cómo se aplican.
- **Origen:** tuya (las revisaste y las aprobaste, a partir del informe de investigación).
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)*
- **Ojo:** R20, R24 y R25 son síntesis del investigador, y R29 es una deducción sin verificar en la tabla original.

### 23. El descanso es un campo propio y editable
Cada ejercicio guarda su descanso entre series (`rest_seconds`). La IA lo propone según el tipo de ejercicio y el usuario lo puede cambiar.
- **Origen:** tuya (elegiste el campo propio entre mis opciones).
- **Por qué:** querés que el descanso sea editable y no un cálculo. *(completar el resto)*
- **Descartaste:** calcularlo sin guardarlo; no mostrar el descanso.

### 24. La movilidad y el equilibrio van como un texto del día
Un texto opcional por día (`mobility_notes`), sin series ni tilde.
- **Origen:** tuya ("quizás texto").
- **Por qué:** *(completar)*
- **Descartaste:** otro tipo de ejercicio con series (queda como posibilidad futura).

### 25. Se aprueban C1 y C5 como R32 y R33
El objetivo "perder grasa" incluye cardio (R32) y su intensidad se indica en las indicaciones de ejecución (R33).
- **Origen:** tuya.
- **Por qué:** *(completar)*

### 26. Umbrales de fatiga y dolor
Se sugiere una semana más liviana si el rendimiento del mismo ejercicio baja en 2 sesiones seguidas con esfuerzo de 9 a 10, o si ese esfuerzo se sostiene 3 sesiones o más. Para el dolor se usa el semáforo de 0 a 10: hasta 2 seguir, de 3 a 5 bajar carga o cambiar el ejercicio, más de 5 o dolor de riesgo parar y derivar (R30 y R31).
- **Origen:** elegida entre opciones (propuestas por la IA a partir de la investigación).
- **Por qué:** *(completar)*
- **Descartaste:** una descarga a calendario fijo.
- **Ojo:** los estudios no dan umbrales validados; son una elección de diseño. Queda abierto cuánto se reduce el volumen.

### 27. Las etiquetas del ejercicio pasan a ser columnas obligatorias (R13)
Región, dirección, músculo primario, músculos secundarios, mecánica, equipamiento y nivel, con valores cerrados. Los ejercicios de cardio o de cuerpo entero usan `full_body`.
- **Origen:** tuya (aprobaste la lista de etiquetas y sus valores).
- **Por qué:** *(completar)*
- **Descartaste:** etiquetas en texto libre.
- **Ojo:** el valor `full_body` para cardio es una decisión de la IA para poder tener las columnas obligatorias.

### 28. La duración de una sesión se estima con una fórmula
Tiempo de series (repeticiones por unos 3 segundos) más descanso, más 1 a 2 minutos de cambio entre ejercicios, más cardio y movilidad (R34). El código solo avisa si se aleja de la referencia.
- **Origen:** tuya (aprobaste la fórmula).
- **Por qué:** *(completar)*
- **Descartaste:** rechazar la rutina cuando no entra, porque la duración es una referencia y no un tope.
- **Ojo:** el cambio entre ejercicios no tiene fuente.

## Decisiones abiertas

Todavía sin decidir; el detalle está en [`flujo-app.md`](flujo-app.md):

- Login: antes de la semana 2, con un usuario de prueba, o un login mínimo.
- Reabrir un día ya completado.
- Pedir confirmación al cerrar la semana con días sin hacer.
- Avisos al usuario.
- Ajuste de ejercicios repetidos en la semana: ¿lo hace la IA o una regla simple?
- Dónde va el pedido de ajuste: dentro de la pantalla de la semana o en un chat aparte.

## Ideas futuras

Rachas, logros, entrada por voz y notificaciones. No son decisiones: están anotadas en [`backlog.md`](backlog.md).

## Falta revisar

- El código del modelo ([`backend/app/models.py`](../backend/app/models.py)) frente a estas decisiones.
- Datos sin verificar con la fuente oficial: planes gratuitos y límites de Gemini y de la plataforma de despliegue.
