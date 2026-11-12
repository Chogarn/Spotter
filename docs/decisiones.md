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
*Reemplazada por la decisión 40: se descartó el camino B y queda un solo camino.*
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

### 10. ~~Los ejercicios no salen de un catálogo fijo~~ (reemplazada por la 58)
La IA los elegía libremente y la tabla de ejercicios se completaba sola.
- **Origen:** elegida entre opciones.
- **Por qué:** no estabas seguro de querer un catálogo fijo de ejercicios. Después cambiaste de idea: ver la decisión 58.
- **Descartaste:** un catálogo fijo precargado (luego se adoptó).

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

### 19. La IA determina los días de la semana (reemplazada por la decisión 52)
La cantidad de días (entre 2 y 6) la determina la IA según los parámetros de la persona: objetivo, nivel y volumen necesario. El usuario no los elige, pero si prefiere **entrenar más días** puede pedirlo y la IA recalcula (nunca menos). No existe el pedido "solo puedo 3 días".
- **Origen:** tuya.
- **Por qué:** querés que la cantidad de días la defina la rutina y no el usuario; si la persona quiere más días, que la IA recalcule. *(completar el resto)*
- **Descartaste:** que el usuario elija sus días por semana; una semana fija de 5 días para todos (lo decidiste antes y lo cambiaste el mismo día); que los días dependan solo del nivel.
- **Historial:** el 2026-10-08 se decidió primero "5 días para todos" y luego esta regla, que la reemplaza.

### 20. La IA también determina la duración de cada sesión (decisión original; días reemplazados por 52 y tiempo apagado por 90)
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
- **Por qué:** Porque las revisé y me parecieron que estaban bien.
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

### 37. El esfuerzo por serie y el semáforo de dolor se posponen *(parcialmente reemplazada por la 73 y la 74)*
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

### 39. La sesión va en una cookie httpOnly con un JWT de 7 días, y el usuario de desarrollo se reclama
El inicio de sesión usa un JWT firmado con `JWT_SECRET` que el backend guarda en una cookie `httpOnly`, así el JavaScript de la página no puede leerlo. Dura 7 días y no hay refresco; cerrar sesión borra la cookie. Las contraseñas se guardan con hash argon2 (mínimo 8 caracteres) y no hay verificación de email ni recuperación de contraseña. El usuario de desarrollo que existía antes del login no se descarta: un script de una sola vez le pone email, nombre y contraseña reales, sin cambiar su id, para conservar su perfil y las filas de `ai_calls` (que no se pueden borrar).
- **Origen:** elegida entre opciones (la IA mostró las alternativas y recomendó esta; aceptaste las recomendaciones).
- **Por qué:** *(completar)*
- **Descartaste:** guardar el token en `localStorage` (queda expuesto a scripts y la protección de rutas solo podría hacerse del lado del cliente), una sesión con refresco (más código para un MVP) y registrarte de cero dejando el usuario de desarrollo sin uso.
- **Ojo:** la cookie la lee el servidor de Next (`proxy.ts`), así que en producción el frontend y la API deben estar en el mismo sitio. El `proxy.ts` solo comprueba que haya cookie; la validez real la decide la API. Pasar la lectura de datos a Server Components de Next quedó para la Semana 4: hoy las pantallas siguen pidiendo los datos desde el navegador, con `credentials: "include"`.

### 40. Se descarta el camino B: la app solo crea la rutina, no mejora una existente
El usuario no carga la rutina que ya hace. Toda rutina la arma la IA desde cero con "Generar rutina" (nivel y objetivo al empezar), y de ahí en adelante se ajusta semana a semana. Se eliminó todo lo del camino B: el formulario de rutina actual (#44), la pantalla de elección de camino (#43), el tipo de propuesta `improve` y las columnas `week_plans.origin` y `week_plans.original_routine` (migración 0015).
- **Origen:** tuya (2026-10-12).
- **Por qué:** Por recomendación del profesor: me dijo que era mejor que la IA genere la rutina, y me pareció que sí, que era un buen esfuerzo.
- **Descartaste:** cargar la rutina propia (formulario, texto libre o foto) y que la IA se la mejore; dejar las columnas sin usar.
- **Ojo:** la decisión 2 queda como historial. Quien ya tiene una rutina propia y la quiere seguir no tiene cómo traerla: solo puede dejar que la IA arme una desde su nivel y objetivo.

### 41. El diseño visual es "Disco", inspirado en los discos de pesas
Fondo gris cemento (`#E9ECEE`), tinta azul noche (`#172033`) y los colores de los discos de competición para los estados: rojo (`#D7263D`) serie hecha o semana en curso, azul (`#1F5FBF`) la carga, amarillo (`#F2C230`) avisos y propuestas pendientes, verde (`#2E9E5B`) cumplido o semana cerrada. Letras Barlow Condensed para números y títulos, y Barlow para el texto. Bordes redondeados, botón principal en forma de píldora oscura. Cada serie se muestra como un disco que se rellena al marcarla como hecha.
- **Origen:** elegida entre opciones (2026-10-12; la IA mostró "Disco" y "Estadio", y después cuatro variantes de color y una versión oscura).
- **Por qué:** Me pareció que tenía un estilo más de gimnasio y me gustaba más.
- **Descartaste:** "Estadio" (cobalto y amarillo, letras de cartel); la versión oscura grafito y turquesa; las variantes violeta, naranja, verde y rojo con azul marino.
- **Ojo:** se aplica cambiando las variables de color de shadcn en `globals.css` y las fuentes en `layout.tsx`, sin reescribir los componentes de `components/ui/`. Reemplaza el "tema neutro" de la decisión 38. La app es **siempre clara**, aunque el sistema esté en modo oscuro (elegido por el usuario el 2026-10-12, tras ver que seguía al sistema); el modo oscuro queda definido en la clase `.dark` pero nada la aplica.

### 42. La portada se llama "Entrenar" y la navegación es una barra fija abajo
La barra tiene tres secciones, Entrenar, Rutinas y Perfil, siempre abajo, también en la computadora. Con una semana activa, Entrenar muestra el próximo día sin completar con el botón "Empezar día N", el progreso de la semana en discos y el resto de los días. Sin semana activa, junta en un lugar la propuesta pendiente, continuar una rutina y empezar una nueva. "Cerrar sesión" pasa al Perfil.
- **Origen:** elegida entre opciones (2026-10-12; la IA propuso la reorganización y el nombre "Hoy"; elegiste "Entrenar" y la barra abajo siempre).
- **Por qué:** Para navegar en el celular es mejor una barra inferior que una superior, con un botón central. Es un diseño que la mayoría de las apps tienen y sirve para entrar rápido a lo que hay que hacer hoy.
- **Descartaste:** la portada como lista de botones; los nombres "Hoy" e "Inicio"; un menú arriba.

### 43. Las acciones chicas son íconos; las que cierran algo llevan texto
Lápiz para editar, tilde y cruz para guardar y cancelar, candado abierto para reabrir y tacho para deshacer, que siempre pide confirmación. Una serie se marca o desmarca tocando su disco. "Día completado", "Cerrar semana", "Aceptar" y "Descartar" siguen con texto.
- **Origen:** tuya (2026-10-12; pediste íconos "tipo lápiz, cruces, tachos de basura"); el reparto entre íconos y texto lo propuso la IA.
- **Por qué:** *(completar)*
- **Descartaste:** botones con texto para todas las acciones.
- **Ojo:** cada ícono necesita un nombre accesible (`aria-label`) y un área táctil de 36 px o más.

### 44. La propuesta muestra el resumen de la IA y "Cerrar semana" pasa a Entrenar
En la propuesta se muestra el resumen de la IA (`ai_summary`, que ya existe). El peso anterior junto al nuevo espera a la tarea #49. "Cerrar semana" va al final de la pantalla Entrenar, discreto, y se quita de la pantalla de la semana.
- **Origen:** elegida entre opciones (2026-10-12; la IA lo propuso y lo confirmaste).
- **Por qué:** *(completar)*

### 45. El ajuste conversando se descarta por ahora
El usuario no le pide cambios a la IA durante la semana. El plan de la semana activa no cambia hasta cerrarla: lo que no anda (una máquina que no hay, una molestia) se cuenta en el comentario al cerrar la semana (#50) y la IA lo tiene en cuenta al armar la siguiente. La tarea #29 se cerró como "no se hace por ahora".
- **Origen:** tuya (2026-10-12), al ver las decisiones que pedía la tarea (dónde se pide, qué días puede cambiar la IA, si es un pedido o un chat).
- **Por qué:** *(completar)*
- **Descartaste (por ahora):** pedirle a la IA que modifique la semana activa, con vista previa y aceptar o descartar.
- **Ojo:** queda sin resolver lo que la tarea había mostrado: aceptar un ajuste tendría que modificar la semana activa sin perder lo ya registrado (hoy aceptar siempre crea una semana nueva). El antes y después (#49) sigue sirviendo para la semana nueva. La decisión 35 queda así: el plan solo lo cambia la IA, al armar la semana nueva.

### 46. Modo entrenar: "Serie hecha" guarda lo planificado y no hay reloj de descanso
"Empezar día N" abre un modo con la serie que toca en grande (#57). "Serie hecha" guarda la serie tal como estaba planificada y pasa a la siguiente; si algo salió distinto, se corrige con el lápiz. Al terminar las series de un ejercicio, lo marca como hecho. El reloj de descanso no entra en este modo por ahora: sigue en las ideas del backlog, con la condición de que lo arranque el usuario.
- **Origen:** elegida entre opciones (2026-10-12; la IA lo propuso con las maquetas de otras apps y la tarea se cerró así).
- **Por qué:** Porque hay una forma de guardar las series por defecto, sin modificarlas, y es más fácil.
- **Descartaste (por ahora):** mostrar los números ya editables en cada serie; sumar el reloj de descanso en esta tarea.
- **Ojo:** la pantalla del día sigue siendo la vista para revisar y corregir; el modo entrenar convive con ella (se sale con la X y lo hecho ya quedó guardado).

### 47. El día muestra solo lo esencial; el detalle está al entrar al ejercicio; Entrenar va al centro de la barra
La lista del día muestra por ejercicio el nombre en grande y los números debajo (no tan chicos), y los discos en el que está en curso. "Semana pasada", las notas, el "Por qué", las series y los botones del ejercicio (tilde, candado y tacho) pasan adentro: tocar la tarjeta entra al ejercicio (el modo entrenar ubicado ahí). Adentro, el lápiz va en la esquina de la tarjeta de la serie, no al lado del botón principal. En la barra de navegación, Entrenar va al centro como un botón redondo elevado (#58).
- **Origen:** tuya (2026-10-12): "hay demasiada info, es mejor si los detalles aparecen cuando entrás al ejercicio", el nombre chico frente a los números, la ubicación del lápiz y Entrenar al centro; la IA propuso cómo y lo aprobaste.
- **Por qué:** *(completar)*
- **Descartaste:** la lista con todo el detalle (#56 tal como quedó); el lápiz al lado de "Serie hecha".
- **Cambio (2026-10-12, tuyo):** tocar la tarjeta ya **no entra al modo entrenar**: la despliega ahí mismo, en la lista (una por vez), con las series (disco y lápiz), semana pasada, cómo hacerlo, por qué y los botones del ejercicio (tilde, candado y tacho). El modo entrenar queda para entrenar y se abre solo con "Empezar día N" desde Entrenar; sin botón "Entrenar" en la tarjeta. Motivo: no convencía que mirar un ejercicio y entrenarlo fueran la misma vista.

### 48. Reloj de descanso circular, que arranca el usuario
Dentro del ejercicio, un botón redondo de reloj al lado de "Serie hecha" arranca el descanso con la duración que propuso la IA (`rest_seconds`). Corriendo, un círculo con la cuenta regresiva ocupa el lugar de la tarjeta de la serie, con −15 s, +15 s y "Saltar descanso". Al llegar a cero vibra (si se puede) y vuelve la serie. Si el usuario sale a otra pantalla, una franja arriba de la barra muestra el tiempo y vuelve al ejercicio (#59). Reemplaza el "sin reloj por ahora" de la decisión 46.
- **Origen:** tuya (2026-10-12): "algo mucho muy importante", circular; entre un botón que lleve a otra pantalla y un componente que se cargue en lugar del ejercicio, aprobaste la propuesta de la IA (el componente en lugar de la serie).
- **Por qué:** *(completar)*
- **Descartaste:** un recuadro rectangular con barra; una pantalla aparte para el reloj; que arranque solo al marcar la serie; un sonido al terminar (necesita permiso y puede molestar).
- **Ojo:** el tiempo se calcula con la hora de inicio (con la pantalla apagada el navegador pausa los temporizadores). Para que siga corriendo al cambiar de pantalla hace falta un estado compartido entre pantallas: es el primer caso concreto del estado global que se había dejado para cuando apareciera uno (#17).

### 49. Verde es "día completado" en toda la app; rojo, "serie o ejercicio hecho"
Los discos de los días se ponen verdes al completarse (al tocar "Día completado"), esté la semana en curso o cerrada, en Entrenar, en la pantalla de la semana y en Rutinas. El rojo queda para las series y los ejercicios hechos, dentro del día. Un día a medias lleva borde rojo y uno sin hacer, punteado. Reemplaza la regla de la decisión 41 de que lo hecho iba en verde solo con la semana cerrada.
- **Origen:** tuya (2026-10-12): en Entrenar, el día hecho en rojo junto a las series en rojo "se pone confusa la vista"; aprobaste aplicarlo en toda la app para que un día verde signifique lo mismo en cualquier pantalla.
- **Por qué:** *(completar)*
- **Descartaste:** verde solo con la semana cerrada; cambiarlo solo en Entrenar.

### 50. "Nueva rutina" también desde Rutinas
En la pantalla Rutinas hay un botón **"Nueva rutina"** arriba de la lista, al lado del título. Abre el recuadro de generar directo en una rutina nueva (nivel y objetivo), sin la opción de continuar, que sigue en Entrenar. Se ve siempre; con una semana en curso, al tocarlo avisa que primero hay que cerrarla y ofrece ir a Entrenar. Antes "Generar" vivía solo en la portada.
- **Origen:** tuya (2026-10-12): "en Rutinas debería haber un botón de generar rutina nueva"; elegiste entre opciones (1a, 2a y 3).
- **Por qué:** *(completar)*
- **Descartaste:** mostrarlo solo sin semana activa; ofrecer también "continuar" desde Rutinas.

### 51. Inicio es la portada; Entrenar pasa a `/entrenar`; la barra tiene cinco lugares
Con sesión iniciada, la portada (`/`) es **Inicio**: una franja oscura de saludo (fecha, "Hola, nombre", la rutina, la semana y sus discos), la tarjeta "Hoy te toca" con "Empezar día N" (o "Armá tu próxima semana" sin semana en curso), el aviso de propuesta pendiente y accesos rápidos (Ver la semana, Tus rutinas, Nueva rutina, Tu perfil). La semana en curso con sus días pasa a **Entrenar**, en `/entrenar`. La barra queda con cinco lugares: Inicio · Rutinas · **Entrenar** (centro, elevado) · Progreso · Perfil. Progreso es el lugar del resumen semanal (#28) y, mientras no exista, avisa que está en camino (#60).
- **Origen:** tuya (2026-10-12): "una página principal como una de bienvenida una vez logueado, que tenga opciones de cosas"; te gustó la maqueta y elegiste cinco lugares.
- **Por qué:** Porque tiene que haber una pantalla de inicio. La barra de cinco lugares todavía la estamos viendo.
- **Descartaste:** que la portada fuera Entrenar (decisión 42); la barra con cuatro lugares.

### 52. El usuario elige cuántos días por semana entrena
Al generar una rutina nueva se elige la cantidad de días, obligatoria como el nivel y el objetivo: principiante 2 o 3 (R12), el resto de 2 a 6 (R11). Se guarda en la rutina (`routines.days_per_week`, migración 0016; las rutinas que ya existían tomaron la cantidad de su semana más nueva) y al continuar viene marcada y se puede cambiar. La IA arma exactamente esa cantidad y el código lo comprueba. Como la IA ya no puede sumar días, R35 saltea su primer paso (alarga la sesión y avisa; como último recurso recorta accesorios y músculos chicos). Reemplaza "los días los determina la IA" y "no existe el pedido 'solo puedo 3 días'" (#61).
- **Origen:** tuya (2026-10-13), tras comparar con otras apps que preguntan los días; elegiste la opción A y 1a, 2a, 3a y 4a.
- **Por qué:** Para que el usuario tenga libertad de elegir la cantidad de días que quiere entrenar en esa semana; muchas apps lo dejan.
- **Descartaste:** que la IA decida los días (opción B, con un pedido opcional de más días); ofrecer de 2 a 6 también a principiantes; que la IA pueda proponer más días que los elegidos; que la cantidad quede fija con la rutina; que elegir sea opcional.

### 53. Desde Rutinas el día es para mirar; se registra y se cierra en Entrenar
Rutinas es el historial y Entrenar el lugar donde se registra. Llegando desde Rutinas (la pantalla de la semana enlaza con `?desde=rutinas`), el día no se cierra ni se reabre y tampoco se marcan ni editan series o ejercicios: las tarjetas se despliegan solo para mirar. El final es el mismo que con la semana cerrada: **"Día completado"** (sin candado) o **"Día sin completar"** en gris y, si la semana está en curso, "Para registrarlo, andá a Entrenar.". Sin esa marca (desde Entrenar, Inicio o el modo entrenar), el día funciona completo, con "Día completado" y el candado para reabrir.
- **Origen:** tuya (2026-10-13). Primero se deshizo un cambio de otra sesión (commit `55a90dc`, con `?desde=entrenar`) porque "me modificó el estilo en un lugar que no debía"; después aclaraste que lo que no querías era el estilo, no que se pudiera cerrar el día desde Rutinas, y elegiste bloquear todo (1A).
- **Por qué:** *(completar)*
- **Descartaste:** bloquear solo cerrar y reabrir el día (1B); el estilo del primer intento (texto "Desde Rutinas el día se ve en lectura" y enlace "Entrenar este día").

### 54. Rutinas "en pausa" y la rutina como línea de tiempo
*Actualizada: la etiqueta "en pausa" pasó a **"lista para continuar"** (decisión 66).*
En Rutinas, la rutina con semana activa lleva "en curso" (rojo) y las demás **"en pausa"** (gris), porque se pueden continuar al generar. La pantalla de una rutina tiene el título grande, etiquetas (objetivo, nivel, días por semana) y las semanas como **línea de tiempo**: cada semana es una tarjeta colgada de la línea, con borde oscuro la en curso, "Desde el 13/10 · N de M días" (solo los días completados) y los discos. Así no se confunde con la lista de rutinas.
- **Origen:** tuya (2026-10-13): "parece la misma pantalla anterior y eso genera confusión"; aprobaste las maquetas.
- **Por qué:** *(completar)*
- **Descartaste:** "terminada" o "dejada" en lugar de "en pausa"; las semanas como texto suelto sobre la línea.

### 55. La semana con el mismo diseño que el día, sin barra de progreso
*Actualizada: la semana cerrada **sí se puede reabrir** (decisión 66).*
La pantalla de una semana tiene el título grande, etiquetas (En curso o Completada, la fecha y los días) y cada día como las tarjetas de ejercicio, con una flecha para entrar. Al final, con la semana cerrada, **"Semana completada"** como "Día completado" pero sin candado (la semana no se reabre); con la semana en curso, "La semana se cierra desde Entrenar" en gris y chico. Una semana cerrada se llama "completada" aunque tenga días sin hacer: los discos muestran cuáles faltaron.
- **Origen:** tuya (2026-10-13): "el diseño está medio raro comparado con el anterior y el siguiente"; aprobaste la maqueta.
- **Por qué:** *(completar)*
- **Descartaste:** una barra de progreso de días en la semana (los discos ya lo muestran); resaltar el día que toca con un botón "Empezar día N" en esta pantalla.

### 56. La entrada en calor es el primer paso del modo entrenar
Si el día tiene movilidad (`mobility_notes`, R26), el modo entrenar empieza por **"Entrada en calor"**: el texto en una tarjeta y "Listo, empezar", que lleva al primer ejercicio sin hacer. Tiene su barrita y se llega con las flechas como a un ejercicio, pero no tiene series, no se guarda y no cuenta en los ejercicios hechos: se da por hecha en cuanto hay algo registrado en el día. En la lista del día es la **primera tarjeta**, que se despliega con el texto, sin series ni tilde.
- **Origen:** tuya (2026-10-13): "que la entrada en calor se vea como cualquier otro ejercicio en entrenar", y después "la movilidad como tarjeta en la lista del día".
- **Por qué:** *(completar)*
- **Descartaste:** marcarla como hecha (habría que guardarla en la base); dejarla como la línea "Movilidad: …".

### 57. "Cerrar semana" con borde y candado, y el recuadro con formato de tarjeta
Al final de Entrenar, mientras quedan días por hacer, "Cerrar semana" deja de ser un enlace gris: es un **botón con borde oscuro a todo el ancho, con un candado** (menos fuerte que "Empezar día N"). Al tocarlo, el recuadro de confirmación pregunta **"¿Terminaste la semana?"**, dice qué días faltan (se cuentan como no hechos), que la IA arma la siguiente con lo que hiciste y que no se puede deshacer; tiene el comentario opcional y el botón "Cerrar semana" con borde oscuro. Con todos los días completados sigue el botón oscuro dentro de la tarjeta de arriba.
- **Origen:** tuya (2026-10-13): "el botón de cerrar semana debería tener otro formato"; probaste la tarjeta (C) y la fila con candado (B), y te quedaste con el botón de la A y el recuadro en el formato de la C.
- **Por qué:** *(completar)*
- **Descartaste:** una fila como "Día completado" con candado (B); la tarjeta "¿Terminaste la semana?" en la pantalla (C).

### 58. Los ejercicios de la rutina salen de un catálogo
La IA arma la semana **solo con ejercicios del catálogo** (`backend/app/ai/exercises.json`, borrador de 118 con descripción y alias). Reemplaza a la decisión 10. El código comprueba que cada ejercicio devuelto esté en el catálogo; si no, la rutina se rechaza y se reintenta. **Se le pasa con RAG:** cada ejercicio tiene un *embedding* (Gemini) guardado en **PostgreSQL con pgvector**; al generar, se recuperan por similitud los candidatos de cada grupo muscular y solo esos van al prompt. Si el embedding falla o se alcanza un tope, el prompt lleva todo lo permitido por nivel y objetivo. **Cómo se hace cumplir:** el código reemplaza nombre y etiquetas por las del catálogo (la IA elige el ejercicio, el catálogo lo etiqueta) y rechaza la rutina, con un reintento, si trae un ejercicio que no está o con otro tipo (fuerza, cardio, isométrico); al continuar una rutina se permiten los de la semana anterior aunque sean viejos. **Las lesiones no entran en la búsqueda por vectores** (un vector mide parecido, no "evitar"): las razona la IA con el perfil. **El catálogo lo aprobaste el 2026-10-14** (nombres, músculos, niveles, descripciones y alias); queda para más adelante la revisión de una persona con formación en educación física y el criterio R5b.
- **Origen:** tuya (2026-10-14): "los ejercicios de la rutina tienen que salir del catálogo" (cambio de diseño posterior a la decisión 10) y "tiene que ser de vectores" (pgvector, no JSON).
- **Por qué:** *(completar)*
- **Descartaste:** que la IA elija libremente y la tabla `exercises` crezca sola.

### 59. Las series por ejercicio se quedan como dicen las fuentes
R4 (fuerza) pide 2 a 3 series por ejercicio, R24 (mantenerme activo) 2 y R25 (condición general) 2 a 3. Se descarta la idea de pasar a "3 a 4". El código y el prompt ya trabajan así: no cambia nada. En una prueba con Gemini real, masa salió casi siempre con 3 o 4 series (por el volumen semanal de R3) y fuerza con la mitad de los ejercicios en 2.
- **Origen:** tuya (2026-10-14): "dejá como dicen las fuentes, ignorá mi idea de 3 o 4".
- **Por qué:** *(completar)*
- **Descartaste:** subir el piso a 3 series por ejercicio (opciones A, B y C del 2026-10-10).

### 60. Músculo secundario (R5b): solo sinergistas principales
Un músculo figura como secundario de un ejercicio solo si es **sinergista principal** del movimiento; los **estabilizadores** (el core en una sentadilla, la espalda baja en un peso muerto rumano) **no suman**. Ya está aplicado al catálogo de ejercicios (16 etiquetas).
- **Origen:** tuya (2026-10-14): aprobaste mi recomendación.
- **Por qué:** *(completar)* Es un criterio del proyecto, sin fuente publicada y de certeza baja; una persona con formación en educación física lo revisa más adelante.
- **Descartaste:** contar también a los estabilizadores como indirectos.

### 61. R20, R24 y R25 cuentan las series con indirectas a 0,5
Las tres reglas comparan las series semanales por grupo grande contando las **indirectas a 0,5**, igual que R3 (R5). Es como ya lo hace el código; solo avisan.
- **Origen:** tuya (2026-10-14): aprobaste mi recomendación.
- **Por qué:** *(completar)* Una sola forma de contar para todos los objetivos; las fuentes de esas reglas son una síntesis de baja certeza.
- **Descartaste:** comparar contra series directas solas.

### 62. R30 (semana liviana): no implementada *(reemplazada por la 72: descartada)*
La regla queda en la tabla, marcada **"no implementada"**. No tiene disparador: depende del esfuerzo por serie (#48), que está pospuesto (decisión 37). **No se define cuánto reducir** el volumen hasta que exista esa señal: no hay evidencia que respalde una cifra (Bell 2023 sin acuerdo; Coleman 2024, una descarga programada no mejoró nada). Si #48 se hace, se vuelve a mirar: la IA propondría mantener la carga y bajar series, y el usuario decide.
- **Origen:** tuya (2026-10-14): "ponele no implementada".
- **Por qué:** *(completar)*
- **Descartaste:** inventar una cifra de reducción hoy; sacar la regla (renumerar R31 a R35 toca muchos archivos).

### 63. Avisos al usuario: no por ahora
Los avisos suaves ("completaste todos los días, ¿cerrar la semana?") quedan en las ideas futuras de `docs/backlog.md`. El caso principal ya está resuelto: con todos los días completados, "Cerrar semana" pasa a ser el botón oscuro principal (decisión 57).
- **Origen:** tuya (2026-10-14): aprobaste mi recomendación.
- **Por qué:** *(completar)*
- **Descartaste:** construir avisos en esta etapa.

### 64. Ajuste de ejercicios repetidos: no se hace
Si el mismo ejercicio cae en dos días de la semana, no se ajusta el segundo con lo que pasó en el primero, ni con IA ni con una regla simple. Coherente con las decisiones 35 y 45: el plan no cambia durante la semana, y lo que pasó viaja a la IA al armar la semana siguiente. También queda cerrado "dónde va el pedido de ajuste", que dependía del ajuste conversando (#29), descartado en la 45.
- **Origen:** tuya (2026-10-14): aprobaste mi recomendación.
- **Por qué:** *(completar)*
- **Descartaste:** ajustar el plan a mitad de semana, con IA o con una regla simple.

### 65. Cambiar un ejercicio de la propuesta por otro del catálogo
En la propuesta pendiente, cada ejercicio desplegado tiene **"Cambiar ejercicio"**: abre una lista de alternativas del catálogo (mismo músculo principal, mismo tipo, de tu nivel o menor, y que no estén ya en la semana). Al elegir una, **se cambia en todos los días donde aparece**, sin preguntar. Las series y repeticiones se copian del ejercicio reemplazado; el **peso queda en blanco** y se ajusta al entrenar. Sin IA y sin gasto de cuota; el código vuelve a comprobar las reglas y recalcula los avisos. **Solo en la propuesta pendiente** (cuando se genera una rutina o una semana nueva): la semana ya aceptada no cambia. No se puede sacar un ejercicio sin reemplazo (podría dejar un grupo muscular sin cubrir).
- **Origen:** tuya (2026-10-15): "si me gustan todos pero menos esto, que no sé qué hacer o no quiero hacerlo, poder modificarlo"; elegiste que el cambio valga para todos los días y que sea solo al generar.
- **Por qué:** A veces me gustan todos los ejercicios menos uno, que no sé cómo se hace o que no quiero hacer, y quiero poder cambiarlo sin tener que descartar toda la semana.
- **Descartaste:** pedirle a la IA que regenere el hueco (gasta una llamada); cambiarlo solo en uno de los días; cambiar la semana ya aceptada; borrar un ejercicio sin reemplazo.
- **Ojo:** reabre un pedazo de la decisión 35 ("la propuesta no se edita a mano"): ahora se puede **elegir** entre ejercicios del catálogo, pero no escribir uno libre ni tocar las series.

### 66. Después de cerrar la semana: dos opciones claras, y la semana cerrada se puede reabrir
En **Entrenar** y en **Inicio** (la misma tarjeta, con los componentes de `SiguienteSemana.tsx`), sin semana activa y con una semana recién cerrada, se muestra "Semana N completada" con sus días y dos botones: **"Generar la semana siguiente"** (continúa esa rutina; solo confirma los días por semana, que ya vienen marcados) y **"Empezar una rutina nueva"** (nivel, objetivo y días). Antes había un único "Generar rutina" que escondía esa elección en un recuadro. En Rutinas, la rutina sin semana activa pasa de "en pausa" a **"lista para continuar"**. Además, la semana cerrada tiene **"Reabrir semana"**, con recuadro de confirmación: vuelve a estar en curso, no se pierde lo registrado y se borra el comentario de cierre. **Seguridades:** solo la última semana de su rutina, y no si hay otra semana en curso ni una propuesta sin revisar (quedaría desactualizada); el servidor responde 409 con el motivo.
- **Origen:** tuya (2026-10-15): "en Entrenar me debería aparecer, cuando terminé la semana, generar semana nueva o rutina nueva" y "algo de seguridad de reabrirla, porque no la completé y necesito completarla para ver cómo está el progreso".
- **Por qué:** Cuando termino una semana tiene que quedar claro qué sigue (continuar la rutina o empezar otra) sin tener que adivinar. Y si cierro una semana sin querer o sin haberla completado, tengo que poder volver atrás para ver mi progreso.
- **Descartaste:** dejar un único botón "Generar rutina" con la elección escondida; que la semana cerrada no se pueda reabrir (decisiones 7 y 55); poder reabrir cualquier semana vieja.
- **Ojo:** reabre las decisiones 7 de `modelo-datos.md` y 55. Cerrar y reabrir no usan la IA.
- **Ajuste del 2026-10-16:** en **Inicio** la tarjeta ya no muestra "Empezar una rutina nueva", porque era redundante con la tarjeta "Nueva rutina" de más abajo (a pedido tuyo). En **Entrenar** siguen las dos opciones, porque ahí no hay otro acceso a una rutina nueva.

### 67. Una sola generación a la vez, pantalla de carga que bloquea y pantalla de "aceptado"
Mientras la IA arma una semana se muestra una **pantalla completa** (un disco de pesas que gira, "Armando tu semana", hasta 2 minutos) que tapa todo, incluida la barra de abajo: no se puede salir ni pedir otra. **El servidor también lo impide**, por si se saltea la pantalla (otra pestaña, otro aparato): si ya hay una generación en curso de la misma persona responde 409 *"Ya se está generando una rutina…"* sin llamar a la IA y sin gastar cuota. Una llamada que quedó sin cerrar deja de bloquear sola a los 150 segundos. Al **aceptar**, la pantalla dice "Tu semana N ya está lista" (o "Tu rutina ya está lista" si es la primera), con los discos de la semana y dos botones: **Comenzar entrenamiento** (directo al Día 1) y **Ver mi rutina**.
- **Origen:** tuya (2026-10-15): el cartel de "aceptado" no te gustaba ("hay que estilizarlo, y ir a Entrenar tendría que decir comenzar entrenamiento o volver a mi rutina"), y notaste que "mientras la estás generando puedo salir y navegar y darle a generar una nueva". Elegiste la variante B de la animación (un disco que gira) porque la A (los discos que se llenan) "es muy repetitiva con lo demás", y que el bloqueo sea completo.
- **Por qué:** Mientras se genera una rutina no quiero poder salir ni pedir otra, porque se presta a confusiones, gasta cuota de la IA dos veces y una pisa a la otra. Y al aceptar quiero que quede claro qué sigue: empezar a entrenar o volver a mi rutina.
- **Descartaste:** dejar navegar mientras se genera con un aviso fijo (queda como mejora futura); la variante A de la animación; el cartel "Tu rutina quedó activa" con "Ver mis rutinas" e "Ir a Entrenar".
- **Ojo:** el candado en memoria vale por proceso del servidor; entre varios procesos lo cubre la comprobación de las llamadas sin terminar.

### 68. Un dibujo por objetivo de rutina
Cada objetivo tiene su ícono sobre un disco oscuro: **masa** (brazo flexionado), **fuerza** (mancuerna), **perder grasa** (llama), **condición general** (corazón con pulso) y **mantenerme activo** (huellas). Aparece al elegir el objetivo de una rutina nueva, en la lista de Rutinas y en el encabezado de cada rutina (`IconoObjetivo.tsx`). Son decorativos: el nombre del objetivo siempre va al lado.
- **Origen:** tuya (2026-10-15): "para el tipo de rutina me gustaría un dibujo así"; aprobaste los cinco dibujos de la maqueta.
- **Por qué:** *(completar)*
- **Descartaste (por ahora):** dibujos por grupo muscular, por ejercicio y en las tarjetas; no estabas seguro.

### 69. La evolución de un ejercicio es por fecha y junta todas las rutinas
En Progreso, el gráfico de un ejercicio ya no depende de la rutina elegida arriba: acumula **todas** tus rutinas en una sola línea de tiempo, un punto por semana con lo mejor realizado (mayor peso; cardio en minutos e isométricos en segundos, cada uno en su unidad). **El fondo cambia de color con cada rutina** y una leyenda dice cuál es cuál; las semanas sin registros cortan la línea y no se inventan. Debajo, tres datos: récord, semanas con datos y cuánto subió desde la primera. El buscador elige primero el ejercicio que apareció en más semanas. Los puntos van parejos en el orden de las fechas (dos semanas del mismo día no se pisan).
- **Origen:** tuya (2026-10-15): "debería ser un histórico de cada ejercicio, aislado de las rutinas, que se acumule todo"; aprobaste la maqueta con el fondo de color por rutina.
- **Por qué:** *(completar)*
- **Descartaste:** un gráfico por rutina (el anterior); mezclar unidades distintas en una misma línea.
- **Ojo:** los ejercicios de antes del catálogo con otro nombre no se juntan con los del catálogo; desde que todo sale del catálogo, se unifican.

### 70. No se puede pausar una rutina ni dejar otra en espera
Se descartó la idea de **pausar la rutina activa y ver otra** (o dejar una segunda rutina "en espera" para activarla al cerrar la actual). Sigue habiendo **una sola semana activa a la vez**. Para cambiar de rutina se **cierra la semana** (manual, aunque falten días, y se puede reabrir) y se empieza otra; la anterior queda **"lista para continuar"** y se retoma con la semana siguiente.
- **Origen:** tuya (2026-10-15): propusiste poder tener otra rutina con una sola activa y después, al revisarlo, "vamos a descartar la idea, es innecesaria".
- **Por qué:** *(completar)*
- **Descartaste:** (2) crear la nueva rutina "en espera" y activarla al cerrar la actual; (3) pausar la semana en curso sin cerrarla y alternar entre rutinas. Ambas pedían un estado nuevo de semana, una migración y cambios en Rutinas, Inicio y Entrenar.
- **Ojo:** reabrir la idea solo si aparece un caso real de uso. Hoy "Nueva rutina" con una semana en curso avisa que primero hay que cerrarla (409 en el servidor).

### 71. Cómo se sintió el entrenamiento y el dolor se cuentan en el comentario al cerrar la semana *(parcialmente reemplazada por la 74)*
No se construyen por ahora la nota de **"cómo me sentí"** por día (#46) ni el **semáforo de dolor** con zona y gravedad (#51). Lo que cubre las dos cosas es el **comentario escrito opcional al cerrar la semana** (decisión 36, tarea #50): texto libre, fijo, que la IA lee como dato del usuario al armar la semana siguiente. El **esfuerzo por serie** (#48) queda pospuesto como estaba (decisión 37).
- **Origen:** tuya (2026-10-16), después de revisar cómo lo hacen otras apps (Hevy, RP Hypertrophy, Garmin, Strava, Apple y apps de fisioterapia): "vamos a dejar eso a nuestra fusión del comentario, creo que es lo más lógico, además está construido".
- **Por qué:** *(completar)*
- **Descartaste (por ahora):** (B) una pregunta de 1 a 5 y un tilde de dolor al cerrar la semana; (C) un botón "me dolió" por ejercicio, con zona y gravedad, que alimente el semáforo R31 (lo más cercano a RP Hypertrophy, y lo más grande: toca el día, el resumen y el prompt).
- **Ojo:** R31 sigue aprobada como criterio, pero sin un campo propio que la dispare; el dolor llega solo si la persona lo escribe. Si más adelante se quiere que la IA reaccione con más precisión, se retoma #51 (y el esfuerzo por serie, #48). Las decisiones 37 y 62 siguen valiendo.

### 72. R30 (semana liviana) queda descartada
La regla se **anula**: la semana liviana aislada no se aplica. Queda su fila en la tabla de `docs/criterios-entrenamiento.md`, marcada **"descartada"**, para que la numeración no se corra. Reemplaza a la decisión 62 ("no implementada"). El cansancio y las cargas demasiado altas llegan a la IA por el comentario al cerrar la semana (decisión 71).
- **Origen:** tuya (2026-10-16): para vos R30 era un disparador que bajaba las cargas para recalcularlas porque eran muy altas, y no una semana liviana aparte.
- **Por qué:** *(completar)* Lo que respalda la decisión: la evidencia no muestra que una descarga sea necesaria (Coleman 2024: la programada no mejoró nada; Bell 2023: depende de la persona y no hay acuerdo en cuánto durar ni reducir), y sus señales dependían del esfuerzo por serie (#48), que está pospuesto.
- **Descartaste:** la semana liviana (misma carga, menos series) como regla propia.
- **Ojo:** bajar las cargas cuando el comentario dice que eran muy altas **no está definido** y no es R30: sería una regla nueva (la propuesta R36), que necesita tu aprobación. Mientras tanto el prompt dice "mantener". R10, R29 y R31 también hay que reformularlas para que la IA las lea del comentario.

### 73. El esfuerzo y el dolor se deducen de la carga y las repeticiones juntas, más el comentario de cierre
Sin esfuerzo por serie (decisión 37) ni dolor con escala (decisión 71), la IA los lee de dos fuentes: lo que la persona **hizo frente a lo planificado** (carga y repeticiones, juntas) y el **comentario al cerrar la semana**. La señal por ejercicio (`signal()` en `ai/history.py`) hoy mira solo las repeticiones y marca "no llegó" cuando se bajan repeticiones subiendo el peso; hay que corregirla.
- **Origen:** tuya (2026-10-16): "si bajo repeticiones y subo carga o la mantengo, quise mover más peso".
- **Por qué:** *(completar)*
- **Cómo se lee:** más peso con menos repeticiones es progresión, no cansancio. Las pistas de esfuerzo son: mismo peso con menos repeticiones, menos peso con las mismas repeticiones, y menos peso con menos repeticiones. Vale igual en los cinco objetivos.
- **Cualquier aumento real cuenta como "más"**, sin umbral: el salto mínimo (un disco de 1,25) ya es notable. Pero **el excedente no define cuánto subir la semana siguiente**: el aumento sale del 2 % al 10 % (R9 y R28), redondeado al salto del equipo y nunca menos de un salto.
- **Saltos mínimos** (ya en el prompt): barra 2,5 kg (discos de 1,25 por lado), mancuernas 2,5 kg, pesas rusas 4 kg; máquinas con discos olímpicos (se cargan a mano, como la prensa o el hack), 2,5 kg como la barra, y máquinas y poleas con pila de placas, de a 5 kg (**elección del usuario**, 2026-10-16; el catálogo no distingue los dos tipos y la IA decide por el nombre del ejercicio: en su gimnasio, máquinas BH Fitness, hay saltos de 5, de 7,5 y pesos como 12,5, y puede que las placas estén en libras convertidas a kilos; no se encontró la ficha de BH, así que el peso exacto puede no existir y se corrige con lo realizado). Fuentes: Wikipedia (discos), minoristas y Ruster Fitness (mancuernas y pesas rusas); no se verificaron marcas de máquinas ni gimnasios de Argentina.
- **Reglas que se apoyan en esto:** R10 (no subir si bajó la carga o las repeticiones del ejercicio, o si el comentario habla de cansancio o dolor), R31 (el dolor se lee del comentario, sin escala) y R36 (**aprobada el 2026-10-16**: si el ejercicio quedó en "no llegó" y el comentario muestra fatiga o cargas demasiado altas, bajar **un escalón** del equipo; sin ese comentario, mantener. Sin porcentaje, para no inventar una cifra).
- **Descartaste:** una marca opcional por ejercicio ("me dolió" o "me costó mucho"), por ahora; se retoma si la IA queda corta.
- **Hecho el 2026-10-16:** `signal()` y sus tests (`tests/test_signal.py`), el prompt y las reglas R10, R31 y R36 en `docs/criterios-entrenamiento.md`. Complementa la decisión 72.

### 74. Marca opcional de carga y dolor por ejercicio, al entrenar
Al terminar un ejercicio en el modo entrenar aparece una línea plegada "¿Cómo te fue? (opcional)" con dos filas **independientes**: la **carga** (Liviana, Bien, Pesada, Muy pesada) y el **dolor** (Leve, Moderado, Fuerte). No hay opción "No me dolió": sin marcar es sin dato. Se puede marcar solo una, las dos o ninguna, y volver a tocar una opción la desmarca. Con "Fuerte" se muestra el aviso de parar y consultar a un profesional. Se ve, solo de lectura, en el resumen semanal de Progreso. Reemplaza en parte a la decisión 37 (esfuerzo por serie, #48) y a la 71 (el dolor solo por el comentario): el comentario de cierre sigue valiendo.
- **Origen:** tuya (2026-10-16): "una casilla opcional de esfuerzo y otra de dolor, que se despliegue si el usuario quiere". La escala de carga la elegiste vos (opción B) entre tres propuestas.
- **Por qué:** *(completar)*
- **Descartaste:** el esfuerzo por serie de 1 a 10 (#48); la escala por repeticiones que sobran (opción A, apoyada en R29); una opción "No me dolió"; ponerla también en la lista del día.
- **Hecho el 2026-10-16** (#63): migración 0019, `PUT .../exercises/{id}/feel`, `ComoTeFue.tsx` en el modo entrenar y la marca en el resumen de Progreso; `history.py` la manda a la IA y el prompt aplica R10, R31 y R36. Sin cambios en la lista del día. **Cambio de flujo que decidió la IA:** al terminar un ejercicio el modo entrenar ya no pasa solo al siguiente, se queda en él (con las marcas y el botón "Siguiente ejercicio"), porque el ejercicio solo se puede marcar una vez hecho.
- **Ojo:** guarda en `exercise_completions` (dos columnas nulas, migración 0019), así que solo se puede marcar con el ejercicio hecho; reabrir o deshacer el ejercicio borra las marcas; `set_entries.effort` sigue sin usarse. R10 y R31 vuelven a tener disparador, y R36 pasa a dispararse también con "Muy pesada" además del comentario. La carga y el dolor no marcados llegan a la IA como ausentes, nunca como "bien" ni "sin dolor".

### 75. El Perfil se separa en "Perfil" y "Cuenta", con botones que todavía no hacen nada
La pantalla `/perfil` pasa a tener dos pestañas. **Perfil**: los datos de entrenamiento (nombre, cuerpo, limitaciones y el aviso médico aceptado), sin cambios. **Cuenta**: el correo y los botones **Cambiar correo**, **Cambiar contraseña** y **Borrar cuenta**, más **Cerrar sesión** (que antes estaba al final del Perfil, decisión 42). En el login se suma el enlace **¿Olvidaste tu contraseña?**. Todos esos botones están en su lugar pero **no están implementados**: al tocarlos muestran un aviso ("todavía no está disponible") con la etiqueta "Próximamente".
- **Origen:** tuya (2026-10-16): "lo quiero separado y los botones de cambiar contraseña y eso dejarlos ahí, pero lo implementamos luego".
- **Por qué:** *(completar)*
- **Descartaste:** implementar ahora el cambio de correo y de contraseña y la recuperación de cuenta; deshabilitar los botones (se prefirió un aviso al tocarlos, que explica por qué no funcionan).
- **Ojo:** (el "¿Olvidaste tu contraseña?" ya funciona desde la decisión 81) no hay endpoints nuevos ni migración. **Borrar cuenta** lo sumó la IA sin que lo pidieras, para dejar el lugar listo para el aviso legal (#34, en espera). Para que los botones hagan algo faltan: cambiar contraseña (pide la actual), cambiar correo, recuperar contraseña (necesita enviar correos: verificar un servicio gratuito en su fuente oficial) y borrar la cuenta (que tiene que respetar que `ai_calls` no se borra nunca).

### 76. El logo es la palabra SPOTTER con la O hecha un disco rojo
El logo provisorio (una barra con discos de perfil en rojo, azul y amarillo) se reemplaza por la palabra **SPOTTER** en Barlow Condensed, con la **O** dibujada como un disco rojo de frente (un aro). Es texto con un ícono adentro (`Logo.tsx`): el tamaño se da con el tamaño de letra y las letras toman el color del texto, así sirve sobre fondo claro y oscuro. En la bienvenida el logo es el título; en el acceso y en Inicio acompaña el saludo.
- **Origen:** tuya (2026-10-16): elegiste la opción 5 de cinco propuestas ("me gusta la última").
- **Por qué:** *(completar)*
- **Descartaste:** la barra con tres colores (el amarillo casi no se ve sobre fondo claro y con tres colores se ensucia en chico), una barra con un solo par de discos, el disco de frente solo y el disco con la S.
- **Ojo:** usa solo el rojo del disco, para no competir con los estados de la app. Queda abierto un ícono chico para la pestaña del navegador (una sugerencia fue el disco de frente) y, si algún día se hace, el ícono de la PWA.

### 77. Inicio con dos aros y Rutinas con franja oscura y tarjeta simple
En **Inicio**, la franja tiene ahora un aro rojo más grande y uno azul, como la bienvenida (antes asomaba un solo aro rojo). En **Rutinas**, la pantalla gana una **franja oscura** con el título, igual que Inicio y Perfil, y la tarjeta de cada rutina se simplifica: el ícono del objetivo lleva un **aro** que dice el estado (rojo = en curso, gris = lista para continuar), desaparece la etiqueta "en curso" y la línea "Semana en curso", y se suman la flecha y los discos a la derecha.
- **Origen:** tuya (2026-10-16): "Inicio B, Rutinas B", después de decir que en Inicio asomaba un solo aro y que la tarjeta de Rutinas no terminaba de gustarte.
- **Por qué:** *(completar)*
- **Descartaste:** dejar la franja de Inicio como estaba o solo agrandar el aro rojo; dejar la tarjeta con la etiqueta "en curso".
- **Ojo:** la variante "Rutinas B" que viste incluía la tarjeta simple; así lo implementé. El estado ahora lo dice el color del aro y se lee en voz alta como "en curso" (texto oculto); "lista para continuar" va escrito en la línea de datos. `IconoObjetivo` suma la opción `aro`.

### 78. La franja oscura va en casi todas las pantallas, con un color de aro por sección y un botón Volver en el detalle
Todas las pantallas llevan la **franja oscura** de arriba, salvo **Entrenar, el día que se registra y el modo entrenar**, que quedan sin adornos para que te concentres en entrenar. Cada sección tiene el color de sus aros: **Inicio** rojo y azul, **Rutinas** rojo, **Progreso** azul, **la propuesta de la IA** amarillo (el color de "pendiente") y **Perfil** verde. En el detalle (la rutina, la semana, el día cuando se llega desde Rutinas, y la propuesta) la franja lleva un botón **Volver** al nivel de arriba. Todo sale de un solo componente, `Franja.tsx`.
- **Origen:** tuya (2026-10-16): "todas las pantallas, menos la de entrenar, deberían tener el encabezado arriba y quizás cada sección con un disco de colores diferentes", y "en la navegación de las rutinas, una instancia de cada carpeta".
- **Por qué:** *(completar)*
- **Descartaste:** poner la franja también en Entrenar; dejar todos los aros del mismo color; las **migas de pan** ("Rutinas › Fuerza › Semana 2 › Día 1"), que se probaron el 2026-10-16 y se sacaron: en el celular quedaban largas y se desbordaban con nombres largos.
- **Ojo:** los colores de los aros son solo adorno (van ocultos para los lectores de pantalla) y no cambian el significado de los colores de estados; el verde del Perfil es lo más discutible porque en la app verde es "cumplido". El día que se abre desde Entrenar no tiene franja ni migas. En el detalle de una rutina, el ícono del objetivo ya no está junto al nombre. En la lista de Rutinas, los discos de la semana van debajo del texto y el nombre puede ocupar dos líneas: con seis días y un nombre largo no entraba todo en una línea.

### 79. Entrenar y el día llevan la franja amarilla; solo el modo entrenar va sin adornos
Cambia en parte la decisión 78. La pestaña **Entrenar** (la lista de días de la semana en curso) y la pantalla del **día** (cuando se llega desde Entrenar) llevan la franja con **aro amarillo** y un botón **Volver** (el día vuelve a Entrenar). La franja se saca recién al tocar **Empezar día** y entrar al **modo entrenar**, que sigue sin adornos para que te concentres. La propuesta de la IA también queda en amarillo. Además, en la pantalla de una rutina se sacó la etiqueta "5 días por semana" (solo describía la última semana) y, en las tarjetas de semana, el "6 de 6 días" (los discos ya lo muestran).
- **Origen:** tuya (2026-10-16): "en Entrenar le podemos poner el encabezado hasta que entremos al día y le damos entrenar", y que "la propuesta también puede quedar en amarillo".
- **Por qué:** *(completar)*
- **Descartaste:** dejar Entrenar y el día sin franja (decisión 78); poner la franja también en el modo entrenar.
- **Ojo:** la pestaña Entrenar ya no tiene el título grande "Día N" como encabezado de la página: el título de la franja es "Entrenar" con la rutina y la semana debajo, y el "Día N" que toca pasó a la tarjeta. También se sacó la fila de discos de arriba de la tarjeta de Entrenar ("0 de 5 días"), porque la lista "Días de la semana" ya muestra el estado de cada día, y la barra "1 de 6 ejercicios hechos" de la pantalla del día, porque las tarjetas de los ejercicios ya muestran cuáles están hechos. El día lleva rojo si se llega desde Rutinas (para mirar) y amarillo si es desde Entrenar. La pantalla de bienvenida lleva ahora cuatro aros (rojo, azul, amarillo y verde), uno por cada color de sección (a pedido tuyo, 2026-10-16).

### 80. Cambiar la contraseña: pide la actual y cierra las sesiones de los demás aparatos
En la pestaña **Cuenta** del Perfil, **Cambiar contraseña** abre un formulario en la misma tarjeta (contraseña actual, nueva y nueva repetida). El servidor (`PUT /auth/password`) comprueba la actual y exige que la nueva sea distinta, con las mismas reglas del registro (de 8 a 128 caracteres, sin reglas de complejidad). Al guardar, **las sesiones iniciadas en otros aparatos dejan de valer** y la de ese aparato sigue abierta con una cookie nueva: la tabla `users` guarda cuándo cambió la contraseña (`password_changed_at`, migración 0020) y una sesión emitida antes de ese momento se rechaza.
- **Origen:** tuya (2026-10-16): "la que proporcione más seguridad, que supongo que es la B", y "aplicalo como está ahora la contraseña y luego haremos una revisión mejor".
- **Por qué:** *(completar)*
- **Descartaste:** dejar abiertas las sesiones de otros aparatos (opción A); subir ahora el largo mínimo o prohibir las contraseñas más comunes; poner un límite de intentos.
- **Ojo:** una contraseña floja como "12345678" sigue pasando, y el login sigue sin límite de intentos. Queda para la revisión que dijiste: **verificar el correo** (que sea real, porque solo sirve para recuperar la contraseña), recuperar la contraseña, cambiar el correo y borrar la cuenta. Cuando la actual está mal, el servidor responde 400 y no 401, porque un 401 cerraría la sesión en pantalla. Una sesión iniciada en el mismo segundo del cambio todavía vale: es un margen de un segundo que no importa.

### 81. La cuenta solo existe después de verificar el correo, y la contraseña se recupera por correo
**Crear cuenta:** `POST /auth/register` ya no crea el usuario ni inicia sesión: guarda un **registro pendiente** (con el hash de la contraseña) y manda un correo con un enlace. Al tocarlo (`/verificar`) el servidor crea la cuenta, la marca como verificada y deja la sesión iniciada. El enlace vale 24 horas, sirve una sola vez y se puede reenviar. **Recuperar la contraseña:** "¿Olvidaste tu contraseña?" (`/recuperar`) manda un enlace de un solo uso, que vale 1 hora, **solo a un correo verificado**; `/restablecer` pide la contraseña nueva, que cierra todas las sesiones abiertas y no inicia sesión. Los códigos se guardan como hash, nunca en claro, y la respuesta es la misma exista o no la cuenta. **Correos:** por SMTP estándar; en desarrollo salen a **Mailpit** (un buzón falso en http://localhost:8025) y en producción irán por una cuenta de Gmail creada solo para Spotter (contraseña de aplicación). Topes: **50 correos por día en total** (`EMAIL_DAILY_LIMIT`, sin valor por defecto: si falta, no se envía) y **1 por minuto por dirección**; cada correo queda anotado en `email_log` antes de enviarse.
- **Origen:** tuya (2026-10-16): "al crear la app para tener un usuario se necesita verificar el correo electrónico y ese correo verificado sea al que se envía la recuperación de contraseña... se hace todo con token de verificación".
- **Por qué:** *(completar)*
- **Descartaste:** crear la cuenta primero y verificar después (con un aviso); poder recuperar la contraseña con un correo sin verificar (alguien que escribió mal su correo le daría el control a un desconocido); usar un servicio de correo pago o con dominio propio por ahora.
- **Decidió la IA sin preguntarte (mientras no estabas):** que las cuentas que ya existían (la tuya y las de prueba) quedaron marcadas como verificadas en la migración 0021; los topes de 50 por día y 1 por minuto (los propuse y no los confirmaste); que recuperar la contraseña no inicia sesión; que si el envío no está configurado, registrarse y recuperar responden "El envío de correos no está configurado" y no se crea nada.
- **Ojo:** (1) Para que funcione en producción hay que crear la cuenta de Gmail de Spotter, activar la verificación en dos pasos y cargar las variables `SMTP_*`, `APP_URL` y `EMAIL_DAILY_LIMIT` (ver `.env.example`); sin eso, nadie puede registrarse. (2) Un error de tipeo en el correo ("gmial.com") rebota sin que nos enteremos: esa cuenta nunca se crea. (3) Los correos descartables pasan. (4) El login sigue sin límite de intentos. (5) Cambiar el correo y borrar la cuenta siguen sin hacerse. (6) Un registro pendiente que nunca se verifica queda en la base hasta que alguien se registre de nuevo con ese correo: falta una limpieza de los vencidos.

### 82. El usuario elige cuánto dura la sesión (apagada por la decisión 90)
- **Fecha:** 2026-10-17
- **Decisión:** al generar una rutina, después del nivel, la persona elige los **minutos por sesión** en una rueda de 20 en 20 (antes de 5 en 5; el 2026-10-18 se simplificó): 40 y 60 para un principiante (R18 lo limita a 60), 40, 60 y 80 para un intermedio y 40, 60, 80, 100 y 120 para un avanzado; 60 es lo habitual. Se guarda en `routines.session_minutes` (migración 0022) y al continuar viene marcado. **El tiempo manda:** la IA nunca alarga una sesión; si el volumen de R3 no entra, recorta series (accesorios y músculos chicos primero) y avisa. Esto **cambia R18 y R35** (antes la IA decidía la duración y alargaba antes de recortar). R34 sube el cambio entre ejercicios de 1,5 a **3,5 minutos** (esperar la máquina y acomodar el peso). Además, el modo entrenar muestra un **contador** desde "Empezar día" hasta "Día completado" (`workout_sessions.started_at`); la duración medida aparece solo en las estadísticas: el detalle del día en el Calendario y el Resumen semanal de Progreso (total y por día).
- **Por qué:** *(completar)*
- **Descartaste:** que la IA siga decidiendo la duración; alargar la sesión cuando el volumen no entra; mostrar el tiempo medido en la pantalla de "Día completado".
- **Decidió la IA sin preguntarte:** que reabrir un día vacía la hora de inicio (el contador se oculta y arranca de nuevo al retomar); que si un día se completa sin haber tocado "Empezar día" no se mide; el margen de aviso de R34 con tiempo elegido (avisa si un día se pasa de 10 minutos o queda corto por más de 15); que "perder grasa" compara solo la parte de fuerza con el tiempo elegido (el cardio va aparte, como en R18); el texto de ayuda de la rueda.
- **Ojo:** el prompt nuevo **no se probó con Gemini real** (gasta cuota). Con sesiones cortas (40 min) el volumen de R3 queda por debajo y solo se avisa. El tiempo medido incluye las pausas (por ejemplo, dejar el celular y volver).

### 83. "¿Cómo te fue?" como desplegable del ejercicio, y "Por qué está en tu rutina" solo desde Rutinas
- **Fecha:** 2026-10-17
- **Decisión:** en el modo entrenar, "¿Cómo te fue?" (carga y dolor, decisión 74) deja de ser una pantalla que aparece al terminar el ejercicio: es un desplegable plegado, junto a "Cómo hacerlo", que está disponible mientras se hace el ejercicio. Al cerrarlo, el modo entrenar pasa solo al siguiente (se quita el botón "Siguiente ejercicio"). "Por qué está en tu rutina" sale del modo entrenar y de la lista del día de Entrenar: solo se ve en el día que se mira desde Rutinas (y en la propuesta).
- **Por qué:** *(completar)*
- **Decidió la IA sin preguntarte:** que las marcas hechas con el ejercicio en curso se guardan en la pantalla y se mandan al servidor recién al cerrar el ejercicio (el servidor solo las acepta con el ejercicio hecho); que pasar solo al siguiente vuelve a ser automático; que con el ejercicio hecho el desplegable se edita directo, como antes.
- **Ojo:** si se sale del modo entrenar antes de cerrar el ejercicio, las marcas pendientes se pierden (no se guardan en el servidor).

### 84. El botón Entrenar de la barra vuelve a donde estabas
- **Fecha:** 2026-10-18
- **Decisión:** tocar **Entrenar** en la barra de abajo, estando en otra sección, vuelve al último lugar donde estabas dentro de Entrenar (el ejercicio, el día o la semana: se recuerda la última pantalla de `/semanas/...`, por pestaña del navegador). Si no hay nada recordado, abre el modo entrenar del día empezado y sin completar (`GET /weeks/active` trae `in_progress_day`, el día con `started_at` y sin `finished_at`), y si tampoco hay, la semana. Tocarlo estando ya dentro de la sección lleva a la semana, como una pestaña cualquiera. Dentro del modo entrenar, además, se guarda en el navegador (por semana y día) el ejercicio y la serie en que estabas, y al volver se abre ahí en vez de en "el primero sin hacer"; el contador de la sesión sigue corriendo hasta "Día completado" (decisión 82).
- **Por qué:** *(completar)*
- **Decidió la IA sin preguntarte:** que la propuesta no se recuerda como "último lugar"; que se guarda solo mientras la pestaña del navegador siga abierta; que sea solo un atajo del botón de la barra: la pantalla de la semana (`/entrenar`) sigue existiendo y se llega con "Volver" desde el día, así que "Cerrar semana" y la lista de días no quedan inaccesibles; que esa pantalla sigue diciendo "Empezar día N" aunque el día esté en curso (no se cambió); que un clic con Ctrl o Cmd abre el enlace normal.
- **Ojo:** el día se considera "en curso" desde que se abre el modo entrenar, aunque no se haya hecho ninguna serie; para salir de él sin completarlo hay que usar la X.

### 85. Cambios que pidió el profesor: dolor y esfuerzo al final de la semana, ícono de información y perfil por dato
- **Fecha:** 2026-10-23
- **Decisión:** (1) **Dolor y esfuerzo:** el desplegable "¿Cómo te fue?" (carga y dolor por ejercicio, decisión 74) se **saca de la pantalla**; el esfuerzo y el dolor se cuentan solo en el **comentario al cerrar la semana** (decisión 71). No se borra nada: las columnas `load_feel` y `pain`, el endpoint `PUT .../feel` y lo ya guardado se quedan (el resumen semanal sigue mostrando lo marcado antes), por si se quisiera volver a usar con un interruptor. Reemplaza la primera parte de la decisión 83. (2) **Ícono de información:** "Cómo hacerlo" y "Por qué está en tu rutina" dejan de ser desplegables y pasan a un ícono ⓘ que abre un panel **centrado** con las dos cosas, en el modo entrenar, la lista del día, el día que se mira desde Rutinas y la propuesta (`InfoEjercicio.tsx`). "Por qué está en tu rutina" vuelve a estar en todos lados, dentro del panel (reemplaza la segunda parte de la 83). (3) **Perfil:** el asistente completo queda solo para la primera vez; al editar, **cada dato tiene su propio lápiz** (nombre, edad, peso, altura, sexo, limitaciones) y abre solo esa pregunta, nunca varias juntas. (4) **Frases de entrenamiento** en la pantalla de carga mientras la IA arma la semana (`FraseDeCarga.tsx`), para que la espera sea más interactiva.
- **Por qué:** *(completar)*
- **Descartaste:** dejar "¿Cómo te fue?" como estaba; un interruptor en la configuración (por ahora); editar el perfil por grupos de datos.
- **Decidió la IA sin preguntarte:** que las 12 frases de carga las escribí yo (generales, sin consejo médico) y cambian cada 5 segundos; que el panel del ⓘ es el `<dialog>` del navegador, centrado, y se cierra con la X, tocando afuera o con Escape; que "Edad" sigue mostrando la edad pero su lápiz abre la fecha de nacimiento; que no agrupé los datos que casi no cambian (los dejé todos al mismo nivel, como pediste).
- **Ojo:** (a) el aviso de seguridad de Next.js 16.4.0 (versión con una vulnerabilidad conocida según la herramienta de desarrollo) **sigue sin atenderse**; es una tarea aparte. (b) Si más adelante se quiere el interruptor para volver a marcar dolor y esfuerzo por ejercicio, el backend ya lo soporta.

### 86. El perfil muestra el peso y el IMC; edad, altura y sexo van plegados
- **Fecha:** 2026-10-23
- **Decisión:** en la pestaña Perfil, a la vista quedan el **peso** (con su lápiz) y el **IMC**; la edad, la altura y el sexo pasan a un bloque plegado "Datos personales" (cada uno con su lápiz, decisión 85), porque casi no cambian. El **IMC** (peso ÷ altura², un decimal) es un dato **calculado**: no tiene lápiz, no lo pide el asistente de la primera vez y cambia solo cuando cambia el peso o la altura. Se muestra **solo el número, sin categoría**, con una aclaración de que es orientativo y no distingue músculo de grasa. **No se le pasa a la IA** ni entra en ninguna regla.
- **Por qué:** *(completar)*
- **Descartaste:** mostrar todos los datos del cuerpo a la vista; ponerlos en la pestaña Cuenta (por ahora).
- **Decidió la IA sin preguntarte:** que el bloque plegado va dentro de Perfil y no en Cuenta; que el IMC sin categoría (una categoría parece consejo médico, y la app no lo da); que no se guarda en la base (se calcula al mostrar); que la implementación fina del IMC queda para después, como pediste.
- **Ojo:** la altura sigue guardándose y editándose, solo que está plegada: sin ella el IMC muestra "—".

### 87. Seguimiento semanal del peso, cargado a mano
- **Fecha:** 2026-10-23
- **Decisión:** el peso deja de ser un solo valor y pasa a ser un **historial de mediciones con fecha** (tabla `body_measurements`, migración 0023): peso y, opcional, **grasa corporal %** (la que da una balanza biométrica), una por día. Se carga **al cerrar la semana** (dos campos opcionales en el recuadro de "Cerrar semana"; si hay peso queda una medición ligada a esa semana; la grasa sola no se guarda; **desde la decisión 131 ya no**) o cuando quieras con "Cargar peso" en la pestaña nueva **Cuerpo** de Progreso. Cada medición se puede **corregir y borrar** (con confirmación). El **IMC** se calcula con el peso de cada medición y la altura del perfil: no se guarda, no se carga y es solo informativo. La **cintura** no se pide. La **IA no usa** estos datos por ahora. El peso del perfil es siempre la última medición, y cambiar el peso desde el perfil suma una medición de hoy. Lo pidió el profesor.
- **Por qué:** *(completar)*
- **Descartaste:** atar el recordatorio a una fecha ("hace 7 días que no cargás tu peso"); pedir la cintura; que la IA use la tendencia de peso (haría falta una regla nueva aprobada: las únicas permitidas son R1 a R36).
- **Decidió la IA sin preguntarte:** una medición por día (cargar otra el mismo día la reemplaza); no se aceptan fechas futuras; pesos de 30 a 300 kg y grasa de 2 a 70 %; las mediciones nuevas toman la fecha del servidor, que está en UTC (de noche en la Argentina puede quedar un día adelantada; en "Cargar peso" la fecha se puede elegir); al aplicar la migración, el peso actual de cada perfil quedó como primera medición con la fecha de ese día; borrar la última medición deja el peso del perfil como estaba.
- **Ojo:** (1) el gráfico es de las mediciones, no de las semanas: dos mediciones de la misma semana se ven las dos. (2) Una balanza biométrica es una estimación; sirve para ver la tendencia con la misma balanza. (3) Hay un respaldo de la base antes de la migración en `backups/spotter_antes_mediciones_*.sql`.

### 88. El tiempo de sesión se acota a 40, 60 y 80 minutos, por ahora
- **Fecha:** 2026-10-23
- **Decisión:** las opciones de minutos por sesión quedan en **40, 60 y 80** (de 20 en 20) y el tope es **80 para todos los niveles**; los principiantes siguen con tope 60 (R18). Antes el avanzado podía elegir hasta 120 y el intermedio hasta 80 (la rueda de la decisión 82). Es una limitación **provisoria**: "por ahora". La base sigue aceptando de 30 a 120 por si más adelante se vuelve a abrir.
- **Por qué:** *(completar)*
- **Descartaste:** sesiones de 100 y 120 minutos por ahora.
- **Decidió la IA sin preguntarte:** que "por hora" lo entendí como "por ahora"; que los principiantes mantienen el tope de 60 (R18: nada de sesiones largas para quien empieza); que una rutina ya guardada con 100 o 120 se lleva a 80 al continuarla (la rueda lo ajusta sola) y el servidor rechaza esos valores si se los pide directamente.
- **Ojo:** a menor tiempo, el volumen semanal de R3 puede no entrar y la IA recorta series y avisa (R35 cambiada, decisión 82). Con sesiones de 40 minutos pasa más seguido.

### 89. El tiempo elegido se hace cumplir: cada día a menos de 10 minutos, por arriba y por abajo
- **Fecha:** 2026-10-23
- **Decisión:** si la persona eligió el tiempo de sesión (decisión 82), cada día tiene que quedar a **menos de 10 minutos** de ese tiempo, tanto de más como de menos, y los días tienen que ser parecidos entre sí. Antes solo era un aviso y la IA se quedaba corta (con 80 elegidos armaba días de 30 a 36 min) o se pasaba. Ahora: (1) el prompt le dice **cuántos ejercicios hacen falta** (un ejercicio de 3 series dura entre 8 y 9 min: 40 min son unos 5 ejercicios, 60 unos 7, 80 unos 9; si el día lleva movilidad o cardio se restan) y el margen de 10 min; (2) si algún día queda fuera del margen, el código **rechaza la rutina y la pide de nuevo** diciéndole qué día, cuánto dura y si tiene que agregar o sacar; (3) si el segundo intento tampoco entra, **se acepta igual con el aviso** de la pestaña Avisos: no se bloquea la generación.
- **Por qué:** *(completar)*
- **Descartaste:** dejarlo solo como aviso; que el código arme o recorte la rutina por su cuenta (no puede: las series por ejercicio son 2 a 3, decisión 59, y los ejercicios los elige la IA del catálogo).
- **Decidió la IA sin preguntarte:** el margen de 10 minutos por los dos lados (antes era 10 de más y 15 de menos); no sumar intentos (siguen siendo 2 como máximo, cada uno cuenta en los topes de Gemini, así que una generación puede tardar el doble); que el cálculo de ejercicios sea una guía y no una regla; que para "perder grasa" el tiempo elegido siga midiendo solo la parte de fuerza (el cardio va aparte).
- **Ojo:** (1) **no se probó con Gemini real** (gasta cuota): solo con tests de la lógica. Hay que probarlo de a una generación y mirar la pestaña Avisos. (2) Con 40 minutos y los grupos grandes de R3, a veces no entra el volumen: la IA recorta y avisa (R35). (3) Para que los tests no reintenten, la rutina de prueba compartida pasó de 5 a 4 series (dura ~66 min contra los 60 de los tests).

### 90. El reparto parejo de las series manda; el tiempo elegido se apaga por ahora
- **Fecha:** 2026-10-23
- **Decisión:** (1) **El tiempo de la sesión ya no se pide** en el asistente de "Generar rutina" (decisiones 82, 88 y 89): la IA vuelve a decidir la duración con la referencia de R18 y, si el volumen no entra, vale la R35 de antes (alarga la sesión y avisa, y como último recurso recorta). El código y los datos del tiempo **quedan guardados y apagados** (`PEDIR_TIEMPO = false` en `GenerarRutina.tsx`; el backend acepta `minutes` pero no lo exige). (2) **Reparto de las series entre los días** (reglas de diseño del usuario, no son R1 a R36): las series se cuentan **directas** (músculo principal) y solo en los 6 grupos grandes; cada grupo grande se trabaja en **al menos 2 días** si la rutina tiene 3 o más días de fuerza; la diferencia de series entre los días en que se trabaja un mismo grupo es de **3 como máximo**; ningún grupo pasa de **9 series en un día** (3 ejercicios de 3 series); entre el día con más y el día con menos series de grupos grandes hay **4 como máximo**. **Bíceps, tríceps, gemelos y abdominales son complemento:** no cuentan para el volumen de los grupos grandes, no sirven para completar un día, y hay **hasta 6 series de complemento por día**. (3) Si algo de eso no se cumple, el código **pide la rutina de nuevo** (diciéndole qué día y qué músculo) y, si el segundo intento tampoco entra, **la acepta con el aviso** "Reparto" en la pestaña Avisos. El prompt tiene una sección "Reparto de las series entre los días" con estas reglas.
- **El tiempo, por ahora, es solo un dato de control** (aclaración del usuario, 2026-10-23): no se elige ni se exige; se **informa** la duración estimada de cada día (R34, con los 3,5 min de cambio entre ejercicios) para ver cómo salen las rutinas, en las tarjetas de los días y en el aviso R34 cuando se aleja de la referencia de R18.
- **Por qué:** *(completar)*
- **Descartaste:** seguir pidiendo minutos exactos (la IA no logra sumar series, descansos y cambios de máquina, y los días del final quedaban flacos: 60 minutos el Día 1 y 37 el último con 6 días); que el código arme el esqueleto semanal y la IA solo elija ejercicios (queda como opción si esto no alcanza).
- **Decidió la IA sin preguntarte:** las etiquetas de los avisos ("Reparto"); contar solo series directas (las indirectas de 0,5 siguen contando para el volumen semanal de R3, no para el reparto); que un día solo de cardio no entra en el reparto; que el reparto vale para todos los objetivos y niveles; que el paso del tiempo queda oculto y no borrado.
- **Ojo:** (1) **no se probó con Gemini real** (gasta cuota). Hay que probarlo de a una generación y mirar los avisos. (2) Cada reintento es una llamada más y una generación puede tardar el doble. (3) Con muchos días (5 o 6) y pocos grupos grandes al día, puede no entrar el volumen mínimo de R3 con estos topes: la IA recorta y avisa. (4) Se comprobó contra propuestas reales: las de 3 y 4 días pasan sin problemas, y las de 5 y 6 días (13 series de pecho en un día, abdominales de relleno) se marcan.

### 91. La persona elige cómo repartir el entrenamiento
- **Fecha:** 2026-10-23
- **Decisión:** el asistente ofrece tres estructuras: **cuerpo completo (Full Body)**, **torso/pierna (Upper/Lower)** y **empuje/tirón/piernas (PPL)**. La IA arma los días siguiendo esa estructura y el código valida la compatibilidad y los grupos principales de cada día. Se guarda en `routines.split_type`; al continuar aparece seleccionado y puede cambiarse dentro de las opciones válidas.
- **Compatibilidad implementada:** principiantes: cuerpo completo, 2 o 3 días (R12). Para los demás niveles, cuerpo completo entre 2 y 6 días; torso/pierna con 2, 4, 5 o 6 días, excepto 2 días con objetivo masa; PPL con 6 días (dos vueltas de empuje, tirón y piernas). Se excluyen torso/pierna de 3 días y PPL de 3 días porque no cumplen la frecuencia mínima de dos días por grupo grande de la decisión 90; torso/pierna de 2 días y masa no permite alcanzar R3 sin romper el tope de 9 series por grupo y día.
- **Por qué:** permite que la persona controle qué entrena en cada día manteniendo las reglas de reparto de series y frecuencia ya acordadas. Las fuentes no prescriben un split; son opciones de producto.
- **Decidió la IA sin preguntarte:** la compatibilidad concreta entre nivel, objetivo, cantidad de días y estructura descrita arriba; considerar pecho y hombros como empuje, espalda como tirón y cuádriceps, isquios y glúteos como piernas; asignar por defecto Full Body para 2–3 días, torso/pierna para 4–5 y PPL para 6. Son decisiones de implementación revisables.
- **Ojo:** los grupos se validan por músculo principal. Todavía no se probó la generación del prompt actualizado con Gemini real; hacerlo consume cuota.

### 92. Radar de series por músculo y mini barra de entrenamiento en curso
- **Fecha:** 2026-10-26
- **Origen:** *Elegida entre opciones.* El usuario trajo capturas de otras apps como referencia; la IA analizó qué se podía tomar sin chocar con decisiones previas y el usuario aprobó, con maqueta, estas dos mejoras y sus cuatro detalles (ver abajo).
- **Decisión:** (1) **Radar de series por músculo** en Progreso › Estadísticas: un hexágono con los 6 grupos grandes de R3 (pecho, espalda, hombros, cuádriceps, isquios y glúteos) que muestra las series **hechas** en la última semana (la activa o, si no hay, la última cerrada) junto a la semana cerrada anterior de la rutina y el mínimo de 10 series, **dibujado siempre**. Cada punta lleva el nombre del grupo y el número de series aparte; el número va en rojo si no llega al mínimo y en azul si llega. Debajo, un aviso de qué grupos faltan. Cuenta solo series **directas** (músculo principal) con lo realizado. (2) **Mini barra "entrenando ahora"**: una píldora oscura sobre la barra de abajo, en las pantallas que no son de la sección Entrenar, mientras haya un día empezado y sin completar. Muestra el día, el contador de la sesión, el ejercicio activo y **solo "Seguir"** (sin descartar el día). (3) **Mini barra y reloj de descanso son una sola píldora**: mientras corre el descanso muestra la cuenta atrás en lugar del contador (y lleva al ejercicio del descanso); al terminar vuelve el contador. La franja vieja del descanso solo se ve cuando la mini barra no está.
- **Datos:** `GET /weeks/muscles` (`app/routers/weeks.py`, tests en `test_week_muscles.py`); `RadarMusculos.tsx`, `MiniBarraEntreno.tsx`; `Descanso.tsx` suma `setMiniBarra`. No hay migración.
- **Por qué:** *(completar)*
- **Descartaste:** de las referencias, los tipos de serie (calentamiento, fallo, drop: no hay reglas aprobadas), agregar o quitar ejercicios y descartar el entrenamiento (chocan con "el plan no se edita a mano", decisiones 35 y 65), "músculos descansados" (no hay una regla de recuperación entre R1 y R36), la racha (sigue en ideas futuras), elegir el equipo (decisión: gimnasio completo) y las miniaturas de ejercicios. Dejar la mini barra y la franja del descanso apiladas (ocupaban demasiado en el celular).
- **Decidió la IA sin preguntarte:** que el radar compare con la semana anterior y no con el mes (Spotter trabaja por semana); que bíceps, tríceps, gemelos y core queden afuera (no cuentan para R3); el color del número (rojo si no llega, azul si llega) y los textos; que la mini barra se oculte en toda la sección Entrenar (la semana, el día, el modo entrenar y la propuesta) y en los días que se abren desde Rutinas; que muestre como "ejercicio activo" el primero sin marcar como hecho, aunque en el modo entrenar se haya quedado en otro; que sin día en curso la franja vieja del descanso siga apareciendo.
- **Ojo:** (1) probado en pantalla con un usuario descartable en un celular emulado (el radar, la mini barra, la cuenta atrás y la vuelta al contador); **no se probó** iniciar el descanso desde el modo entrenar y salir a otras pantallas más allá de lo descrito, ni en un celular real. (2) La mini barra se superpone con el final de las pantallas (se puede desplazar). (3) Con pocas series el polígono se ve chico, porque el eje llega al menos a 14. (4) Quedan sin hacer de las referencias: el mapa del cuerpo, el informe mensual y la cabecera del día con ejercicios y músculos.

### 93. Al completar el día se ve un resumen y se elige adónde ir
- **Fecha:** 2026-10-26
- **Decisión:** al tocar "Día completado" en el modo entrenar, la app **ya no salta sola a Inicio**: se queda en una pantalla de cierre con el título, el día, tres cifras (**duración**, **series** y **volumen** del día) y dos botones: **Ver estadísticas** (principal, lleva a Progreso › Estadísticas, donde está el radar de series por músculo) e **Ir a Inicio** (secundario). Las cifras se calculan en pantalla con lo registrado: series con algo cargado, kilos movidos (repeticiones × kilos) y minutos de "Empezar día" a "Día completado". La pantalla es la misma que se ve al volver a un día ya completado. Cambia lo que decía la decisión del cierre del día (que llevaba a Inicio).
- **Por qué:** *(completar)*
- **Descartaste:** dejar la redirección a Inicio y sumar el botón en otra parte; mostrar solo los botones, sin resumen.
- **Decidió la IA sin preguntarte:** los textos y la disposición (las cifras en tarjetas, el volumen a todo el ancho); mostrar "Sin medir" en la duración si el día no se empezó con el botón y "—" si no hay series con peso; que no haya cambios en el backend (todo sale del detalle del día).
- **Ojo:** un día completado queda en lectura, y el encabezado decía "solo lectura" apenas se cerraba; por pedido del usuario ya no lo dice en los días completados de una semana activa (en semanas cerradas sigue). Probado en pantalla con un usuario descartable en un celular emulado.

### 94. Estadísticas por período y gráficos de curva continua
- **Fecha:** 2026-10-26
- **Decisión:** (1) Un selector **Día · Semana · Mes · Año** en Progreso › Resúmenes y en el radar de series por músculo; la elección se recuerda en el navegador. Día, mes y año juntan todas las rutinas, cuentan solo los días con "Día completado" y se recorren con flechas (`GET /progress/period` y `GET /progress/muscles`, sin IA); la semana queda como estaba. El mínimo de R3 (10 por semana) se escala a los días que pasaron del período y en el día no hay mínimo. (2) La evolución por ejercicio y el peso de Cuerpo pasan a una **curva continua** (sin cortes ni un círculo por dato) con fechas reales en el eje; el ejercicio con selector Semana · Mes · Año y Cuerpo con Mes · Año · Todo y medida Peso · Grasa · IMC. (3) Cuerpo se divide en dos pestañas, Resumen y Lista; Estadísticas, en dos secciones, Músculos y Ejercicios. (4) La cantidad de series del radar sale en un globo al pasar el mouse o tocar, no fija. (5) Las listas de Resúmenes arrancan plegadas y el gráfico de barras tiene líneas guía y detalle al tocar. (6) Pantalla de carga: la leyenda del tiempo fija abajo y la frase arriba del disco, en cursiva y gris. (7) Inicio, con todos los días hechos, marca "Falta cerrar la semana" y deja cerrarla desde ahí.
- **Por qué:** *(completar)*
- **Decidió la IA sin preguntarte:** que el período de Estadísticas se abra en Semana; que las barras de Mes y Año midan series y no kilos; que la ventana de Cuerpo termine en la última medición y no en hoy; que "Semana" del radar muestre solo la última semana; los textos y el color amarillo de la marca de cierre.
- **Ojo:** probado con tests del backend (`test_period.py`) y chequeo de tipos; **no se vio en pantalla con datos reales**. Los "min entrenando" de un mes pueden dar de más si un día quedó empezado mucho antes de completarse.

### 95. Cada estadística tiene su pantalla y aparece el mapa muscular
- **Fecha:** 2026-10-26
- **Decisión:** (1) **Progreso es un índice** (`/progreso`) con una pantalla propia por estadística, sin pestañas dentro de pestañas: Resúmenes (`/progreso/resumenes`), Series por músculo (`/progreso/musculos`), Mapa muscular (`/progreso/mapa`), Evolución por ejercicio (`/progreso/ejercicios`), Calendario y Cuerpo y peso. Estadísticas deja de ser una pantalla; Inicio tiene una sola tarjeta, "Ver mi progreso". (2) **Mapa muscular:** las mismas series del radar, pintadas sobre una silueta de frente y de espalda, en 4 tonos de azul (el azul es la carga en Disco; el rojo queda para "te falta" en el radar), sobre fondo blanco y con contorno. Incluye los complementos (bíceps, tríceps, gemelos y core), que el backend devuelve aparte en `others` sin tocar el radar. (3) **El dibujo sale del sexo del perfil** (hombre o mujer); solo con "otro" o sin dato se elige a mano, y se recuerda en el navegador. (4) Los dibujos se copiaron de react-native-body-highlighter 3.2.0 (MIT, sin el pelo) a `frontend/src/lib/cuerpoMusculos.ts`, sin dependencia nueva; la librería probada antes (react-body-highlighter) se descartó por angulosa.
- **Por qué:** *(completar)*
- **Descartaste:** el mapa dentro de Estadísticas debajo del radar; el panel oscuro y el rojo; un dibujo neutro; la pestaña "Mapa" y el interruptor dentro de la tarjeta del radar.
- **Decidió la IA sin preguntarte:** los nombres de las tarjetas y sus íconos; que el mapa mida los complementos con la misma vara del mínimo de R3 (no tienen mínimo propio); que "otro" y el sexo vacío usen el selector; 4 niveles de intensidad (hasta el 150 % del mínimo).
- **Ojo:** probado con tests del backend y chequeo de tipos; **no se vio en pantalla**. El dibujo no separa gemelos de sóleo ni core de oblicuos como el catálogo.

### 96. Borrar la cuenta
- **Fecha:** 2026-10-26
- **Decisión:** `DELETE /auth/account` con la contraseña en el cuerpo. Borra al instante el usuario y, en cascada, su perfil, rutinas, semanas, entrenamientos, mediciones, propuestas y enlaces de recuperación; también un registro pendiente con su correo. Borra la cookie y el mismo correo se puede volver a registrar. **`ai_calls` sobrevive:** la migración 0025 deja `ai_calls.user_id` opcional y con `SET NULL` (antes `RESTRICT`, que impedía borrar a cualquiera que hubiera usado la IA), así los topes de Gemini siguen contando todas las llamadas. En la pestaña Cuenta, la fila abre un recuadro con la advertencia, el campo de contraseña y el botón rojo "Borrar mi cuenta" (`BorrarCuenta.tsx`).
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)*
- **Decidió la IA sin preguntarte:** borrado inmediato, sin período de gracia; confirmar con la contraseña y no escribiendo "BORRAR"; sin correo de despedida; que `email_log` y la tabla compartida `exercises` no se toquen; el texto del recuadro.
- **Ojo:** probado con tests del backend (582 pasan) y a mano contra PostgreSQL con un usuario descartable (el borrado en cascada y `ai_calls` sin dueño); **el recuadro no se vio en pantalla**. Respaldo previo a la migración en `backups/antes-0025.sql`.

### 97. Cambiar el correo
- **Fecha:** 2026-10-26
- **Decisión:** el cambio se confirma desde el correo **nuevo**, como el registro. `POST /auth/change-email` (con sesión; pide el correo nuevo y la contraseña) guarda el pedido en `email_changes` (migración 0026, una fila por usuario: un pedido nuevo anula el anterior) y manda un enlace de 24 horas a la dirección nueva; la cuenta sigue con el correo viejo hasta que se toque. `POST /auth/confirm-email-change` (pública, con el código del enlace; sirve una sola vez) cambia el correo y **cierra todas las sesiones** con `password_changed_at` (decisión 80): se entra de nuevo con el correo nuevo. **No se avisa al correo viejo.** Valen los topes de correo de siempre (1 por minuto por dirección y el diario). En Cuenta la fila va debajo de Cambiar contraseña (`CambiarCorreo.tsx`) y la pantalla del enlace es `/confirmar-correo`.
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)*
- **Decidió la IA sin preguntarte:** pedir la contraseña para iniciar el cambio; el vencimiento de 24 horas; que el correo nuevo ya registrado dé 409 al pedirlo (igual que el registro) y de nuevo al confirmar; que el mismo correo dé 400; los textos del correo y de las pantallas.
- **Ojo:** probado con tests del backend (593 pasan) y a mano con un usuario descartable, con el correo real que llega a Mailpit; **las pantallas no se vieron**. Quien tenga el correo viejo no se entera del cambio.

### 98. Recordarme en el login
- **Fecha:** 2026-10-26
- **Decisión:** casilla **"Recordarme en este aparato"** debajo de la contraseña en el login, tildada por defecto. `POST /auth/login` recibe `remember` (si falta, queda en `true`). Tildada: la sesión dura **30 días** y la cookie se guarda en el aparato (antes toda sesión duraba 7 días); sin tildar: **12 horas** y la cookie, sin vencimiento, se borra al cerrar el navegador. Cambiar la contraseña conserva el tipo de sesión que tenía. **La app no guarda la contraseña:** lo que evita volver a escribirla es la sesión larga; el navegador del celular no ofrecía guardarla.
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)*
- **Decidió la IA sin preguntarte:** que venga tildada, los 30 días y las 12 horas, que las cuentas nuevas y los demás inicios de sesión (verificar el correo) queden como "recordado", y que no se guarde la contraseña en el navegador ni en la app.
- **Ojo:** probado con tests del backend (598 pasan); **la pantalla no se vio**. Las sesiones ya abiertas siguen con su vencimiento de 7 días.

### 99. Aductores, antebrazo y tibial como grupos complemento (Fase 1 del mapa muscular)
- **Fecha:** 2026-10-26
- **Decisión:** el enum `Muscle` suma `adductors`, `forearm` y `tibialis` (migración 0027, que cambia la restricción `ck_muscle`). Son **complemento** como bíceps, tríceps, gemelos y core: hasta 6 series por día entre todos, no cuentan para el volumen de los grupos grandes ni completan un día. El catálogo suma **7 ejercicios** (124 en total): Aductores en máquina (sentado), Aducción de cadera en polea, Sentadilla sumo con mancuerna (principal cuádriceps; aductores y glúteos secundarios), Curl de muñeca, Extensión de muñeca, Curl invertido con barra Z y Elevación de puntas de pie. El mapa pinta las tres piezas (`adductors`, `forearm`, `tibialis`). **Cuello, cabeza, manos, pies, tobillos y rodillas siguen sin pintarse** (se dibujan en gris como hoy, sin series): son estabilizadores o no son músculos de entrenamiento, y R5b dice que los estabilizadores no suman. El cuello no lleva ejercicios por seguridad.
- **Por qué:** *(completar)*
- **Descartaste:** el cuello (ejercicios y pieza); una vista lateral; separar el hombro en cabezas por ahora (queda en `docs/mapa-muscular-detalle-borrador.md`).
- **Decidió la IA sin preguntarte:** que el **Paseo del granjero** quede afuera (R13 pide que los isométricos sean core: hay que decidir cómo se etiqueta un acarreo); que la sentadilla sumo lleve cuádriceps como principal (con aductores como secundario) en vez de aductores; que **no** se etiqueten aductores como secundario en las otras sentadillas ni en los pesos muertos (el mapa cuenta solo series directas, así que no se verían; y para pesos muertos e hip thrust no hay fuente); que el curl martillo no lleve antebrazo (sin fuente). Los textos y las descripciones de los 7 ejercicios son un borrador mío: **faltan que los apruebes**.
- **Ojo:** probado con tests del backend (los mismos 597 más uno nuevo; solo falla el que ya fallaba por falta de `google-genai`); **la pantalla no se vio** con los grupos nuevos pintados. Las fuentes son débiles: ver `docs/criterios-entrenamiento.md`. Los 7 ejercicios nuevos ya están indexados (2026-10-26, 7 textos del tope de embeddings, a nombre de la cuenta del usuario).

### 100. Condición general y mantenerme activo, un solo objetivo
- **Fecha:** 2026-10-26
- **Decisión:** los objetivos pasan de 5 a 4: **masa, fuerza, perder grasa y mantenerme activo**. "Condición general" se une a "mantenerme activo", que usa las cifras de **R25** (2 a 3 sesiones de fuerza, 2 a 3 series por ejercicio, 6 a 10 series semanales por grupo grande, 150 a 300 minutos de aeróbico, repeticiones de 6 a 15); **R24 queda reemplazada**. Migración 0028: las rutinas y las propuestas con "condición general" pasan a "mantenerme activo" (también el nombre automático) y se cambia la restricción `ck_goal`.
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)* (se hablaron: dejar solo masa, fuerza y perder grasa; y quedarse con las cifras de R24 o con un rango que cubra a las dos)
- **Decidió la IA sin preguntarte:** que el objetivo único conserve el nombre "Mantenerme activo" y el ícono de las zapatillas (la sugerencia no fue contestada) y que las cifras sean las de R25, la opción recomendada, porque dijiste "continuá" sin elegir entre las tres.
- **Ojo:** el prompt nuevo **no se probó con Gemini real**. Respaldo previo en `backups/antes-unificar-objetivos-2026-10-26.sql`. Probado con tests del backend (597 pasan); la pantalla no se vio.

### 101. R36 la calcula el código y la estructura del día es un aviso
- **Fecha:** 2026-10-26
- **Decisión:** (1) **R36 (bajar un escalón):** el escalón se resta del peso **planificado** (no del levantado) y, si lo levantado ya fue más bajo, se usa lo levantado. En las pruebas con Gemini real no lo cumplió dos veces (puso 45 en vez de 47,5 y 50 en vez de 54), así que **el código calcula el peso sugerido** de los ejercicios en "no llegó" (`suggested_drop` en `ai/history.py`: el planificado menos el escalón del equipo, o lo levantado, el menor de los dos; barra y mancuernas 2,5 kg, pesas rusas 4, poleas 5, máquinas 2,5 si el nombre incluye prensa, hack o Smith y 5 en el resto) y se lo escribe a Gemini; Gemini sigue decidiendo si el comentario cuenta fatiga. Con eso bajó bien las 2 veces que se probó. (2) **Estructura del día:** que un día no trabaje justo los grupos de su foco en torso/pierna, PPL o cuerpo completo (por ejemplo, un día de torso sin hombros como músculo principal) **deja de rechazar la generación**: se pide la rutina de nuevo una vez y, si sigue igual, se acepta con el aviso "Split" en la pestaña Avisos, como el reparto de series. Sigue siendo error el split incompatible con los días o el nivel. El prompt de torso/pierna pide los tres grupos de cada día.
- **Origen:** tuya (2026-10-26): "hacer las correcciones que tengas que hacer; si creés que tenés que relajarlo, y probá". Cumple lo que ya decían la decisión 91 y `CLAUDE.md` ("reintenta una vez y después muestra los avisos"): el código era más estricto que lo decidido.
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)* (se hablaron: dejar el chequeo estricto y reforzar el prompt; eliminar R36)
- **Decidió la IA sin preguntarte:** la base del escalón (planificado y no levantado); los escalones de las máquinas (2,5 kg en prensa, hack y Smith, 5 kg en el resto); que el ejercicio sin peso (peso corporal, banda) no lleve sugerencia; relajar el chequeo en vez de eliminarlo.
- **Ojo:** probado con 4 corridas de Gemini real (2 de torso/pierna con semana nueva con fatiga y 2 intentos previos que fallaron antes del cambio) y 602 tests. Sin el comentario de fatiga no se probó. Las semanas nuevas salieron con pocos ejercicios (de 29 a 37 minutos) y avisos de R3: no se sabe si es el prompt o variación de Gemini.

### 102. Solo se continúa la rutina más reciente
- **Fecha:** 2026-10-27
- **Decisión:** la rutina que se puede **continuar o reabrir** es solo la más reciente con semanas (`current_routine_id` en `routers/weeks.py`). `POST /proposals/generate` con una rutina anterior y `POST /weeks/{id}/reopen` sobre una semana de una rutina anterior responden **409** ("Esa rutina ya terminó…"). El asistente de Generar ofrece continuar solo la última. En Rutinas, la más reciente lleva el borde oscuro y la etiqueta **"Activa"** (aunque su semana ya esté cerrada) y las demás **"Terminada"**; se pueden mirar (semanas, días, ejercicios) pero no continuar. Reemplaza al "lista para continuar" de la decisión 66 para las rutinas viejas. El botón «+» flotante de Rutinas se sacó: "Nueva rutina" queda en Inicio y en Entrenar. El historial (Resúmenes, Calendario, evolución) sigue sumando todas las rutinas.
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)*
- **Decidió la IA sin preguntarte:** que "la más reciente" sea la de creación más nueva entre las que tienen semanas (la misma que ofrece Inicio); que el botón "Reabrir" de una semana vieja siga visible y muestre el mensaje del servidor en vez de esconderse.
- **Ojo:** probado con 2 tests nuevos (605 pasan); las pantallas no se vieron en un celular.

### 103. Resúmenes por fecha: la semana es de calendario y el período se elige con un botón
- **Fecha:** 2026-10-27
- **Decisión:** en Progreso › Resúmenes, **Semana** pasa a ser por fecha como Día, Mes y Año: la semana de calendario (lunes a domingo), sumando todas las rutinas (`GET /progress/period?period=week`). Ya no hay desplegable de rutinas ni barritas de semanas; **"Lo que dijo la IA" y el comentario de cierre salen de esa pantalla** (siguen guardados). Las tarjetas de números (días entrenados, series, kg, cardio y min entrenando) **se tocan y cambian el gráfico de abajo** (por día o por mes; cada barra trae también cardio y minutos), y se sacaron las listas de días y de ejercicios de Mes y Año. "Cómo te fue" queda solo en Día, con una barra de búsqueda dentro del detalle. El período se elige con un **botón "Día ▾" con menú** en la misma fila que las flechas y la fecha (`dd/mm/aaaa`, opción A de la maqueta del 2026-10-27); lo mismo en Radar, Mapa, Evolución por ejercicio y Cuerpo y peso (`SelectorChip`). Resúmenes y Calendario se abren desde Inicio y Progreso queda con Radar, Mapa, Evolución y Cuerpo en cuatro botones grandes. Al tocar "Día completado" se va a Resúmenes › Día.
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)* (se hablaron: dejar Semana por rutina; el calendario al tocar la fecha; deslizar entre días)
- **Decidió la IA sin preguntarte:** que la semana de calendario empiece el lunes; el aspecto de las tarjetas (la primera ancha, la última ancha si queda impar) y los textos del menú.
- **Ojo:** la pantalla no se vio en un celular. Una semana de rutina que cruza dos semanas de calendario queda partida en dos.

### 104. Lo que se muestra en "Cómo te fue" se separa de la señal que va a la IA
- **Fecha:** 2026-10-27
- **Decisión:** la señal por ejercicio de `signal()` (mayoría estricta de series, decisión 73) **no cambia**: es la que recibe la IA. Lo que se **muestra** en pantalla se calcula aparte (`senalVisible` en `ComoTeFueResumen.tsx`): alcanza con **una** serie distinta de lo planificado. "Superaste" si alguna pasó y ninguna quedó abajo, "No llegaste" si alguna quedó abajo y ninguna pasó, y **"Mixto"** ("subiste y bajaste", disco medio lleno) si hubo de las dos.
- **Origen:** tuya (2026-10-27): "una cosa es la señal a la IA y otra es que me marque que hice más".
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)* (se hablaron: dejarlo como estaba; cambiar también la señal a la IA)
- **Decidió la IA sin preguntarte:** el nombre "Mixto" y el disco `parcial` para dibujarlo.
- **Ojo:** el disco "mixto" no se vio en pantalla.

### 105. Las restricciones motrices quedan fuera del alcance de la app
- **Fecha:** 2026-10-29
- **Decisión:** no se construye el casillero de restricciones motrices en el perfil ni las reglas R37 a R42 (que nunca se aprobaron). Lo que la persona escribe en "limitaciones" sigue viajando a la IA solo como texto. El borrador `restricciones-motrices-borrador.md` queda como referencia, sin vigencia.
- **Origen:** tuya (2026-10-29): "las restricciones motrices no las vamos a aplicar, las dejamos afuera del alcance de la App".
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)* (el plan de casilleros que el código hace cumplir, en fases)
- **Decidió la IA sin preguntarte:** nada de código; solo se sacó de los pendientes en `CLAUDE.md`, `AGENTS.md`, `backlog.md` y `parametros-generacion.md`.
- **Ojo:** una limitación como "silla de ruedas" sigue chocando con la exigencia de cubrir cuádriceps, isquios y glúteos; el aviso legal es lo que cubre ese límite.

### 106. Límite de intentos del login, secreto largo y cookie segura obligatoria
- **Fecha:** 2026-10-30
- **Decisión:** (1) el login se bloquea con un 429 después de **5 fallos por correo o 20 por IP en 15 minutos**; los fallos se anotan en la tabla `login_attempts` (migración 0029), como `email_log` con los correos; el correo que no existe también cuenta, para no delatar qué cuentas hay. (2) `JWT_SECRET` tiene que tener **32 caracteres o más**; el `.env.example` ya no trae un valor de ejemplo. (3) En producción, `COOKIE_SECURE` es **obligatorio** en el `.env` (con HTTPS, `true`).
- **Origen:** de la IA, de la revisión de seguridad del 2026-10-29; vos elegiste hacer los tres de backend y dejaste a la IA las decisiones de diseño ("si lo que vos creas que es mejor").
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)* (se habló: un contador en memoria, que se pierde al reiniciar)
- **Decidió la IA sin preguntarte:** los números (5, 20 y 15 minutos, sin fuente); leer la IP de `request.client.host` y no de un encabezado; el mensaje del 429; no rechazar el valor de ejemplo de `JWT_SECRET` (rompería tu `.env` de desarrollo, que todavía lo usa).
- **Ojo:** (1) detrás de un proxy en producción todos llegan con la IP del proxy y el tope de 20 por IP frenaría a todos juntos: al desplegar hay que leer la IP real. (2) Tu `.env` de desarrollo todavía tiene el valor de ejemplo como secreto: cambialo antes de producción. (3) Reemplaza el "poner un límite de intentos" que descartaste en la decisión 80.

### 107. Encabezados de seguridad, /docs apagado en producción y registros vencidos
- **Fecha:** 2026-10-30
- **Decisión:** (1) Next manda `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (sin cámara, micrófono ni ubicación) y, solo en producción, HSTS; **sin Content-Security-Policy**. (2) Con `APP_ENV=production` (lo pone el compose de producción) el backend no publica `/docs`, `/redoc` ni `/openapi.json`. (3) Cada pedido de registro borra los pedidos pendientes vencidos de cualquiera.
- **Origen:** de la IA, de la revisión de seguridad; vos dijiste "sí, los tres".
- **Por qué:** *(completar)*
- **Descartaste:** *(completar)* (se habló: una CSP estricta con nonces, que obliga a renderizar todo de forma dinámica y choca con `cacheComponents`)
- **Decidió la IA sin preguntarte:** la lista de encabezados y sus valores, el nombre `APP_ENV`, y el año de vigencia de HSTS (31536000 s, sin `includeSubDomains`).
- **Ojo:** sin CSP, un XSS (hoy no hay `dangerouslySetInnerHTML`) no tendría esa segunda barrera. Queda como mejora para después del despliegue.

### 108. El pecho del mapa muscular se divide en alto y bajo (Fase 2, primer paso)
- **Fecha:** 2026-11-01
- **Decisión:** el mapa pinta el pecho en **dos partes**, alta (clavicular) y baja (esternal), con un corte curvo que sube hacia el brazo. Cada ejercicio del catálogo gana `detail_muscles` (`chest_upper` o `chest_lower`; solo 13 de los 14 de pecho: el cruce de poleas queda sin etiqueta porque depende del ángulo). Alto: press inclinado (barra, mancuernas y máquina) y flexiones con pies elevados. Bajo: el resto (press plano, press en el suelo, flexiones, fondos en paralelas y aperturas). Las series de cada parte salen del catálogo por el nombre del ejercicio (sin migración, sirve para semanas ya guardadas) y llegan en `details` de `GET /weeks/muscles` y `GET /period/muscles`. **Solo sirve para pintar el mapa:** el radar, R3, la IA y el catálogo embebido no cambian (`detail_muscles` no entra en el texto de los vectores: no hay que reindexar).
- **Por qué:** *(completar)*
- **Descartaste:** dividir el pecho en tres partes (alto, medio y bajo): la parte media sale de una convención de entrenamiento y no tiene respaldo anatómico directo.
- **Decidió la IA sin preguntarte:** el corte curvo (variante que sube hacia el brazo), que el cruce de poleas quede sin etiqueta, que los ejercicios sin etiqueta cuenten solo para el pecho completo y que las partes se midan con la misma vara que los demás músculos del mapa.
- **Ojo:** las etiquetas son de mi conocimiento de anatomía y **no verifiqué fuentes** (EMG de press inclinado contra plano); las aprobaste igual, así que quedan pendientes de fuentes y de la revisión de una persona de educación física. Probado con tests del backend (618) y mirado en el navegador con un usuario descartable (ya borrado) en la vista de frente de hombre; **no se vio la de mujer ni en un celular**. Faltan hombro y espalda (fase 2) y las piernas y brazos (fase 3).

### 109. El hombro del mapa muscular se divide en sus tres cabezas (Fase 2, segundo paso)
- **Fecha:** 2026-11-01
- **Decisión:** el mapa pinta el hombro en **tres partes**: anterior, lateral y posterior (`delt_front`, `delt_side`, `delt_rear` en `detail_muscles`). De frente se ven la anterior y la lateral; de espalda, la posterior y la lateral (el dibujo no tiene vista lateral). El corte es una curva por la mitad del hombro: del lado del cuerpo, la anterior (frente) o la posterior (espalda); el resto es la lateral. Etiquetas de los 11 ejercicios de hombro: anterior = los 4 presses (barra, mancuernas, máquina y Arnold) y las elevaciones frontales; lateral = las 3 elevaciones laterales (mancuernas, polea y banda); posterior = pájaros con mancuernas, pájaros en máquina y face pull. Mismo mecanismo que el pecho (decisión 108): solo para pintar el mapa, sin migración ni reindexado.
- **Por qué:** *(completar)*
- **Descartaste:** nada por ahora.
- **Decidió la IA sin preguntarte:** que el corte sea por la mitad (las proporciones reales de las tres cabezas no son iguales) y que los presses cuenten solo como anterior aunque trabajan también la lateral.
- **Ojo:** etiquetas sin fuentes (de anatomía, sin estudios de actividad muscular). Probado con tests del backend (618) y mirado en el navegador con un usuario descartable (ya borrado): hombre de frente y de espalda y mujer de frente; **no se vio la espalda de mujer ni un celular**. Falta la espalda (dorsal, romboides, trapecio y lumbar) y la fase 3.

### 110. La espalda del mapa muscular se divide en tres partes y el catálogo suma 3 ejercicios (Fase 2, tercer paso)
- **Fecha:** 2026-11-01
- **Decisión:** el mapa pinta la espalda en **tres partes**: dorsal ancho (`back_lats`), espalda media y alta (`back_mid`: trapecio, romboides y redondos) y lumbar (`back_low`). No hubo que dibujar nada: el dibujo ya trae esas piezas por separado y solo se agrupan (de `upper-back`, los dos trazos grandes son el dorsal y los chicos van con el trapecio). Etiquetas de los 16 ejercicios que había: dorsal = los jalones (polea y agarre neutro), las dominadas (normales, asistidas y de bajada lenta) y los dos pullovers; espalda media = los 9 remos. **El catálogo suma 3 ejercicios (127 en total), aprobados por vos:** Hiperextensiones en banco y Extensión lumbar en el piso (Superman), que van a la lumbar, y Encogimientos de hombros con mancuernas, a espalda media y alta. Los tres son de principiante, con músculo principal espalda. Ya están indexados (3 textos del tope de embeddings, a nombre de tu cuenta).
- **Por qué:** *(completar)*
- **Descartaste:** nada por ahora. Quedaron afuera los buenos días con barra (riesgo para la columna) y un grupo lumbar aparte.
- **Decidió la IA sin preguntarte:** que los tres ejercicios cuenten como "espalda" para R3 (no hay un grupo lumbar aparte: se podría cubrir el mínimo de espalda con hiperextensiones; no lo respondiste, así que quedó así); que los remos cuenten solo como espalda media aunque trabajan también el dorsal; que el trapecio y los redondos vayan juntos; y los textos, el nivel, el equipo y la mecánica de los 3 ejercicios nuevos (borrador mío).
- **Ojo:** las etiquetas y los textos no tienen fuentes. Probado con tests del backend (618) y mirado en el navegador con un usuario descartable (ya borrado) en la espalda del hombre; **no se vio la espalda de mujer ni un celular**. Los ejercicios nuevos no se probaron con una generación real de Gemini. Faltan piernas y brazos (fase 3).

### 111. El glúteo del mapa muscular se divide en mayor y medio (Fase 3, primer paso)
- **Fecha:** 2026-11-01
- **Decisión:** el mapa pinta el glúteo en **dos partes**: mayor (`glute_max`) y medio (`glute_med`). No hubo que dibujar nada: el dibujo ya trae por lado una pieza grande (el mayor) y una chica arriba (el medio), y solo se agrupan (`GLUTEO_MEDIO` en `lib/cuerpoMusculos.ts`). Solo se ve en la vista de espalda. Etiquetas: mayor = hip thrust (barra, mancuerna y máquina), puente de glúteos, patada en polea, patada en cuadrupedia y balanceo con kettlebell; medio = abducción de cadera en máquina y caminata lateral con banda. Mismo mecanismo que las decisiones 108 a 110.
- **Por qué:** *(completar)*
- **Descartaste:** nada por ahora.
- **Decidió la IA sin preguntarte:** que el balanceo con kettlebell vaya a glúteo mayor (lo aprobaste con la tabla), y que las sentadillas, zancadas y pesos muertos no se etiqueten (el mapa cuenta solo series directas y el glúteo es su ayuda).
- **Ojo:** etiquetas sin fuentes. Probado con tests del backend (618) y mirado en el navegador con un usuario descartable (ya borrado) en la espalda del hombre; **no se vio la espalda de mujer con el glúteo partido ni un celular**. Faltan cuádriceps, bíceps, tríceps, gemelos e isquios (fase 3), que sí necesitan cortes dentro de una sola pieza.

### 112. Tríceps y gemelos del mapa muscular se dividen en dos partes (Fase 3, segundo paso)
- **Fecha:** 2026-11-01
- **Decisión:** el mapa pinta el **tríceps** en cabeza larga (`triceps_long`) y lateral y medial (`triceps_side`), y los **gemelos** en gastrocnemio (`calf_gastro`) y sóleo (`calf_soleus`). Se agrupan las piezas que ya trae el dibujo (`TRICEPS_LARGO` y `GEMELO_SOLEO` en `lib/cuerpoMusculos.ts`); de frente, el tríceps se pinta como lateral y medial y los gemelos como gastrocnemio. Etiquetas: cabeza larga = extensión sobre la cabeza y press francés; lateral y medial = extensiones en polea (cuerda y barra), extensión con banda, patada, fondos en banco y press cerrado; gastrocnemio = las 4 elevaciones de talones de pie (máquina, prensa, mancuerna y peso corporal); sóleo = la elevación sentado en máquina. Mismo mecanismo que las decisiones 108 a 111.
- **Por qué:** *(completar)*
- **Descartaste:** nada por ahora. **Quedan sin dividir, por recomendación de la IA que aceptaste:** cuádriceps (casi todos los ejercicios trabajan todas las partes), bíceps (el dibujo tiene una sola pieza y las cabezas no se distinguen por el ejercicio) e isquios (el reparto es desigual y poco claro).
- **Decidió la IA sin preguntarte:** que la lateral y la medial del tríceps vayan juntas (no hay ejercicios que las separen) y que las piezas finas de abajo de los gemelos sean el sóleo (es lo que mejor encaja con el dibujo, pero no se pudo confirmar).
- **Ojo:** etiquetas sin fuentes. Probado con tests del backend (618) y mirado en el navegador con un usuario descartable (ya borrado) en la espalda del hombre; **no se vio la espalda de mujer con estas partes, la vista de frente ni un celular**.

### 113. Se despliega todo en Vercel, con la base en Neon
- **Fecha:** 2026-11-07
- **Decisión:** la app pública corre **entera en Vercel**: el frontend (Next.js) y el backend (FastAPI) como dos servicios de un mismo proyecto (Vercel Services), más una base **PostgreSQL en Neon** (plan gratis, región Frankfurt, con pgvector). Dirección de producción: `https://spotter-vert.vercel.app`. Vercel manda `/api/*` al backend y todo lo demás al frontend, así la cookie de sesión viaja sin CORS. Cada `git push` a `main` despliega solo. Los correos salen por SMTP desde una cuenta de Gmail creada solo para Spotter, con contraseña de aplicación.
- **Por qué:** *(completar)*
- **Descartaste:** el backend en Render (el plan gratis duerme el servicio y su base gratis vence a los 30 días) y un servidor propio con el `docker-compose.prod.yml` (la IA lo recomendó por ser lo que ya estaba armado; elegiste Vercel). Un dominio propio, por ahora.
- **Decidió la IA sin preguntarte:** la región Frankfurt (`fra1`) para el backend, junto a la base; que `vercel_entry.py` monte toda la API bajo `/api` (Vercel no quita el prefijo); que en Vercel el motor de la base apague las sentencias preparadas y use un pool de 2 conexiones (la dirección con pool de Neon lo exige); que el límite de intentos del login lea la IP de `x-forwarded-for` solo cuando existe `VERCEL`; un `JWT_SECRET` nuevo para producción; `EMAIL_DAILY_LIMIT=50` (el borrador del proyecto); y dejar activa la Vercel Authentication, que hoy pide iniciar sesión en Vercel para ver la web.
- **Ojo:** Vercel Services está en **Beta**; el plan Hobby es solo para uso personal no comercial. Neon usa **Postgres 18** y el desarrollo la 17 (las migraciones corrieron bien, no se probó todo). La contraseña de Neon y el `JWT_SECRET` nuevo pasaron por la conversación con la IA: conviene **rotarlos**. Con la protección de Vercel activa, otra persona no puede entrar ni abrir el enlace del correo de verificación. Se probó el registro, la verificación y el perfil con una cuenta real; **no se probó "Generar rutina" en producción**.

### 114. La web publicada arranca vacía
- **Fecha:** 2026-11-07
- **Decisión:** la base de Neon no lleva los datos de la PC (usuarios, rutinas, series, historial de la IA). Solo se copiaron las migraciones y los **127 vectores del catálogo** de ejercicios, que no tienen datos personales y así no se gastó cuota de embeddings. Las cuentas se crean registrándose.
- **Por qué:** *(completar)*
- **Descartaste:** subir el volcado entero (traía usuarios de prueba y datos personales) y subir solo tu usuario. Queda abierto subirlo más adelante si hace falta.
- **Decidió la IA sin preguntarte:** nada importante.
- **Ojo:** el respaldo con todo está en una carpeta del escritorio (`viaje-argentina`, con claves y datos personales).

### 115. La web se abre al público con Standard Protection
- **Fecha:** 2026-11-07
- **Decisión:** la Vercel Authentication pasó de proteger todas las direcciones `*.vercel.app` a **Standard Protection** (`prod_deployment_urls_and_all_previews`). `https://spotter-vert.vercel.app` abre sin iniciar sesión en Vercel (comprobado con `curl`); las previews y las direcciones largas de cada despliegue siguen pidiendo login de Vercel. Se puede volver atrás cambiando el valor a `all_except_custom_domains`.
- **Por qué:** *(completar)*
- **Descartaste:** apagar la Vercel Authentication por completo (dejaría abiertas también las previews) y mandar solo un enlace temporal de 23 horas para el profesor.
- **Decidió la IA sin preguntarte:** nada importante.
- **Ojo:** los topes compartidos (400 llamadas por día a Gemini, `EMAIL_DAILY_LIMIT=50`) ahora los puede gastar cualquiera. El aviso legal visible (#34) sigue en espera. El registro, la verificación y "Generar rutina" no se probaron todavía con una cuenta ajena.

### 116. Spotter se puede instalar en el teléfono (PWA)
- **Fecha:** 2026-11-07
- **Decisión:** la web se puede instalar como app, sin tiendas: `app/manifest.ts` (nombre "Spotter", `display: "standalone"`, color tinta `#172033`) e íconos de 192, 512 y 180 px (iPhone). **Ícono:** el disco rojo del logo sobre tinta (opción A de cuatro). **Barra de arriba del teléfono:** tinta. **Cómo se ofrece:** un botón "Instalar la app en tu teléfono" en la **Bienvenida**, debajo de "Crear cuenta" (idea tuya; la maqueta lo ponía en Perfil › Cuenta); solo en el teléfono y si todavía no está instalada; en Android abre el aviso del navegador y en iPhone muestra los pasos del menú Compartir. **Sin internet:** no por ahora. **Sesiones:** se construye y se prueba en un teléfono real antes de agregar avisos sobre los enlaces de los correos.
- **Por qué:** *(completar)*
- **Descartaste:** los íconos B (disco sobre claro), C (la barra de la pestaña) y D ("SP" con disco); la barra de arriba clara; instalar solo desde el menú del navegador; una pantalla propia "Sin conexión"; un aviso en las pantallas de los enlaces del correo (por ahora).
- **Decidió la IA sin preguntarte:** el botón va solo en la Bienvenida (la copia en Perfil › Cuenta quedó sin respuesta); en iPhone la barra de la hora es negra y no tinta (otro color obliga a dibujar la página debajo de la hora); el ícono de la pestaña sigue siendo la barra de tres colores; el mismo dibujo sirve de ícono "maskable".
- **Ojo:** probada por vos en un Android real el 2026-11-07 (se instaló desde la Bienvenida y se pudo iniciar sesión). Sin probar: los pasos de iPhone, la sesión al cerrar y volver a abrir, y la sesión en iPhone (en iPhone se espera que pida iniciar sesión una vez; los enlaces de los correos se abren en el navegador).

### 117. Las reglas de peso y altura se usan desde la PC con − y + y con las flechas
- **Fecha:** 2026-11-09
- **Decisión:** en la PC el mouse no arrastra la regla y el peso va de a 0,1 kg. Se eligió **mantener apretado − o +**: un clic mueve un paso y, si se sigue apretando, el valor avanza cada vez más rápido. **"Cargar peso"** (Progreso › Cuerpo), que no tenía botones y en la PC no se podía cambiar, **lleva − y +** en el peso y la grasa. Y las **flechas del teclado** mueven la regla (en la horizontal → y ↑ suben; en la vertical, ↑ sube); en el perfil la regla toma el foco sola al abrir el paso.
- **Por qué:** *(completar)*
- **Descartaste:** arrastrar la regla con el mouse, moverla con la ruedita y escribir el número a mano.
- **Decidió la IA sin preguntarte:** los tiempos de la aceleración (0,4 s y después cada 120, 60 y 30 ms, siempre de a un paso), qué flecha sube en cada regla, que en "Cargar peso" la regla no tome el foco sola (tiene dos) y que la regla se anuncie como un control deslizante.
- **Ojo:** probado en el navegador de la PC y en el ancho de un celular; no en un teléfono real.

### 118. El panel ⓘ separa "Cómo hacerlo" y "Por qué" en tarjetas
- **Fecha:** 2026-11-09
- **Decisión:** en el panel del ícono ⓘ de un ejercicio, "Cómo hacerlo" y "Por qué está en tu rutina" van cada uno en su **propia tarjeta blanca**, con el título en Barlow Condensed y en tinta (opción A de la maqueta). Antes eran un subtítulo chico y gris y se leían como un solo texto.
- **Por qué:** *(completar)*
- **Descartaste:** B (títulos más grandes y una línea divisoria) y C (tarjetas con un aro azul y uno amarillo).
- **Decidió la IA sin preguntarte:** el espacio entre tarjetas y el tamaño de los títulos.
- **Ojo:** lo revisaste vos en la app (2026-11-09).

### 119. Inicio festeja el día completado hoy
- **Fecha:** 2026-11-09
- **Decisión:** si hoy se tocó "Día completado", la tarjeta de Inicio muestra arriba el festejo del modo entrenar (confeti, "Día N completado", el nombre del día y "Ver cómo te fue", que abre Resúmenes › Día) y **debajo, más chico, el día que sigue** con "Próximo", los discos y Empezar. Al día siguiente vuelve a la tarjeta de siempre. `GET /weeks/{id}` trae `finished_at` en cada día para saberlo.
- **Por qué:** *(completar)*
- **Descartaste:** mostrarlo solo una vez al volver a Inicio, mostrarlo solo al completar la semana y esconder el día siguiente mientras se festeja.
- **Decidió la IA sin preguntarte:** "hoy" es la fecha del teléfono; con dos días completados el mismo día se festeja el último; "Ver cómo te fue" es un enlace azul (no un botón) para que Empezar siga siendo el principal; la etiqueta "Próximo"; con la semana entera hecha, el festejo va arriba de "Falta cerrar la semana".
- **Ojo:** visto en el navegador en ancho de celular con un usuario descartable (ya borrado); no en un teléfono real, ni el caso de la semana entera hecha.

### 120. En el modo entrenar, las series se editan en una tabla desplegable, sin lápiz
- **Fecha:** 2026-11-09
- **Decisión:** en el modo entrenar, la tarjeta de la serie queda como antes (el número grande y los discos) pero **sin el lápiz**. Debajo de los discos, en la misma tarjeta, la línea **"Series · kilos y reps"** despliega una tabla con una fila por serie (Serie, Kilos, Reps; en cardio, Minutos; en isométricos, Segundos). Cada casilla **se escribe o se mueve con flechitas ▲ ▼**. La tabla **arranca plegada** en cada ejercicio. Cambiar una serie **no cambia las que faltan** (siguen con lo planificado). Lo cambiado se ve en azul con "tocaba …" y el número grande de arriba se actualiza. `components/TablaSeries.tsx`.
- **Por qué:** *(completar)* (el problema que señalaste: corregir una serie llevaba muchos toques).
- **Descartaste:** − y + grandes en dos filas (A) o lado a lado (B), casillas siempre a la vista sin tabla (C), la tabla sola sin el número grande, y la tabla en un panel que sube desde abajo.
- **Decidió la IA sin preguntarte:** lo cambiado en una serie sin hacer se guarda **al tocar "Serie hecha"** (guardar una serie la cuenta como hecha); una serie ya hecha se guarda al cambiarla; las flechas mueven los kilos de a 2,5 (igual en todo equipo), las reps y los minutos de a 1 y los segundos de a 5; los kilos se pueden dejar vacíos; la pantalla del día (fuera del modo entrenar) sigue con el lápiz.
- **Ojo:** probado en el navegador en ancho de celular con un usuario descartable (ya borrado): bajar una rep y "Serie hecha" guardó 9 × 50, subir los kilos de una serie hecha se guardó al instante, y la plancha muestra Segundos. No se probó en un teléfono real ni con el cardio.

### 121. El día se puede detener, retomar y reiniciar desde el modo entrenar
- **Fecha:** 2026-11-09
- **Decisión:** junto al reloj del modo entrenar van **⏸ Detener** (o **▶ Retomar**) y **↺ Reiniciar**. **Detener** frena el reloj (lo detenido no cuenta en la duración del día) **y** el día deja de estar "en curso": la barra no vuelve ahí y no se registran series hasta retomarlo (la serie se ve apagada y el botón grande pasa a "Retomar"). **Reiniciar** deja el día **como si nunca se hubiera empezado**, con confirmación: borra lo registrado (series y ejercicios marcados), el reloj vuelve a cero y queda apagado, el día deja de estar en curso (desaparece la píldora) y se sale a Entrenar, donde vuelve a estar "Empezar". La píldora "entrenando ahora" suma **⏸** y, con el día detenido, **queda en gris con "En pausa" y "Retomar"**. No es la "pausa de la rutina" descartada en la decisión 70: es solo el día que se está entrenando. Migración 0030 (`workout_sessions.paused_at` y `paused_seconds`) y `POST .../pause`, `.../resume` y `.../restart`.
- **Por qué:** *(completar)*
- **Descartaste:** que Detener frene solo el reloj o solo el día, que Reiniciar vuelva solo el reloj a cero o que lo deje en marcha (fue la primera versión, corregida el mismo día), los botones en la pantalla Entrenar, y que la píldora desaparezca con el día detenido.
- **Decidió la IA sin preguntarte:** al reiniciar se sale a la pantalla Entrenar (quedarse en el modo entrenar lo volvería a empezar) y es solo el día, no la semana; "Día completado" con el día detenido lo retoma y lo cierra; reabrir un día borra la pausa; el servidor responde 409 si se registra con el día detenido; los íconos son chicos y redondos junto al reloj, con la etiqueta amarilla "En pausa".
- **Ojo:** probado en el navegador en ancho de celular con un usuario descartable (ya borrado): detener, la píldora en gris, Entrenar con el día detenido (va a /entrenar), retomar desde la píldora y reiniciar con confirmación (deja el día sin empezar, sin píldora, y sale a Entrenar con "Empezar"). En el celular, la línea de arriba ("Día 1 · ejercicio 1 de 2") se parte en dos por los botones nuevos. No se probó en un teléfono real.

### 122. La entrada en calor y el cardio se hacen con un cronómetro y "Finalizar"
- **Fecha:** 2026-11-09
- **Decisión:** en el modo entrenar, la entrada en calor y el cardio muestran el tiempo planificado en grande con **▶ Empezar** y un **Saltar** chico. Empezar arranca un **cronómetro que sube desde 0:00** (en rojo, con "Planificado: …" debajo) y no se corta al pasar lo planificado; **✓ Finalizar** (verde) guarda los **minutos reales** y pasa al siguiente ejercicio. Hecho, se ve "✓ Hecha" (o "Hecho") con los minutos en grande; en el cardio, en azul con "tocaba X min" si no son los planificados, y los minutos van como lo realizado de la serie (la IA los ve al armar la semana siguiente). En la lista del día, la entrada en calor dice "corriendo · mm:ss" o "hecha · N min" con su disco. Saltar no la marca como hecha (el cardio queda sin registrar). Reemplaza el "Listo, empezar" de la decisión 56. **La entrada en calor también se da por hecha, como antes, si el día ya tiene algo registrado** (así los días viejos se siguen viendo hechos): en ese caso se ve "✓ Hecha" sin minutos. Migración 0031 (`workout_sessions.warmup_minutes`) y `PUT .../warmup`.
- **Por qué:** *(completar)*
- **Descartaste:** una cuenta regresiva desde el tiempo planificado, guardar solo "hecho" sin los minutos, que el cronómetro sea obligatorio (sin Saltar) y que los días viejos muestren la entrada en calor sin hacer.
- **Decidió la IA sin preguntarte (en la maqueta, y lo aprobaste):** el cronómetro sigue corriendo si se sale de la pantalla (se guarda en el navegador la hora en que se empezó) y se frena con el día detenido; los minutos se redondean (mínimo 1, máximo 180); reiniciar el día borra la entrada en calor y los cronómetros. **Sin preguntar:** con varias series de cardio, cada serie tiene su propio cronómetro.
- **Ojo:** como se mantiene la regla de antes, si se saltea la entrada en calor y después se registra una serie, también aparece como hecha (sin minutos): no hay forma de distinguirlo de un día viejo. Probado en el navegador en ancho de celular con un usuario descartable (ya borrado): entrada en calor corriendo, en la lista del día, finalizada (guardó 9 min y pasó al primer ejercicio); cardio con el día detenido (se frenó en 32:13 y siguió al retomar) y finalizado (guardó 32 min, en azul con "tocaba 30 min"). No se probó en un teléfono real ni Saltar.

### 123. Reabrir un día lo deja sin hacer
- **Fecha:** 2026-11-10
- **Decisión:** **Reabrir día** (en la lista de un día completado) ya no es para corregir: deja el día **como si nunca se hubiera empezado**, igual que Reiniciar (decisión 121). Borra las series, los ejercicios marcados y la entrada en calor, el reloj vuelve a cero y apagado, y al volver a entrenar todo aparece sin hacer. Pide confirmación (botón rojo, "No se puede deshacer"). Reabrir un ejercicio (decisión 33) no cambia: sigue destrabándolo sin borrar nada.
- **Por qué:** *(completar)*
- **Descartaste:** que Reabrir siga conservando lo hecho (como era), y dos opciones al reabrir ("Corregir" y "Empezar de nuevo").
- **Decidió la IA sin preguntarte:** el texto de la confirmación; al reabrir, la pantalla vuelve a leer el día y se olvidan la posición guardada del modo entrenar y los cronómetros de ese día; también se borran las marcas viejas de carga y dolor de los ejercicios (decisión 74).
- **Ojo:** ya no hay forma de corregir un número de un día completado: hay que reabrirlo y volver a registrarlo entero. Probado en el navegador en ancho de celular con un usuario descartable (ya borrado): un Día 2 completado con todo hecho quedó, al reabrirlo, sin series ni ejercicios marcados, sin reloj y sin estar en curso. No se probó en un teléfono real.

### 124. Con un día empezado, "Te toca" dice "Seguir entrenando" y la píldora se ve en Entrenar
- **Fecha:** 2026-11-10
- **Decisión:** con un día empezado y sin completar, la tarjeta **"Te toca"** de Entrenar muestra **ese día** con el botón **"Seguir entrenando"** (y **"Retomar"** si está detenido, que retoma el reloj y abre el modo entrenar); sin día empezado sigue diciendo "Empezar". La **píldora "entrenando ahora"** ya no se oculta en toda la sección Entrenar: se ve en la pantalla Entrenar y en la lista del día, y solo se oculta **dentro del modo entrenar**. El botón Entrenar de la barra, estando en el modo entrenar, sigue llevando a la pantalla Entrenar.
- **Por qué:** *(completar)*
- **Descartaste:** que el botón Entrenar no haga nada dentro del modo entrenar, el texto "Continuar" y dejar la píldora oculta en Entrenar (con la tarjeta alcanzaba).
- **Decidió la IA sin preguntarte:** lo mismo en la tarjeta "Hoy te toca" de **Inicio** (también dice "Seguir entrenando" o "Retomar"), y que la píldora se vuelva a pedir en cada pantalla a la que se navega (antes solo al aparecer).
- **Ojo:** si se detiene el día desde la píldora estando en Entrenar, la tarjeta sigue diciendo "Seguir entrenando" hasta cambiar de pantalla (no se entera sola). Probado en el navegador en ancho de celular con un usuario descartable (ya borrado): desde el modo entrenar, Entrenar muestra "Seguir entrenando" y la píldora; con el día detenido, Inicio muestra "Retomar", y tocarlo retoma el reloj y abre el día; dentro del modo entrenar la píldora no aparece. No se probó en un teléfono real.

### 125. Cardio de 20 a 30 minutos por sesión
- **Fecha:** 2026-11-10
- **Decisión:** en **perder grasa**, **cada día de entrenamiento lleva de 20 a 30 minutos de cardio**, sumando todas las máquinas de ese día (por ejemplo, 15 de bici y 15 de elíptica); nunca más de 30 en un día. Los **150 a 300 minutos por semana** de R17 quedan como **referencia de la semana**: con pocos días se queda por debajo (con 2 días, de 40 a 60) y vale igual, porque gana la regla de cada sesión. La app planifica **solo lo que se hace en el gimnasio**: no le recomienda actividad de afuera. El código lo comprueba como **error** (pide la rutina de nuevo una vez). En **mantenerme activo** (R25) rige el mismo rango por día, pero solo como aviso. Cambia R17 y deja sin efecto R23.
- **Por qué:** *(completar)* (lo que señalaste: casi nadie hace más de media hora de máquina seguida, y en los gimnasios grandes los turnos de las máquinas de cardio son de 20 minutos; la rutina de un amigo traía 50 a 55 minutos de cardio por día).
- **Descartaste:** sugerir actividad fuera del gimnasio para completar los 150 minutos (opción A, primera versión), minutos más intensos con la equivalencia vigorosa de la OMS (opción B), y que el código siguiera exigiendo 150 por semana en el gimnasio.
- **Decidió la IA sin preguntarte (le dijiste "lo que te parezca mejor"):** que pasarse sea un error en perder grasa y solo un aviso en mantenerme activo (como el resto de R25), el texto del prompt y que el mínimo de 20 también valga para un día que sea solo de cardio.
- **Ojo:** los 20 a 30 por día no tienen fuente: es diseño tuyo. Con la OMS se verificó que los 150 a 300 cuentan toda la actividad de la semana, no solo el gimnasio. **El prompt nuevo no se probó con Gemini real.** Las rutinas ya aceptadas no cambian.

### 126. Seis ejercicios por día, de 3 a 4 series y de 3 a 6 días
- **Fecha:** 2026-11-10
- **Decisión:** (1) **Días:** de **3 a 6 por semana para todos los niveles** (antes, principiante 2 o 3 y el resto de 2 a 6); el principiante sigue solo con cuerpo completo y torso/pierna queda con 4, 5 o 6 días. Las rutinas viejas de 2 días quedan como están (la base no cambia), pero al continuarlas hay que elegir de 3 a 6. (2) En **masa y fuerza**: cada día de fuerza lleva **6 ejercicios o más**, sin contar **abdominales ni cardio** (bíceps, tríceps y gemelos sí cuentan), y cada ejercicio de fuerza lleva **de 3 a 4 series** (primero se aprobó de 3 a 6; el usuario lo bajó el mismo día: "una de fuerza en general no va a tener 5 o 6 series ni una de masa"). Reemplaza a la **decisión 59** en masa y fuerza; perder grasa y mantenerme activo siguen como estaban. (3) Como guía para la IA: **2 a 5 ejercicios por grupo grande por semana** y **12 a 20 series semanales** por grupo grande, con 10 de mínimo y **sin máximo** (pasar de 20 está permitido). (4) **Abdominales** en todos los objetivos: al menos 2 días por semana, 1 ejercicio de 3 series, aparte de los 6 y fuera del tope de complemento. (5) El tope de series de un grupo en un día pasa de **9 a 12**. Cambia R3, R4, R11 y R12.
- **Por qué:** *(completar)* (lo que señalaste: tu rutina PPL traía 4 ejercicios de 3 series por día, cuando lo típico en el gimnasio son 6, y no tenía abdominales; la tabla de volumen por músculo de Eneko Baz que viste en un video de Ismael Galancho, y la idea de mínimo volumen efectivo y máximo volumen recuperable).
- **Descartaste:** dejar las series en 2 a 3 como decían las fuentes (decisión 59), un número fijo de ejercicios por músculo (es una guía, no una regla) y mantener el máximo de 20 series semanales.
- **Decidió la IA (propuestas que aprobaste con "tus propuestas están ok"):** aplicar los 6 ejercicios y las series por ejercicio solo a masa y fuerza; los abdominales al menos 2 días con 1 ejercicio de 3 series; el principiante solo con cuerpo completo; que las reglas nuevas se comprueben como el reparto (se pide de nuevo una vez y después se avisa, sin rechazar); no tocar el chequeo de la base de datos (hay una rutina vieja de 2 días en desarrollo); que los abdominales solo vayan en el prompt, sin control del código; y mostrar en el asistente solo los botones de 3 a 6, en dos columnas.
- **Ojo:** las 3 a 4 series, los 6 ejercicios, los 12 a 20 y el tope de 12 **no tienen fuente**: es diseño tuyo. La tabla de Eneko Baz **no se verificó** (no se sabe si cuenta series directas o totales) y no se usó como regla. Un día de 6 ejercicios de 3 a 4 series dura unos 50 a 70 minutos (R34 solo avisa). **El prompt nuevo no se probó con Gemini real.** Las rutinas ya aceptadas no cambian.

### 127. La región del backend de Vercel (Frankfurt) queda escrita en `vercel.json`
- **Fecha:** 2026-11-11
- **Decisión:** `"regions": ["fra1"]` en `vercel.json`: las funciones de Vercel (el backend) corren en **Frankfurt**, la misma región que la base de Neon.
- **Por qué:** *(completar)* (lo que viste: cambiar de ejercicio en Evolución por ejercicio tardaba mucho en la web).
- **Descartaste:** llevar la base a EE. UU. (había que crear otro proyecto de Neon y copiar los datos).
- **Decidió la IA sin preguntarte:** ponerlo en `vercel.json` y no en el panel de Vercel, para que quede en el repo y se deshaga borrando una línea.
- **Ojo, error de la IA:** se aprobó creyendo que el backend corría en Washington (`iad1`, la región por defecto de Vercel) porque `vercel.json` no la nombraba. Después del push se comprobó que **ya estaba en Frankfurt**: el despliegue anterior tenía `regions: ["fra1"]`, configurado en el panel del proyecto. La línea no cambia la región: solo la deja escrita en el repo. Sin costo (verificado el 2026-11-11 en la documentación de Vercel: Hobby es gratis y admite una región cualquiera). La mejora real de esa pantalla es la del mismo día: el historial de un ejercicio pasó de unas 85 consultas a 5 y la lista de ejercicios de 146 a 1 (mismos resultados, comparados con los datos de desarrollo), y el buscador se abre en cada toque.

### 128. Inicio festeja solo el día completado y, con la semana entera hecha, "Semana completada"
- **Fecha:** 2026-11-11
- **Decisión:** cambia la 119. (1) El día que se completa un día y quedan otros, la tarjeta de Inicio es **solo el festejo** (confeti, "Día N completado", el nombre del día y "Ver cómo te fue"): ya no muestra debajo los discos ni el día siguiente con Empezar; vuelve al día siguiente. (2) Con **todos los días de la semana hechos**, Inicio muestra el **confeti, "Semana completada" y el botón Cerrar semana** (en lugar de "Completaste los N días"); el "Día N completado" del último día se ve solo en el modo entrenar.
- **Por qué:** *(completar)*
- **Descartaste:** dejar el festejo del último día con "Cerrar semana" debajo, y que Inicio mostrara solo el festejo sin los accesos de Tus rutinas y Tu progreso.
- **Decidió la IA sin preguntarte:** "Semana completada" se ve mientras la semana esté entera hecha y sin cerrar, no solo el día en que se terminó; se sacaron de esa tarjeta la etiqueta "Falta cerrar la semana", la frase "Cerrala para que la IA…" y los discos; el borde de la tarjeta queda oscuro (antes, amarillo con la semana hecha).
- **Ojo:** visto en el navegador en ancho de celular con un usuario descartable (ya borrado); no en un teléfono real.

### 129. Los errores de "Generar rutina" se explican en una pantalla por motivo
- **Fecha:** 2026-11-11
- **Decisión:** cuando la generación falla, en lugar del renglón rojo al pie del asistente, la pantalla completa de carga se convierte en una pantalla que dice qué pasó y qué se puede hacer, con un mensaje distinto según el motivo (aprobada la maqueta de cinco pantallas): la IA no respondió o está saturada, tope por minuto (con cuenta regresiva), tope del día (con la hora en que vuelve), la rutina no pasó las reglas (con el detalle técnico plegado) y sin conexión. Lo elegido no se pierde, y al volver otro día el asistente lo tiene listo. "Probar de nuevo" lo toca siempre la persona, sin reintentos automáticos.
- **Por qué:** *(completar)* (el pedido del profesor: resolver los errores de una forma más cómoda para el usuario, que no sea una mala experiencia).
- **Decidió la IA sin preguntarte:** el servidor manda el motivo en el encabezado `X-Error-Code` (los mensajes de la API no cambiaron); "saturada" y "no respondió" comparten pantalla; la cuenta del tope por minuto es siempre de 60 s; el borrador en el navegador dura 2 días, es por usuario, se guarda ante cualquiera de estos errores y se borra al generar bien o al cancelar; "Cambiar la estructura" vuelve al paso de la estructura; los títulos, los textos y el color del disco de cada pantalla.
- **Ojo:** probado en el navegador con respuestas simuladas (sin gastar cuota) y en ancho de celular; no en un teléfono real ni con una falla real de Gemini.

### 130. Se puede hacer más de un día en la misma fecha, y Inicio lo ofrece con "Volver a entrenar"
- **Fecha:** 2026-11-11
- **Decisión:** cambia la parte (1) de la 128. Se permite hacer más de un día de la rutina en la misma fecha (el servidor ya lo dejaba y Entrenar ya lo mostraba). El día que se completa un día y quedan otros, la tarjeta de Inicio muestra el confeti, "Día N completado", el nombre del día y el botón oscuro **"Volver a entrenar"**, que abre el modo entrenar del día siguiente. **"Ver cómo te fue" sale de Inicio**: ya está en el final del modo entrenar y en Resumen del día.
- **Por qué:** *(completar)*
- **Descartaste:** uno solo por fecha (bloquear empezar otro día hasta mañana); permitirlo solo desde Entrenar sin ofrecerlo en Inicio; dejar "Ver cómo te fue" como link debajo de "Volver a entrenar".
- **Decidió la IA sin preguntarte:** si después de "Volver a entrenar" hay un día empezado, Inicio deja de festejar y muestra ese día con "Seguir entrenando" (o "Retomar"), como cualquier día en curso; el botón empieza el día siguiente sin pasar por Entrenar.
- **Ojo:** visto en el navegador en ancho de celular con un usuario descartable (ya borrado); no en un teléfono real.

### 131. El peso sale del recuadro de "Cerrar semana"
- **Fecha:** 2026-11-12
- **Decisión:** cambia una parte de la 87. El recuadro de "Cerrar semana" ya no tiene el desplegable "Tu peso": queda solo el comentario opcional ("¿Cómo te sentiste?"). El peso y la grasa corporal se cargan únicamente con **"Cargar peso"**, desde Inicio o desde Progreso › Cuerpo (la regla con − y +).
- **Por qué:** *(completar)* (el recuadro del cierre tenía otro formato que "Cargar peso": dos casillas para escribir en lugar de la regla).
- **Descartaste:** dejar el peso en el cierre con el mismo formato que "Cargar peso" (la regla, arrancando en el último peso y sin elegir la fecha).
- **Decidió la IA sin preguntarte:** el servidor no cambió: `POST /weeks/{id}/close` sigue aceptando `weight_kg` y `body_fat_pct` (la pantalla ya no los manda); el comentario sigue dentro de su desplegable, aunque ahora sea el único.
- **Ojo:** comprobado con los tipos de TypeScript y el lint; no visto en el navegador.

### 132. En PPL, el día de tirón acepta los hombros de tirón
- **Fecha:** 2026-11-12
- **Decisión:** cambia una parte de la 91. En empuje/tirón/piernas, los hombros van los dos días: en empuje, el deltoides anterior y lateral (press, elevaciones), como hasta ahora; en tirón, el **deltoides posterior**, con los ejercicios de hombros marcados como tirón en el catálogo (`direction: pull`: Face pull en polea, Pájaros con mancuernas y Pájaros en máquina). En tirón son **permitidos, no obligatorios**: el día sigue exigiendo espalda. Un press o una elevación de hombros en el día de tirón sigue dando el aviso.
- **Por qué:** *(completar)* (lo viste en producción: la semana nueva de una rutina PPL avisaba "estos grupos grandes no corresponden a este foco: Hombros" en los días 2 y 5, de tirón).
- **Descartaste:** aceptar cualquier ejercicio de hombros en el tirón (también un press).
- **Decidió la IA sin preguntarte:** la regla mira la etiqueta `direction` del ejercicio, no su nombre; la excepción es solo del tirón de PPL (en torso/pierna, un face pull en el día de pierna sigue siendo aviso); el prompt de PPL ahora le dice a la IA que en tirón puede sumar el deltoides posterior, nunca un press ni una elevación; el texto de la opción en el asistente ("tirón: espalda") no cambió.
- **Ojo:** probado con tests (los del backend son 671); no con Gemini real.

### 133. Un solo festejo al terminar la semana
- **Fecha:** 2026-11-12
- **Decisión:** cambia una parte de la 128. Al tocar "Día completado" en el último día que faltaba, el modo entrenar muestra directamente el festejo de la semana: confeti, "Semana N completada", "Día N · nombre · minutos", los discos, el botón oscuro **Cerrar semana** (el recuadro de siempre; al cerrarla se va a Inicio), "Ver cómo te fue" con borde e "Ir a Inicio" como texto chico. Los demás días siguen con "Día N completado". La tarjeta "Semana completada" de Inicio queda para cuando se entra sin haber cerrado la semana.
- **Por qué:** *(completar)* (antes se veían dos festejos seguidos: "Día N completado" en el modo entrenar y "Semana completada" en Inicio).
- **Descartaste:** la misma pantalla sin "Ir a Inicio".
- **Decidió la IA sin preguntarte:** la semana se da por completa si todos sus días tienen "Día completado" y la semana está activa; mientras llega la semana no se muestra ningún título (para que no cambie de uno a otro), y si no llega queda el festejo del día; el botón "Cerrar semana" de esta pantalla es del tamaño de los demás (`grande` en `CerrarSemana.tsx`).
- **Ojo:** comprobado con los tipos y el lint; no visto en el navegador (el de pruebas no dibuja las páginas con parámetros).

### 134. La propuesta ya no muestra la sección de avisos
- **Fecha:** 2026-11-12
- **Decisión:** la persona no ve la pestaña **Avisos** de la propuesta. Quedan "Semana" y, en una semana nueva, "Cambios" (en una rutina nueva no hay pestañas). El **resumen de la IA** y sus **notas** pasan arriba de los días, en la pestaña Semana. Los avisos del código (split, reparto, volumen, duración de un día y subidas de peso de más de 10 %) se siguen calculando, se siguen usando para pedir la rutina de nuevo una vez y se guardan en la propuesta (`warnings`), pero no se muestran.
- **Por qué:** *(completar)* (los pensaste como algo de desarrollo y dudabas de que debieran verse en producción).
- **Descartaste:** dejar la pestaña solo con los avisos útiles (resumen, notas, duración y subidas de peso); plegar los técnicos en "Ver detalle técnico".
- **Decidió la IA sin preguntarte:** el resumen y las notas van arriba de la semana, con el mismo recuadro (amarillo el resumen); la duración de cada día ya se veía en el día ("~75 min"), así que no se agregó nada por ella; las subidas de peso de más de 10 % no se muestran en ningún lado (la pestaña Cambios ya muestra cada carga con su "antes"); el backend no cambió.
- **Ojo:** comprobado con los tipos y el lint; no visto en el navegador (el de pruebas no dibuja las páginas con parámetros).

### 135. El cronómetro de la entrada en calor y el cardio es un anillo
- **Fecha:** 2026-11-12
- **Decisión:** cambia el aspecto de la 122. En el modo entrenar, el cronómetro va dentro de un aro, como los discos: sin empezar, el aro gris con lo planificado en el centro; corriendo, se llena en rojo hacia los minutos planificados ("de 25 min" debajo); al llegar, queda entero en verde y el tiempo sigue contando ("25 min · +2 min"); con el día detenido, todo en gris y "detenido". "Empezar", "Saltar" y "Finalizar" no cambiaron.
- **Por qué:** *(completar)*
- **Descartaste:** una cuenta regresiva desde lo planificado y el anillo que se vacía mientras baja el tiempo (como el reloj de descanso).
- **Decidió la IA sin preguntarte:** con un rango ("5 a 10 min") el aro apunta al número más alto; sin número, no se llena y solo cuenta; el "+N min" cuenta minutos enteros; pasada la hora, el tiempo se achica para entrar; con el día detenido ya no se aclara la tarjeta entera (lo marca el gris).
- **Ojo:** comprobado con los tipos y el lint; no visto en el navegador.

### 136. Cerrar el día con los discos del día
- **Fecha:** 2026-11-12
- **Decisión:** al terminar los ejercicios en el modo entrenar, antes de "Día completado", la tarjeta muestra "¡Listo el Día N!", el nombre del día con los minutos de la sesión, un disco por paso (C, en amarillo, la entrada en calor; los ejercicios hechos en verde y los que quedaron sin hacer, punteados) y "Entrada en calor y 4 ejercicios hechos". El botón "Día completado" sigue siendo lo que cierra el día (diseño 1 de la maqueta).
- **Por qué:** *(completar)*
- **Descartaste:** un resumen con números (minutos, series, kilos y cardio) y un tilde grande; que el día se cierre solo al terminar el último ejercicio.
- **Decidió la IA sin preguntarte:** los ejercicios hechos en verde (el rojo es de las series); los minutos se calculan una vez, al aparecer la tarjeta, sin lo detenido; si quedó uno sin hacer dice "3 de 4 ejercicios hechos".
- **Ojo:** comprobado con los tipos y el lint; no visto en el navegador.

### 137. El tilde de los ejercicios hechos también en lectura
- **Fecha:** 2026-11-12
- **Decisión:** en la pantalla del día, cada ejercicio hecho lleva el disco con el tilde también con el día completado o visto desde Rutinas (antes solo se veía mientras el día se podía registrar, y en lectura solo la entrada en calor lo tenía).
- **Por qué:** *(completar)*
- **Ojo:** comprobado con los tipos y el lint; no visto en el navegador.

### 138. Aviso legal visible, para España, con consentimiento de salud aparte
- **Fecha:** 2026-11-12
- **Decisión:** el aviso legal (#34) sale de la espera y se muestra, pensado para **España** (RGPD, LOPDGDD, LSSI, consumo y Reglamento de IA), con el texto del informe `reports/Aviso legal de Spotter en España.md`. Lo eligió el usuario:
  - **Responsable:** nombre y correo de contacto (el Gmail de Spotter), sin domicilio ni NIF.
  - **Edad mínima: 18 años** (lo piden los proveedores de IA; en España se consiente desde los 14). El paso de la fecha de nacimiento y el servidor no dejan seguir a los menores.
  - **"Recordarme" viene sin tildar** (reemplaza a la decisión 98): la cookie de 30 días la tiene que elegir la persona (WP194, Planet49).
  - **Consentimiento de salud en una casilla aparte, sin marcar y obligatoria** para crear el perfil, con la fecha y la versión guardadas (migración 0032: `profiles.legal_notice_version`, `health_consent_at` y `health_consent_version`; la versión vigente está en `backend/app/legal.py` y `frontend/src/lib/legal.ts`).
  - **Retirarlo** (Perfil › Cuenta › Datos de salud) **apaga "Generar rutina"** (`POST /proposals/generate` responde 403 con `X-Error-Code: sin_consentimiento`, sin llamar a la IA); los datos quedan guardados y se puede volver a dar.
  - **Las cuentas que ya existían** ven una pantalla para aceptar (`AceptarAviso.tsx`) hasta aceptar la versión vigente; desde ahí también pueden borrar la cuenta.
  - **Las limitaciones siguen opcionales** y una copia de los datos (portabilidad) se pide por correo.
  - **Sin aviso de IA** en el último paso de "Generar rutina" ni arriba de la propuesta (el usuario lo prefirió así).
  - Lugares: enlace "Aviso legal · Privacidad · Cookies" al pie de Bienvenida, Login y Registro; la primera capa de información en Registro; las dos casillas en el último paso del perfil; el grupo "Legal y privacidad" en Perfil › Cuenta; y la página pública `/aviso-legal` ("En resumen", el aviso de dolor siempre a la vista y 17 secciones plegables).
- **Por qué:** *(completar)*
- **Ojo:** es un borrador de producto, no asesoramiento legal: falta que lo revise un abogado. El nombre y el correo del responsable (Bruno Muzzio, spotter.gym.app.ia@gmail.com) se completaron el mismo día en `frontend/src/lib/legal.ts`. Retirar el consentimiento y dejar los datos guardados puede no alcanzar para el RGPD (retirar el permiso también obliga a dejar de guardarlos): anotado para el abogado. **Las condiciones de la API de Gemini (vigentes desde el 2026-03-23) prohíben el plan gratuito en apps abiertas a usuarios del EEE**: hasta cambiar de IA, la sección de la IA nombra a Gemini y Spotter no cumple esa cláusula (informe `reports/IA gratis para usuarios de la UE.md`). Probado con un usuario descartable en el navegador (pantalla para aceptar, filas de Cuenta, retirar y el 403 al generar); el asistente del perfil nuevo con las dos casillas solo se comprobó con los tipos.

## Decisiones abiertas

Ninguna sin decidir por ahora. Las cinco que quedaban (R5b, R20/R24/R25, R30, avisos y ejercicios repetidos) se cerraron el 2026-10-14 en las decisiones 60 a 64. El profesor dio el OK al RAG con pgvector de la tarea #52 (2026-10-26): solo preguntó qué se usaba y hay que saber decir que son los embeddings de Google. Cambiar un ejercicio ya aceptado en la semana activa no se hace: sería anular el plan, no generarlo.

Ya resueltas: **el plan no se edita a mano** (decisión 35); los **botones Cerrar semana y Generar** (cerrar en la semana activa con aviso de los días sin completar, generar en la portada); el **login** se hizo en la semana 3 (decisión 39); **reabrir un día completado** se puede (decisión 33 y "Reabrir día"); la confirmación al cerrar con días sin hacer queda definida en la tarea #47.

## Ideas futuras

Rachas, logros, entrada por voz y notificaciones. No son decisiones: están anotadas en [`backlog.md`](backlog.md).

## Falta revisar

- El código del modelo ([`backend/app/models.py`](../backend/app/models.py)) frente a estas decisiones.
- Datos sin verificar con la fuente oficial: los planes gratuitos de Gemini están verificados (CLAUDE.md); los de **Vercel Hobby** (300 s por función, uso no comercial, Services en Beta), **Neon Free** (1 GB, 100 horas de cómputo, pgvector incluido, sin tarjeta) y **Render** (se descartó) se verificaron el 2026-11-07. Siguen sin verificarse los costos de Google Play y la App Store, y las funciones extra de una PWA en iPhone.
