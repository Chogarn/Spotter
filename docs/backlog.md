# Backlog inicial de Spotter

Para copiar a GitHub Projects: un milestone por semana (S1 a S6) y un issue por cada línea.
Etiquetas sugeridas: `backend`, `frontend`, `ia`, `docker`, `docs`, `complementaria`.
Columnas del tablero: Backlog, En curso, Revisión, Hecho.

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
- [ ] Tabla de ejercicios que se completa al guardar el plan `backend`
- [ ] CRUD de rutinas (API) `backend`
- [ ] Registro de sesiones: peso, repeticiones, esfuerzo (API) `backend`
- [ ] Vista de planes semanales `frontend`
- [ ] Formulario de registro de sesión `frontend`
- [ ] Estado global en el frontend `frontend`
- [ ] Perfil del usuario (edad, peso, altura, nivel, días, equipamiento, limitaciones) `backend` `frontend`
- [ ] Elegir objetivo (obligatorio) y camino A o B `backend` `frontend`
- [ ] Formulario de rutina actual (camino B): nombre, series x repeticiones, peso en kg `frontend`
- [ ] Publicación LinkedIn 2: primer avance con capturas `docs`

## S3: Autenticación
- [ ] Registro de usuario `backend`
- [ ] Login con JWT `backend`
- [ ] Proteger rutas del backend `backend`
- [ ] Pantallas de registro e inicio de sesión `frontend`
- [ ] Rutas protegidas en el frontend `frontend`
- [ ] Tests básicos con pytest (auth y rutinas) `backend`

## S4: IA, complementos y mejoras
- [ ] Prompt y respuesta en JSON validada con Pydantic `ia` `backend`
- [ ] Cierre semanal: análisis del historial y semana siguiente `ia`
- [ ] Pantalla de resumen semanal `frontend`
- [ ] Ajuste conversando (regenera la semana y la guarda) `ia`
- [ ] Topes de uso de Gemini (diario y por minuto) `ia` `backend`
- [ ] Propuestas de la IA con vista previa (aceptar o descartar) `ia` `backend` `frontend`
- [ ] Nota de cómo me sentí al terminar la sesión (botones y texto) `backend` `frontend`
- [ ] Refactor y mejoras de UX `backend` `frontend`
- [ ] Publicación LinkedIn 3: cómo la IA arma tu semana `docs`

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
