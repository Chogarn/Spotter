# Video demo de Spotter: guion (borrador)

**Para:** Demo Day. **Duración:** 3 a 5 minutos (apunta a unos 4). **Aparato:** celular real con la app instalada (PWA). **Narración:** voz en off del autor. **Datos:** una cuenta demo en producción (`spotter-vert.vercel.app`) preparada con semanas ya entrenadas.

> Borrador para corregir: el texto de la voz es una propuesta. Cambiá lo que no te suene como vos. A hablar tranquilo salen unas 120 a 130 palabras por minuto; cada escena dice cuánto dura.

## Escena 0 · Apertura (≈ 15 s)

**Pantalla:** el ícono de Spotter en el teléfono → se abre la Bienvenida con el logo.

**Voz:** "Este es Spotter, una app de entrenamiento con inteligencia artificial. La idea es simple: vos anotás lo que entrenás y, al cerrar la semana, la IA compara lo que tocaba con lo que hiciste de verdad y te propone la semana siguiente."

## Escena 1 · Armar la rutina con la IA (≈ 50 s)

**Pantalla:** Inicio → Nueva rutina → asistente: objetivo (Masa), nivel, días (4), estructura (torso/pierna) → pantalla de carga con los discos (**cortar la espera en la edición**) → la propuesta: pasar de día con las flechas, abrir el ⓘ de un ejercicio ("Cómo hacerlo" y "Por qué está en tu rutina"), tocar "Cambiar ejercicio" en uno, mirar la pestaña Avisos → Aceptar.

**Voz:** "Para empezar elijo el objetivo, mi nivel, cuántos días puedo entrenar y cómo quiero repartir el cuerpo. La IA arma la rutina, pero no inventa: elige solo de un catálogo de 127 ejercicios revisados, y el código comprueba reglas de entrenamiento con fuente, como el volumen mínimo por músculo. Cada ejercicio explica cómo se hace y por qué está. Si uno no me gusta, lo cambio por otro del catálogo. Nada se guarda hasta que yo acepto: la IA propone y yo decido."

## Escena 2 · Entrenar un día (≈ 60 s)

**Pantalla:** Inicio "Hoy te toca" → Empezar → entrada en calor con el cronómetro y Finalizar → una serie en grande → abrir "Series · kilos y reps" y cambiar los kilos de una serie → Serie hecha → el reloj de descanso (mostrar unos segundos y Saltar) → avanzar al último ejercicio → Día completado → el confeti y "Ver cómo te fue".

**Voz:** "En el gimnasio, la app me muestra un ejercicio a la vez. Toco 'Serie hecha' y queda registrado lo planificado; si levanté otro peso o hice menos repeticiones, lo cambio acá. El reloj de descanso arranca cuando yo quiero. Lo planificado y lo real se guardan por separado, y esa diferencia es lo que después analiza la IA."

## Escena 3 · Cerrar la semana y la semana nueva (≈ 50 s)

**Pantalla:** Entrenar → Cerrar semana → escribir el comentario (por ejemplo: "La sentadilla me costó, estuve cansado") y el peso → confirmar → "Generar la semana siguiente" → carga (cortar) → la propuesta con las etiquetas "↑ antes 40 kg" y la pestaña Cambios y el resumen de la IA → Aceptar.

**Voz:** "Al final de la semana la cierro con un botón y le cuento cómo me sentí. La IA lee ejercicio por ejercicio qué superé, qué cumplí y dónde no llegué. Si superé, sube el peso; si no llegué y conté que estaba cansado, baja un escalón, y ese peso lo calcula el código, no la IA. Antes de aceptar veo exactamente qué cambió respecto de la semana pasada."

## Escena 4 · Progreso (≈ 35 s)

**Pantalla:** Inicio → Progreso → Resúmenes (Semana) → Mapa muscular → Radar de músculos → Evolución de un ejercicio → Calendario → Cuerpo y peso.

**Voz:** "En Progreso veo el resumen de cada semana, qué músculos trabajé en el mapa del cuerpo, cómo evolucionó cada ejercicio, los días que entrené y mi peso."

## Escena 5 · Cierre técnico (≈ 25 s)

**Pantalla:** (a definir) una placa con el stack, o la app de fondo.

**Voz:** "Por dentro: el frontend es Next.js, el backend FastAPI con PostgreSQL, y la IA es Gemini en su plan gratuito, con topes que el código aplica antes de cada llamada para que nunca genere costo. Está publicada en Vercel y se puede instalar en el teléfono. Gracias."

## Orden de grabación (no es el orden del video)

Solo se puede continuar la rutina más reciente (decisión 102), así que conviene grabar así:

1. Con la cuenta demo ya preparada (una rutina con semanas cerradas y la última en curso, con el último día sin hacer): **escena 2** (entrenar ese día), **escena 3** (cerrar y generar la siguiente) y **escena 4** (Progreso, que ya tiene historia).
2. Al final, **escena 1** (Nueva rutina), porque crea una rutina nueva y la anterior pasa a "Terminada".
3. La apertura y el cierre, cuando quieras.

En la edición se ordenan 0, 1, 2, 3, 4 y 5.

## Antes de grabar

- Celular con modo "No molestar", batería cargada y la hora visible prolija.
- La generación tarda de 10 a 60 segundos y Google a veces responde "IA saturada": no pasa nada, se reintenta y se corta la espera en la edición. Cada intento es una llamada que cuenta para el tope de 400 por día (sobra).
- Grabar la voz aparte, después de editar la imagen, suele salir mejor que hablar mientras se toca.
