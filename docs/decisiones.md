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

### 19. La IA determina los días de la semana
La cantidad de días (entre 2 y 6) la determina la IA según los parámetros de la persona: objetivo, nivel y volumen necesario. El usuario no los elige, pero si prefiere **entrenar más días** puede pedirlo y la IA recalcula (nunca menos). No existe el pedido "solo puedo 3 días".
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

### 71. Cómo se sintió el entrenamiento y el dolor se cuentan en el comentario al cerrar la semana
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
- **Saltos mínimos** (ya en el prompt): barra 2,5 kg (discos de 1,25 por lado), mancuernas 2,5 kg, pesas rusas 4 kg; máquinas y poleas, el salto del peso anterior (sin dato). Fuentes: Wikipedia (discos), minoristas y Ruster Fitness (mancuernas y pesas rusas); no se verificaron marcas de máquinas ni gimnasios de Argentina.
- **Reglas que se apoyan en esto:** R10 (no subir si bajó la carga o las repeticiones del ejercicio, o si el comentario habla de cansancio o dolor), R31 (el dolor se lee del comentario, sin escala) y R36 (**aprobada el 2026-10-16**: si el ejercicio quedó en "no llegó" y el comentario muestra fatiga o cargas demasiado altas, bajar **un escalón** del equipo; sin ese comentario, mantener. Sin porcentaje, para no inventar una cifra).
- **Descartaste:** una marca opcional por ejercicio ("me dolió" o "me costó mucho"), por ahora; se retoma si la IA queda corta.
- **Hecho el 2026-10-16:** `signal()` y sus tests (`tests/test_signal.py`), el prompt y las reglas R10, R31 y R36 en `docs/criterios-entrenamiento.md`. Complementa la decisión 72.

### 74. Marca opcional de carga y dolor por ejercicio, al entrenar
Al terminar un ejercicio en el modo entrenar aparece una línea plegada "¿Cómo te fue? (opcional)" con dos filas **independientes**: la **carga** (Liviana, Bien, Pesada, Muy pesada) y el **dolor** (Leve, Moderado, Fuerte). No hay opción "No me dolió": sin marcar es sin dato. Se puede marcar solo una, las dos o ninguna, y volver a tocar una opción la desmarca. Con "Fuerte" se muestra el aviso de parar y consultar a un profesional. Se ve, solo de lectura, en el resumen semanal de Progreso. Reemplaza en parte a la decisión 37 (esfuerzo por serie, #48) y a la 71 (el dolor solo por el comentario): el comentario de cierre sigue valiendo.
- **Origen:** tuya (2026-10-16): "una casilla opcional de esfuerzo y otra de dolor, que se despliegue si el usuario quiere". La escala de carga la elegiste vos (opción B) entre tres propuestas.
- **Por qué:** *(completar)*
- **Descartaste:** el esfuerzo por serie de 1 a 10 (#48); la escala por repeticiones que sobran (opción A, apoyada en R29); una opción "No me dolió"; ponerla también en la lista del día.
- **Ojo:** guarda en `exercise_completions` (dos columnas nulas, migración 0019), así que solo se puede marcar con el ejercicio hecho; `set_entries.effort` sigue sin usarse. R10 y R31 vuelven a tener disparador, y R36 pasa a dispararse también con "Muy pesada" además del comentario. La carga y el dolor no marcados llegan a la IA como ausentes, nunca como "bien" ni "sin dolor".

## Decisiones abiertas

Ninguna sin decidir por ahora. Las cinco que quedaban (R5b, R20/R24/R25, R30, avisos y ejercicios repetidos) se cerraron el 2026-10-14 en las decisiones 60 a 64. Sigue pendiente, fuera de las decisiones de producto, consultar al profesor si el RAG con pgvector de la tarea #52 es lo que se espera.

Ya resueltas: **el plan no se edita a mano** (decisión 35); los **botones Cerrar semana y Generar** (cerrar en la semana activa con aviso de los días sin completar, generar en la portada); el **login** se hizo en la semana 3 (decisión 39); **reabrir un día completado** se puede (decisión 33 y "Reabrir día"); la confirmación al cerrar con días sin hacer queda definida en la tarea #47.

## Ideas futuras

Rachas, logros, entrada por voz y notificaciones. No son decisiones: están anotadas en [`backlog.md`](backlog.md).

## Falta revisar

- El código del modelo ([`backend/app/models.py`](../backend/app/models.py)) frente a estas decisiones.
- Datos sin verificar con la fuente oficial: planes gratuitos y límites de Gemini y de la plataforma de despliegue.
