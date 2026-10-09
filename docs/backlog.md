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
- [ ] Editar la semana a mano: series, repeticiones, peso, indicaciones y quitar ejercicio. Antes "CRUD de rutinas (API)": crear (al aceptar la propuesta) y leer (Mis rutinas) ya están; falta editar el plan `backend` `frontend` (#13)
- [x] Registro de sesiones (API): lo realizado por serie, series y ejercicios hechos, ejercicio cerrado y reabrir, Día completado y reabrir `backend` (#14). El esfuerzo pasó a su propia tarea (#48)
- [x] Vista de planes semanales: Mis rutinas, Semana y Día `frontend` (#15)
- [x] Formulario de registro de sesión: la vista del día con Editar, Marcar como hecha y Día completado `frontend` (#16)
- [ ] Estado global en el frontend. En espera: cada pantalla pide sus datos y no hace falta todavía `frontend` (#17)
- [x] Perfil del usuario (edad, peso, altura, nivel, equipamiento, limitaciones y objetivo) `backend` `frontend` (#18)
- [ ] Elegir camino A o B al empezar: el nivel y el objetivo se eligen al generar y el camino A es "Generar rutina" (continuar o empezar una rutina nueva); falta la pantalla de elección `backend` `frontend` (#43)
- [ ] Formulario de rutina actual (camino B): nombre, series × repeticiones, peso en kg, series desglosables, cardio con duración e indicaciones `frontend` (#44)
- [ ] Publicación LinkedIn 2: primer avance con capturas `docs` (#19)

## S3: Autenticación
- [ ] Registro de usuario `backend`
- [ ] Login con JWT `backend`
- [ ] Proteger rutas del backend `backend`
- [ ] Pantallas de registro e inicio de sesión `frontend`
- [ ] Rutas protegidas en el frontend `frontend`
- [ ] Tests básicos con pytest (auth y rutinas) `backend`

## S4: IA, complementos y mejoras
- [x] Prompt y respuesta en JSON validada con Pydantic, para la primera rutina `ia` `backend` (#26). El prompt de la semana siguiente va en #27
- [x] Cerrar semana: botón con aviso de los días sin completar, sin IA `backend` `frontend` (#47)
- [ ] Generar semana nueva: la IA analiza lo real y propone la semana siguiente (antes "Cierre semanal") `ia` (#27)
- [ ] Pantalla de resumen semanal `frontend` (#28)
- [ ] Ajuste conversando (regenera la semana y la guarda) `ia` (#29)
- [x] Topes de uso de Gemini (diario y por minuto) `ia` `backend` (#30)
- [x] Propuestas de la IA: ver la pendiente desde la portada (`GET /proposals/pending`) y vista previa con aceptar o descartar para "Generar rutina" `ia` `backend` `frontend` (#45). El antes y después pasó a #49
- [ ] Antes y después en las propuestas de ajuste y de semana nueva: qué cambia, con el valor anterior y el nuevo. Depende de #29 y #27 `ia` `backend` `frontend` (#49)
- [ ] Nota de cómo me sentí al terminar la sesión (botones y texto) `backend` `frontend` (#46)
- [ ] Esfuerzo por serie (1 a 10) al editar lo realizado `backend` `frontend` (#48)
- [ ] Refactor y mejoras de UX `backend` `frontend` (#31)
- [ ] Publicación LinkedIn 3: cómo la IA arma tu semana `docs` (#32)

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
| Generar semana nueva (#27) | Botón "Generar rutina" en la portada (ubicación decidida). El botón y el recuadro de continuar/empezar ya existen; falta que la IA lea lo real de la semana cerrada | #47 (hecha) |
| Nota de cómo me sentí (#46) | Al tocar "Día completado" en la vista del día | Nada |
| Esfuerzo por serie (#48) | Campo opcional al tocar "Editar" en una serie | Nada |
| Antes y después en las propuestas (#49) | En la vista previa de la propuesta (`/rutina/propuesta/{id}`) cuando es un ajuste o una semana nueva | Ajuste (#29) y semana nueva (#27) |
| Elegir camino A o B (#43) | Pantalla `/empezar` desde la portada | #44 |
| Formulario de rutina actual, camino B (#44) | Opción "Cargar la rutina que ya hago" | #43 |
| Editar la semana a mano (#13) | Botón por ejercicio en la vista del día *(lugar por definir)* | Nada |

**Decisiones pendientes del usuario:** dónde va "Editar plan" dentro del día. (Los botones Cerrar semana y Generar quedaron resueltos: la semana activa y la portada.)

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
