# Backlog inicial de Spotter

Para copiar a GitHub Projects: un milestone por semana (S1 a S6) y un issue por cada línea.
Etiquetas sugeridas: `backend`, `frontend`, `ia`, `docker`, `docs`, `complementaria`.
Columnas del tablero: Backlog, En curso, Revisión, Hecho.

## S1: Planificación y setup
- [x] Definir idea y alcance del proyecto `docs`
- [x] Crear repo en GitHub con estructura base `docs`
- [x] Crear tablero de GitHub Projects con este backlog `docs`
- [x] Escribir el README (idea, stack, estructura) `docs`
- [ ] Docker Compose de desarrollo (backend, frontend, PostgreSQL) `docker`
- [ ] Docker Compose de producción `docker`
- [ ] Esqueleto de FastAPI con endpoint de salud `backend`
- [ ] Esqueleto de Next.js con TypeScript `frontend`
- [ ] Configurar Alembic y primer modelo de datos `backend`
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
