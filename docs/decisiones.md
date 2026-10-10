# Decisiones de Spotter

Las decisiones importantes del producto, con quién las tomó, por qué y qué se descartó.

**Cómo leerlo**
- **Origen:** *Tuya* si la propuso o la impuso el estudiante; *Elegida entre opciones* si la IA ofreció alternativas y él eligió una.
- **Por qué:** va en palabras del estudiante. Donde figura **(completar)**, falta que lo escriba él: la IA no inventa motivos.

## Decisiones

### 1. El objetivo es obligatorio
*Actualizada: ahora se elige al empezar cada rutina, no en el perfil (decisión 34).*
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

### 29. Qué hacer si el volumen no entra en la duración de referencia
La IA primero **suma días** (hasta el máximo del nivel), después deja la sesión **más larga y avisa**, y solo como último recurso **recorta series** y avisa (R35). Las de menor prioridad son los **ejercicios accesorios y los músculos chicos** (bíceps, tríceps, gemelos y core): lo definiste vos; la lista de músculos chicos es una interpretación de la IA.
- **Origen:** elegida entre opciones (propuestas por la IA tras un ejemplo calculado; el orden lo aprobaste).
- **Por qué:** *(completar)*
- **Descartaste:** recortar el volumen primero; rechazar la rutina cuando no entra.
- **Ojo:** el ejemplo (principiante de masa con 2 días: 83 minutos contra una referencia de 60; con 3 días, 54) usa supuestos de la IA, como el cambio entre ejercicios.

### 30. Los ejercicios isométricos tienen su propio valor de tiempo, en segundos
Un ejercicio como la plancha es un tipo propio (`exercises.kind = isometric`) y sus series se miden en una columna propia, `duration_seconds`. Cada serie lleva **una sola** medida: repeticiones, minutos o segundos. Cuentan como fuerza (días de fuerza, series por músculo) y en R34 su tiempo son sus segundos.
- **Origen:** tuya (pediste que tengan su propio valor de tiempo, en vez de texto), a partir de un caso real: Gemini propuso una plancha y el modelo no la admitía.
- **Por qué:** *(completar)*
- **Descartaste:** dejarlos como texto (como la intensidad del cardio), porque entonces no se podría comparar lo planificado con lo real.
- **Ojo:** la unidad en segundos y el tope de 600 segundos por serie los puse yo. Se amplió la fórmula de R34, que ya habías aprobado, para sumar los segundos del isométrico.

### 31. R3 aplica solo a los 6 grupos grandes
Las 10 series o más por semana (R3, masa muscular) se cuentan para pecho, espalda, hombros, cuádriceps, isquios y glúteos, con un máximo de unas 20. Bíceps, tríceps, gemelos y core no tienen mínimo propio: trabajan con las series indirectas (R5), y pueden tener ejercicios propios si hay lugar.
- **Origen:** elegida entre dos opciones (la IA te mostró cuánto cambiaba cada una; recomendó esta y la aceptaste).
- **Por qué:** *(completar)*
- **Descartaste:** aplicarla a los 10 músculos (100 series semanales como mínimo, sesiones más largas).
- **Ojo:** el código solo **avisa** si un grupo queda fuera de 10 a 20 series; no rechaza la rutina. El tope de 20 es la lectura de "unas 18 a 20" de R3.

### 32. Cómo se genera y se acepta la primera rutina
Generar guarda una propuesta pendiente y no toca el plan; solo al aceptar se crea la semana, en una sola transacción. Si la respuesta de Gemini es inválida o rompe una regla que el código rechaza (R1, R11, R12, R17), se **reintenta una vez** (cada intento cuenta en los topes); los **avisos** (volumen, duración) no bloquean y viajan con la propuesta. Hay **una sola propuesta pendiente**: generar de nuevo descarta la anterior. No se genera si ya hay una semana activa. Un ejercicio que ya existía **conserva sus etiquetas**.
- **Origen:** tuya (aprobaste el reintento, el bloqueo con semana activa y mostrar los avisos sin segunda llamada de corrección); la regla de la propuesta única y la de las etiquetas las puso la IA.
- **Por qué:** *(completar)*
- **Descartaste:** una segunda llamada de corrección cuando hay avisos (duplica la cuota y la espera) y cambiar a Gemini 3.5 Flash (20 llamadas por día).
- **Ojo:** los errores que rechazan son pocos a propósito, para no gastar cuota reintentando; todo lo demás se muestra como aviso.

### 33. Un ejercicio hecho queda bloqueado hasta reabrirlo
Marcar un ejercicio como hecho lo cierra: sus series no se pueden editar, marcar ni desmarcar. Para corregirlo hay **Reabrir ejercicio**, que lo desbloquea sin borrar nada; **Deshacer** borra lo registrado. Marcar todas las series a mano no cierra el ejercicio: solo lo cierra el botón del ejercicio.
- **Origen:** tuya (pediste que un ejercicio hecho no se pueda editar y elegiste la opción con "Reabrir ejercicio" entre dos).
- **Por qué:** *(completar)*
- **Descartaste:** que el ejercicio quedara hecho solo por tener todas las series marcadas y que la única forma de corregirlo fuera Deshacer, que borra todo lo registrado.
- **Ojo:** requirió una tabla nueva (`exercise_completions`, migración 0011). Reabrir el día no reabre los ejercicios cerrados.

### 34. El nivel y el objetivo se eligen al empezar cada rutina, y las rutinas agrupan semanas
Nivel y objetivo salieron del perfil: se eligen en un recuadro (con Cancelar) cuando se toca "Generar rutina" en la portada. El equipamiento ya no se pregunta (se da por hecho un gimnasio completo). Una **rutina** agrupa las semanas con un mismo objetivo y nivel; "Mis rutinas" lista las rutinas y cada una lista sus semanas. Al generar se puede **continuar** una rutina (hereda objetivo y nivel, que quedan fijos) o **empezar una nueva**.
- **Origen:** tuya (sacaste esos datos del perfil porque cambian con cada rutina, pediste las preguntas antes de generar con un botón para cancelar, y elegiste la opción de una tabla de rutinas entre dos).
- **Por qué:** "por ahí estaba con una rutina de fuerza y luego quería una de mantenimiento". *(completar el resto)*
- **Descartaste:** dejar el objetivo en el perfil; agrupar las semanas solo por objetivo, sin tabla (se mezclarían dos rutinas del mismo objetivo); poder cambiar el nivel al continuar una rutina (para subir de nivel se empieza otra).
- **Ojo:** el nombre de la rutina se arma solo ("Fuerza · desde el 9/10", con número si se repite) y se puede cambiar. La rutina nueva nace al aceptar la propuesta, no antes. Requirió las migraciones 0012 y 0013; el equipamiento del perfil se perdió.

### 35. El plan y la propuesta no se editan a mano; solo se edita lo realizado
El usuario no puede cambiar a mano el plan aceptado ni la propuesta de la IA. Lo que sí edita es **lo realizado** en cada serie: si un ejercicio le queda muy pesado o muy liviano, o no llega a las repeticiones, carga lo que hizo y la IA lo toma como información. El plan solo lo cambia la IA (ajuste conversando, semana nueva), con vista previa y aceptar o descartar.
- **Origen:** tuya (la idea fue siempre que lo editado sea lo real, "para que la IA tome nota"; descartaste editar el plan y la propuesta).
- **Por qué:** "si te pasa un ejercicio y te queda muy pesado o muy liviano, puede editarlo para que la IA tome nota de eso, o si se hace muy cansador o no llegás a las repeticiones". *(completar el resto)*
- **Descartaste:** editar el plan a mano (series, repeticiones, peso, indicaciones, quitar un ejercicio; tarea #13) y retocar la propuesta antes de aceptarla.
- **Ojo:** la única vía para cambiar el plan pasa a ser la IA, así que el ajuste (#29) gana importancia. Para que "muy cansador" quede registrado hacen falta el esfuerzo por serie (#48) y "cómo me sentí" (#46). La columna `plan_exercises.edited_by_user` no se usa y queda sin función (puede quitarse en una migración).

### 36. Comentario escrito al cerrar la semana; cerrar con días sin marcar sigue permitido
Al cerrar la semana el usuario puede escribir un comentario libre y opcional sobre cómo se sintió (solo texto). Queda fijo y la IA lo tiene en cuenta al armar la semana siguiente, como dato y no como instrucción. Un día que no se marcó como completado cuenta como no hecho; la semana se puede cerrar igual, con un aviso que nombra esos días.
- **Origen:** tuya (pediste el comentario escrito al terminar la semana; propusiste primero impedir el cierre con días sin marcar y después lo revertiste: se cierra igual, cuenta como no hecho y avisa).
- **Por qué:** *(completar)*
- **Descartaste:** impedir el cierre con días sin completar (dejaría trabajado al usuario que no entrenó un día) y sumar botones rápidos o un estado "Salteado" (el día ya tiene sus botones en la nota de cómo me sentí, #46).
- **Ojo:** es una columna nueva (`week_plans.closing_note`, migración 0014). Sigue vigente la decisión 7 de `modelo-datos.md` (la semana se cierra con días sin hacer).

### 37. El esfuerzo por serie y el semáforo de dolor se posponen
El esfuerzo del ejercicio (de 1 a 10 por serie, #48), la nota de cómo me sentí del día (#46) y el semáforo de dolor con zona y gravedad (R31, #51) quedan **definidos pero sin construir**, para implementarlos más adelante. Por ahora la IA se apoya en lo que se hizo y lo que no, los cambios de peso y el comentario escrito al cerrar la semana (decisión 36).
- **Origen:** tuya.
- **Por qué:** "con lo de cerrar la semana, con lo que se hizo, no se hizo y los cambios de peso y eso ya es suficiente". *(completar el resto)*
- **Descartaste (por ahora):** construir el esfuerzo, la nota del día y la escala de dolor en esta etapa.
- **Ojo:** sin esfuerzo, la IA no distingue "cumplí fácil" de "cumplí al límite": R10 por esfuerzo y la semana liviana (R30) no tienen disparador. El dolor solo llega si el usuario lo escribe en el comentario, sin escala ni zona; R31 ("preguntar zona y gravedad") queda sin cumplirse del todo. La columna `set_entries.effort` y las columnas `workout_sessions.feeling` y `notes` ya existen y no se usan.

### 38. La interfaz usa shadcn/ui, en versión básica; los estilos se ponen más adelante
Los componentes de la interfaz (botones, recuadros de confirmación, campos, tarjetas) pasan a ser los de shadcn/ui con Tailwind CSS, en su tema neutro por defecto y sin diseño propio. El diseño visual (colores, tipografía, espaciados) se hace en una etapa posterior. Es la tarea #31.
- **Origen:** tuya (querías shadcn desde el principio; pediste que fuera "algo bien básico ya que los estilos se los vamos a poner más adelante").
- **Por qué:** *(completar)*
- **Descartaste:** seguir con HTML plano y estilos en línea, y otras librerías de componentes (MUI, Mantine).
- **Ojo:** shadcn **copia** el código de los componentes a `components/ui/` (queda en el repo y se mantiene a mano) y exige Tailwind, que cambia cómo se escriben los estilos. Probado en una copia temporal con Next 16.4 y React 19.3: compila sin errores. El estado global del frontend no se resuelve acá: va con el login de la Semana 3, usando Server Components de Next.

## Decisiones abiertas

Todavía sin decidir; el detalle está en [`flujo-app.md`](flujo-app.md):

- **Cuánto reducir el volumen** en la semana liviana (R30).
- Avisos al usuario.
- Ajuste de ejercicios repetidos en la semana: ¿lo hace la IA o una regla simple?
- Dónde va el pedido de ajuste: dentro de la pantalla de la semana o en un chat aparte.

Ya resueltas: **el plan no se edita a mano** (decisión 35); los **botones Cerrar semana y Generar** (cerrar en la semana activa con aviso de los días sin completar, generar en la portada); el **login** se deja para la semana 3 (el tutor lo indicó) y mientras tanto hay un usuario de desarrollo fijo; **reabrir un día completado** se puede (decisión 33 y "Reabrir día"); la confirmación al cerrar con días sin hacer queda definida en la tarea #47.

## Ideas futuras

Rachas, logros, entrada por voz y notificaciones. No son decisiones: están anotadas en [`backlog.md`](backlog.md).

## Falta revisar

- El código del modelo ([`backend/app/models.py`](../backend/app/models.py)) frente a estas decisiones.
- Datos sin verificar con la fuente oficial: planes gratuitos y límites de Gemini y de la plataforma de despliegue.
