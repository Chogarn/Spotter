# Backlog inicial de Spotter

Para copiar a GitHub Projects: un milestone por semana (S1 a S6) y un issue por cada línea.
Etiquetas sugeridas: `backend`, `frontend`, `ia`, `docker`, `docs`, `complementaria`.
Columnas del tablero: Todo, Esta semana, In Progress y Done. Cada issue tiene su definición completa (para qué sirve, cómo se accede, qué ve el usuario, acciones, datos y criterios de aceptación); acá va la lista y un resumen.

## S1: Planificación y setup
- [x] Definir idea y alcance del proyecto `docs`
- [x] Crear repo en GitHub con estructura base `docs`
- [x] Crear tablero de GitHub Projects con este backlog `docs`
- [x] Escribir el README (idea, stack, estructura) `docs`
- [x] Docker Compose de desarrollo (backend, frontend, PostgreSQL) `docker`
- [x] Docker Compose de producción `docker`
- [x] Esqueleto de FastAPI con endpoint de salud `backend`
- [x] Esqueleto de Next.js con TypeScript `frontend`
- [x] Configurar Alembic y primer modelo de datos `backend`
- [x] Diseñar el modelo de datos `backend` `docs`
- [x] Publicación LinkedIn 1: el problema y la idea `docs`

## S2: Core de funcionalidades
- [x] Tabla de ejercicios que se completa al guardar el plan `backend` (#12)
- [x] ~~Editar la semana a mano~~: **no se hace** (decisión del usuario, 2026-10-09). El plan y la propuesta no se editan; solo se edita lo realizado, y el plan lo cambia la IA (#29). Cerrada como "no se hace" `backend` `frontend` (#13)
- [x] Registro de sesiones (API): lo realizado por serie, series y ejercicios hechos, ejercicio cerrado y reabrir, Día completado y reabrir `backend` (#14). El esfuerzo pasó a su propia tarea (#48)
- [x] Vista de planes semanales: Mis rutinas, Semana y Día `frontend` (#15)
- [x] Formulario de registro de sesión: la vista del día con Editar, Marcar como hecha y Día completado `frontend` (#16)
- [x] ~~Estado global en el frontend~~: **no se hace por ahora**. Cada pantalla pide sus datos y ninguna necesita compartir estado; se reabre si aparece un caso concreto `frontend` (#17)
- [x] Perfil del usuario (edad, peso, altura, nivel, equipamiento, limitaciones y objetivo) `backend` `frontend` (#18)
- [x] Publicación LinkedIn 2: primer avance con capturas, publicada el 2026-10-12 `docs` (#19)

## S3: Autenticación
- [x] Registro de usuario `backend` (#20)
- [x] Login con JWT: cookie httpOnly de 7 días, `/auth/login`, `/auth/logout` y `/auth/me` `backend` (#21)
- [x] Proteger rutas del backend: `get_current_user` lee la cookie y da 401 `backend` (#22)
- [x] Pantallas de registro e inicio de sesión `frontend` (#23)
- [x] Rutas protegidas en el frontend: `proxy.ts`, `apiFetch` y Cerrar sesión `frontend` (#24)
- [x] Tests básicos con pytest (auth y rutinas): 23 de autenticación y 8 del script de reclamo `backend` (#25)

## S4: IA, complementos y mejoras
- [x] Prompt y respuesta en JSON validada con Pydantic, para la primera rutina `ia` `backend` (#26). El prompt de la semana siguiente va en #27
- [x] Cerrar semana: botón con aviso de los días sin completar, sin IA `backend` `frontend` (#47)
- [x] Generar semana nueva: al continuar una rutina, la IA lee lo planificado frente a lo real de la última semana cerrada y propone la siguiente, con un resumen (antes "Cierre semanal"). Probada con Gemini real `ia` (#27)
- [ ] Pantalla de resumen semanal `frontend` (#28)
- [ ] Ajuste conversando (regenera la semana y la guarda) `ia` (#29)
- [x] Topes de uso de Gemini (diario y por minuto) `ia` `backend` (#30)
- [x] Propuestas de la IA: ver la pendiente desde la portada (`GET /proposals/pending`) y vista previa con aceptar o descartar para "Generar rutina" `ia` `backend` `frontend` (#45). El antes y después pasó a #49
- [ ] Antes y después en las propuestas de ajuste y de semana nueva: qué cambia, con el valor anterior y el nuevo. Depende de #29 y #27 `ia` `backend` `frontend` (#49)
- [ ] Nota de cómo me sentí al terminar la sesión (botones y texto). **Pospuesta**: decisión 37 `backend` `frontend` (#46)
- [x] Comentario escrito del usuario al cerrar la semana (cómo se sintió), que la IA lee al armar la semana siguiente `backend` `ia` `frontend` (#50)
- [ ] Esfuerzo por serie (1 a 10) al editar lo realizado. **Pospuesto**: decisión 37 `backend` `frontend` (#48)
- [ ] Catálogo de ejercicios para la IA (RAG): la IA arma la semana solo con ejercicios de `backend/app/ai/exercises.json` (borrador de 84, ya subido). **Pendiente de una consulta al profesor** (si RAG implica vectores y qué se espera recuperar); no se construye antes `backend` `ia` (#52)
- [ ] Semáforo de dolor (R31): zona y gravedad de 0 a 10 en la nota del día. **Pospuesto**: decisión 37; depende de #46 `backend` `frontend` `ia` (#51)
- ~~Elegir camino A o B al empezar (#43) y formulario de rutina actual, camino B (#44)~~ **No se hacen**: se descartó el camino B (decisión 40); el nivel y el objetivo se eligen al generar
- [x] Refactor y mejoras de UX: shadcn/ui y Tailwind en versión básica (sin estilos propios todavía), con componentes compartidos para el error y el recuadro de confirmación. Decisión 38; probado en una copia temporal `frontend` (#31)
- [x] Diseño "Disco" (tema): colores de los discos, fuentes Barlow y Barlow Condensed, variables de shadcn en `globals.css` y modo oscuro. Decisión 41 `frontend` (#53)
- [x] Navegación y pantalla Entrenar: barra fija abajo (Entrenar, Rutinas y Perfil), portada "Entrenar" con el próximo día y el progreso en discos, "Cerrar semana" al final de Entrenar y "Cerrar sesión" en el Perfil. Decisiones 42 y 44. Depende de #53 `frontend` (#54)
- [ ] Rediseño del día, las rutinas y la propuesta: series como discos que se tocan para marcarlas, acciones chicas con íconos (lápiz, tilde, cruz, candado y tacho con confirmación) y el resumen de la IA en la propuesta. Decisiones 43 y 44. Depende de #53 `frontend` (#55)
- [ ] Publicación LinkedIn 3: cómo la IA arma tu semana `docs` (#32)

> **Para la Semana 4 (idea, sin definir):** pasar la lectura de datos a Server Components de Next (cookie del usuario reenviada al backend, invalidación por etiquetas tras cada acción) y que los componentes reciban los datos como propiedades. Reemplaza la tarea #17, cerrada como "no se hace por ahora".

## S5: Calidad y despliegue
- [ ] Explicación por ejercicio ("¿por qué esto?") `ia` `complementaria`
- [ ] Sustitución de ejercicios `ia` `complementaria`
- [ ] Aviso legal visible en la app `frontend`
- [ ] Más tests y revisión de errores `backend`
- [ ] Deploy en producción `docker`
- [ ] README completo (cómo levantar, capturas) `docs`
- [ ] Publicación LinkedIn 4: proyecto desplegado `docs`

## S6: Demo Day y cierre
- [ ] Video demo `docs`
- [ ] Publicación LinkedIn final con la demo `docs`
- [ ] Plan a 30 días `docs`

## Tareas definidas que siguen (resumen)

La definición completa de cada una está en su issue de GitHub.

| Tarea | Dónde se accede | Depende de |
|---|---|---|
| ~~Cerrar semana (#47)~~ | Hecho: botón en la pantalla de la semana activa, con aviso de los días sin completar | — |
| ~~Generar semana nueva (#27)~~ | Hecho: al continuar una rutina desde "Generar rutina", la IA lee lo real de la última semana cerrada. Probada con Gemini real | — |
| Nota de cómo me sentí (#46), pospuesta | Al tocar "Día completado" en la vista del día | Nada |
| Esfuerzo por serie (#48), pospuesto | Campo opcional al tocar "Editar" en una serie | Nada |
| Semáforo de dolor (#51), pospuesto | Zona y gravedad en la nota del día, al elegir "con dolor" | #46 |
| Catálogo de ejercicios / RAG (#52), pendiente de consulta | Cambia cómo se arma la propuesta al tocar "Generar rutina"; no es una pantalla | Respuesta del profesor y revisión del catálogo |
| Antes y después en las propuestas (#49) | En la vista previa de la propuesta (`/rutina/propuesta/{id}`) cuando es un ajuste o una semana nueva | Ajuste (#29) y semana nueva (#27) |
| ~~Diseño "Disco", tema (#53)~~ | Hecho: toda la app: cambian colores, fuentes y formas sin cambiar qué hace cada pantalla | Nada |
| ~~Navegación y pantalla Entrenar (#54)~~ | Hecho: barra fija abajo en todas las pantallas con sesión; "Entrenar" reemplaza la portada actual | #53 |
| Rediseño del día, las rutinas y la propuesta (#55) | `/semanas/{id}/dia/{n}`, `/rutinas` y `/rutina/propuesta/{id}` | #53 |
| ~~Elegir camino A o B (#43)~~ y ~~formulario de rutina actual (#44)~~ | No se hacen: se descartó el camino B (decisión 40) | — |
| ~~Editar la semana a mano (#13)~~ | No se hace: el plan solo lo cambia la IA, con el ajuste (#29) | — |

**Decisiones pendientes del usuario:** cuántas series por ejercicio (hoy se admiten 2; quiere "3 a 4": opciones A, B o C), si R20, R24 y R25 comparan contra series directas solas o con indirectas, aprobar R5b (músculo secundario), la consulta al profesor sobre el catálogo y los vectores (#52), cuánto reducir el volumen en la semana liviana (R30), los avisos al usuario, el ajuste de ejercicios repetidos y dónde va el pedido de ajuste. (Resueltos: los botones Cerrar semana y Generar, y que el plan no se edita a mano.)

## Ideas para después (fuera del MVP, sin definir)

Ideas anotadas durante el diseño. No son tareas todavía: antes de convertirlas en issues hay que definirlas (qué ve el usuario, qué acciones tiene, criterios de aceptación).

- **Sistema de rachas por día, semana y mes.** Premiar la constancia, apoyado en el botón "Día completado" (sesión terminada) para que el usuario sienta satisfacción y motivación.
  - A definir: qué cuenta como día cumplido, como semana cumplida y como mes cumplido; qué rompe una racha; dónde se muestra.
  - Punto a decidir: la racha diaria debería contar los **días planificados**, no los días del calendario, para que un día de descanso no la rompa.
  - Se podría calcular con datos que ya existen (sesiones terminadas y series reales), sin tablas nuevas.
- **Logros y récords personales** (relacionado con las rachas): marcas como "mejor peso en press banca".
- **Entrada por voz** para contar cómo se sintió el usuario (hoy solo texto y botones rápidos).
- **Notificaciones al usuario.** Avisos que ayudan a seguir el plan, por ejemplo: "Hoy te toca el Día 3", "Tenés pendiente el Día 2" o "Te salteaste el Día 4".
  - A definir: por qué canal llegan (dentro de la app, correo, avisos del navegador o del celular), cuándo se envían, qué eventos las disparan y cómo se desactivan.
  - Punto a decidir: respetar el control del usuario. Como el cierre de la semana es manual y los días se llaman "Día 1, Día 2" (no lunes ni martes), los avisos deberían **sugerir** ("completaste todos los días, ¿cerrar la semana?") y nunca hacer nada solos.
  - Se podrían calcular con datos que ya existen (el plan activo y las sesiones terminadas); lo nuevo sería el envío y las preferencias del usuario.
- **Reloj o cronómetro en el día de entrenamiento** (idea del usuario, 2026-10-12). Para controlar el **descanso entre series** y el **tiempo de los ejercicios isométricos** (plancha) sin salir de la pantalla del día.
  - **Lo activa el usuario** (decisión del usuario): el reloj nunca arranca solo ni se dispara al marcar una serie como hecha; el usuario lo inicia con un botón cuando quiere usarlo.
  - A definir: si es una cuenta regresiva que arranca con el descanso del ejercicio (`rest_seconds`) o con los segundos de la serie isométrica (`duration_seconds`), un cronómetro libre, o las dos; qué pasa al llegar a cero (aviso sonoro o vibración, pasar a la serie siguiente); y si lo medido en un isométrico se guarda como lo realizado.
  - Punto a decidir: dónde vive. En la fila de cada serie (un botón por serie) o como una barra fija al pie del día, que sirve para todas.
  - Detalle técnico a tener en cuenta: en el celular, la pantalla se apaga y el navegador pausa los temporizadores; el tiempo debería calcularse con la hora de inicio y no contando segundos, y el sonido o la vibración necesitan un permiso del navegador.
  - Se podría construir con datos que ya existen (`plan_exercises.rest_seconds` y `plan_sets.duration_seconds`), sin tablas nuevas ni llamadas a la IA.
