# Spotter: contexto para asistentes de IA

Spotter es una app web de entrenamiento: el usuario registra lo que entrena y, al cerrar la semana, una IA (Gemini) analiza lo planificado frente a lo real y propone la semana siguiente. Detalle del producto en `README.md`, `docs/flujo-app.md` y `docs/modelo-datos.md`. Las decisiones del usuario, con su motivo, están en `docs/decisiones.md`: no las contradigas sin preguntar.

## Cómo trabajar acá

- **El usuario está al mando; la IA propone.** Es un proyecto de aprendizaje con un tutor que evalúa que el criterio sea del estudiante. Antes de construir algo, mostrá lo que vas a hacer (maqueta, cambio de tablas, fragmento clave) para que lo corrija. No tomes decisiones de diseño por tu cuenta: preguntalas.
- Al terminar cada entrega, decí **qué revisar** y **qué decidiste vos sin preguntar**.
- Explicá en español rioplatense y en lenguaje simple; usá analogías con lo que el usuario ya conoce (Next.js, Git).
- **Tareas bien definidas.** Cada tarea del backlog debe decir: para qué sirve, cómo se accede, qué ve el usuario, qué acciones puede hacer, si es una vista o componentes, qué datos usa y criterios de aceptación comprobables. Evitar tareas como "Implementar interfaz de usuario".
- No hacer `git commit` ni `git push` sin que el usuario lo pida o lo apruebe en un plan.
- Si algo no está confirmado (planes gratuitos de Gemini, Vercel, Render o Railway, límites de uso), no lo des por hecho: verificalo en la fuente oficial.
- **Reglas de entrenamiento:** las únicas permitidas son **R1 a R35**, aprobadas por el usuario el 2026-10-08 y escritas en `docs/criterios-entrenamiento.md` (con su fuente, certeza, si las comprueba el código o se explican a Gemini, y en qué momento). R3 (10 series o más por semana por grupo muscular) **vale también para principiantes** y **aplica solo a los 6 grupos grandes** (pecho, espalda, hombros, cuádriceps, isquios y glúteos). No inventes reglas de series, repeticiones, cargas o descansos de memoria. Sigue **abierta** (no la resuelvas tú): cuánto se reduce el volumen en una semana liviana (R30). Si el volumen de R3 no entra en la duración de referencia, la IA actúa en orden (R35): suma días, luego alarga la sesión y avisa, y solo al final recorta series, empezando por los ejercicios accesorios y los músculos chicos (bíceps, tríceps, gemelos y core). La duración de una sesión se estima con la fórmula de R34 (el código solo avisa) y los ejercicios llevan las etiquetas obligatorias de R13 (`region`, `direction`, `primary_muscle`, `secondary_muscles`, `mechanic`, `equipment`, `level`; `full_body` para cardio). Los umbrales de fatiga (2 sesiones seguidas, o 3 sostenidas, con esfuerzo de 9 a 10) y el semáforo de dolor (R31) están aprobados como elección de diseño, sin valor validado. El descanso es un campo propio y editable (`rest_seconds`, R8) y la movilidad es un texto del día (`mobility_notes`, R26). R29 (repeticiones en reserva y esfuerzo) se aprobó como deducción: el patrón está confirmado y las filas de 7 y 8 se infieren. Los minutos de cardio están resueltos en **R17**: la IA los decide dentro de 150 a 300 por semana y el código valida el rango. R20, R24 y R25 son síntesis del investigador, no cifras publicadas.

## Stack

FastAPI + Pydantic + SQLAlchemy 2.x + Alembic + PostgreSQL 17 + JWT (backend, Python 3.12 en Docker) · Next.js 16 + TypeScript (frontend) · Gemini (IA) · pytest · Docker Compose (dev y prod).
Usamos SQLAlchemy solo, **sin SQLModel**. Pydantic valida la API y las respuestas de la IA.

## Estructura

`backend/app/` (main.py, db.py, deps.py, enums.py, models.py, schemas.py, `routers/` con profile, proposals y weeks, y `ai/` con gemini.py, routine.py, rules.py, schema.py, prompt.py, generate.py, plan_writer.py y `prompts/generar_rutina.md`), `backend/migrations/`, `backend/tests/`, `frontend/src/app/` (portada, `perfil/`, `rutina/propuesta/[id]/` y `rutinas/` con la lista de semanas, `[id]/` y `[id]/dia/[n]/`; cada página con parámetros es un `page.tsx` de servidor más una `...View.tsx` de cliente), `frontend/src/components/` (ExerciseRow) y `frontend/src/lib/` (api.ts y format.ts), `docs/`, `docker-compose.dev.yml`, `docker-compose.prod.yml`.

## Comandos

```bash
# Levantar desarrollo
docker compose -f docker-compose.dev.yml up --build -d
# Migraciones (a mano en desarrollo)
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
# Tests del backend
docker compose -f docker-compose.dev.yml run --rm --no-deps backend python -m pytest -q
# Producción local (requiere .env con POSTGRES_PASSWORD y JWT_SECRET)
docker compose -f docker-compose.prod.yml up --build -d
```

Puertos de desarrollo: frontend **3001**, backend **8000**, PostgreSQL **5434**.

## Restricción dura: la IA nunca debe generar costo

El plan gratuito de Gemini no puede superarse. La IA ya está implementada (camino A, "Generar rutina") y cumple esto:
- Cada llamada a Gemini escribe una fila en `ai_calls` **antes** de enviarse, y esa tabla **no se borra nunca** (el borrado de un usuario tampoco la arrastra). Los topes diario y por minuto se calculan contando esas filas, de **todos** los usuarios (el límite de Google es por proyecto), y el día se reinicia a medianoche del Pacífico. No agregar endpoints que las eliminen.
- Los topes se aplican **antes** de llamar. Se configuran por entorno (`GEMINI_DAILY_LIMIT`, `GEMINI_RPM_LIMIT`) junto con `GEMINI_API_KEY` y `GEMINI_MODEL`, y **no hay valores por defecto**: si falta algo, no se llama (el backend responde 503). Cada reintento es otra llamada y cuenta.
- Límites verificados el 2026-10-08 en la consola de Google AI Studio para `gemini-3.5-flash-lite`: 15 pedidos por minuto, 250.000 tokens por minuto y 500 pedidos por día (Google aclara que no están garantizados). Los topes de la app, con margen: **12 por minuto y 400 por día**. Los modelos Flash normales solo permiten 20 por día; Gemini 2.5 Pro y 3.1 Pro no tienen cuota gratuita. En el plan gratuito Google puede usar el contenido para mejorar sus productos.
- La IA se llama solo cuando el usuario toca un botón (hoy, "Generar rutina"; después cierre de semana, ajuste, mejora). Nunca en segundo plano ni por fecha.

## Decisiones de producto (tomadas por el usuario)

- **El objetivo es obligatorio.** Son 5: masa, fuerza, perder grasa, condición general y mantenerme activo. Después hay dos caminos: la app crea la primera rutina, o el usuario carga la que ya hace.
- **"Perder grasa" = más cardio y menos fuerza**, con la fuerza al mínimo de R1 y sin nutrición (fuera de la app). **El cardio es un ejercicio con duración:** `exercises.kind = cardio`, sus series se miden en `duration_minutes` y no en repeticiones; la base exige repeticiones, minutos **o** segundos (una sola). **Los isométricos (plancha) son un tercer tipo:** `exercises.kind = isometric`, sus series se miden en `duration_seconds`; cuentan como fuerza para los días y el volumen.
- **La IA propone y el usuario decide.** Toda propuesta (ajuste, cierre de semana, mejora) se guarda primero y se escribe en el plan **solo al aceptarla**, con vista previa antes/después.
- **El cierre de semana es manual**, con un botón. Nunca se genera la semana siguiente por fecha. La semana es un ciclo: `week_start` es cuándo se activó y `closed_at` cuándo se cerró. Se puede cerrar con días sin hacer: esos días viajan a la IA como información.
- **Los días se llaman "Día 1, Día 2"**, no lunes o martes. `plan_days.day_index` es un orden, no un día del calendario.
- **Los días por semana y la duración de cada sesión los determina la IA, no el usuario:** entre 2 y 6 días, según objetivo, nivel, volumen necesario y (camino B) la rutina cargada. El usuario puede pedir **más** (días o sesiones más largas), **nunca menos**, y la IA recalcula con vista previa. El perfil **no tiene** `days_per_week` ni `session_minutes` (la cantidad de días se calcula con `plan_days`). No existe el pedido "solo puedo 3 días". La duración de referencia (R18) es una guía según el perfil, no un tope: principiante y mantenerme activo cerca de 60 min, intermedio con masa o fuerza de 60 a 90. Los principiantes entrenan 2 o 3 días (R12). R1 (mínimo 2 días) y el máximo de 6 los valida el código.
- **Planificado y real van separados:** `plan_exercises` + `plan_sets` (lo que toca, una fila por serie con sus repeticiones y su peso) y `set_entries` (lo que se hizo, enlazado con `plan_set_id`). El análisis sale de esa diferencia. El "4 × 10 con 50 kg" se **calcula**, no se guarda; si las series difieren se muestra un rango.
- **Un tilde por ejercicio:** sin cambios significa "lo hice como estaba planificado"; si el usuario edita los números, queda lo real. Un botón "Día completado" cierra la sesión (`workout_sessions.finished_at`); los datos se guardan a medida que se cargan, no al final.
- **Los ejercicios crecen solos:** no hay catálogo precargado. La IA elige libremente y la tabla `exercises` se completa al guardar el plan, deduplicando por `name_normalized`.
- El usuario puede **editar a mano** series, repeticiones, peso y las indicaciones de ejecución (`plan_exercises.execution_notes`); la IA respeta esas ediciones. Durante el día, editar una serie registra **lo real** y el plan queda visible; cambiar el plan es una edición aparte. El tilde es por ejercicio, no por serie.
- Fuera del MVP: nutrición, wearables, video y consejos médicos. La IA no da diagnósticos; ante dolor puede bajar la carga o cambiar el ejercicio y muestra un aviso legal.

Ideas futuras (sin definir, no implementar): rachas, logros, entrada por voz y notificaciones. Están en `docs/backlog.md`.

## Estado y pendientes de producto (para retomar)

**Hecho:** el modelo de datos (12 tablas, migraciones 0001 a 0011), el flujo, las reglas R1 a R35, el perfil (`GET` y `PUT /profile`, pantalla `/perfil`) y **"Generar rutina"** (camino A): la IA propone, el usuario ve la vista previa y acepta o descarta; al aceptar se crea la semana activa. **Mis rutinas**: la portada lleva a la lista de semanas, de ahí a sus días y de ahí a los ejercicios de cada día, con las series desplegables (`GET /weeks`, `/weeks/{id}` y `/weeks/{id}/days/{n}`). En la semana activa, cada serie se puede **editar** (lo realizado, con Editar, Guardar y Cancelar; `PUT /weeks/{id}/days/{n}/sets/{plan_set_id}`): el plan no cambia y lo real va a `set_entries`. Cada serie tiene **Marcar como hecha** y **Desmarcar** (opcionales; `POST` y `DELETE .../sets/{id}/done`). Cada ejercicio tiene **Marcar como hecho** (lo cierra y lo bloquea: se guarda en `exercise_completions`), **Reabrir ejercicio** (lo desbloquea sin borrar nada) y **Deshacer** (borra lo registrado) (`POST` y `DELETE .../exercises/{id}/done` y `POST .../exercises/{id}/reopen`) y el día tiene **Día completado** y **Reabrir día** (`POST .../complete` y `.../reopen`, que fijan `workout_sessions.finished_at`); un día completado no admite cambios hasta reabrirlo.

**Todavía no hay:** login (hoy hay un usuario de desarrollo fijo en `get_current_user`; el tutor indicó dejarlo para después, y en la semana 3 se reemplaza solo esa función), camino B (cargar la rutina que ya hace), cerrar semana y generar la semana siguiente, ajuste y mejora, "cómo me sentí", esfuerzo por serie y editar el plan a mano. Lo que sigue, en orden:

1. **Las tareas ya están definidas con el estándar** de "Cómo trabajar acá" en sus issues de GitHub (el tablero se actualizó el 2026-10-09: se cerraron las hechas y se crearon #47 y #48). El resumen y las dependencias están en `docs/backlog.md`. Al terminar una tarea, hay que cerrar su issue con un comentario de qué se hizo y moverla a Done en el tablero (cambiando solo su estado, nunca las opciones del campo Status).
2. **Siguiente construcción:** cerrar semana (#47, sin IA), generar semana nueva (#27, con IA), "cómo me sentí" (#46), esfuerzo por serie (#48), ver la propuesta pendiente (#45), camino A o B (#43 y #44) y editar el plan a mano (#13). El estado global (#17) está en espera.
3. **Decisiones del usuario que faltan:** dónde van los botones **Cerrar semana** y **Generar semana nueva** (la recomendación: cerrar desde la pantalla de la semana activa y generar desde la portada) y dónde va "Editar plan"; además, cuánto reducir el volumen en la semana liviana (R30), los avisos al usuario, el ajuste de ejercicios repetidos y dónde va el pedido de ajuste (puntos abiertos de `docs/flujo-app.md`).
4. **Completar los "(completar)"** de `docs/decisiones.md` (los "por qué" que solo puede escribir el usuario), incluidas las decisiones 27 a 33.
5. **Más adelante:** que una persona con formación en educación física revise los criterios (decisión del usuario), y verificar con fuentes oficiales los planes gratuitos y límites de la plataforma de despliegue.

Las investigaciones (informes largos con fuentes) se hicieron con la skill de investigación profunda y se guardaron **fuera del repo**; lo que importa de ellas está resumido en `docs/criterios-entrenamiento.md`.

## Trampas del entorno (descubiertas probando)

- **Alembic + Enum:** `--autogenerate` repite cada restricción CHECK de los enumerados (error de nombre duplicado en PostgreSQL). **Leer siempre la migración generada** y dejar una sola copia antes de aplicarla. No editar migraciones ya aplicadas: crear una nueva.
- `backend/migrations/env.py` lee `DATABASE_URL` (se adapta a `postgresql+psycopg://` en `app/db.py`); la URL de `alembic.ini` está comentada a propósito.
- **Next.js 16 tiene cambios incompatibles** con lo que se suele conocer. Antes de escribir código de frontend, leer `frontend/AGENTS.md` y la documentación local en `frontend/node_modules/next/dist/docs/`. Tras instalar, `npx next typegen` genera tipos como `LayoutProps`.
- **El frontend de desarrollo en Docker usa `--webpack`:** en volúmenes de Windows hace falta sondeo de archivos (`WATCHPACK_POLLING`) y Turbopack, el empaquetador por defecto, no lo usa; sin eso no recarga.
- `NEXT_PUBLIC_*` se incrusta al compilar: en producción es un argumento de build.
- **Puertos:** el 5432 lo ocupa un Postgres nativo de Windows y el 3000 suele estar ocupado por otros proyectos; por eso Spotter usa 5434 y 3001. No tocar los contenedores de otros proyectos (`gestor-gastos`, `image_identifier_db`).
- El `gh` (GitHub CLI) no está en el PATH: `C:\Program Files\GitHub CLI\gh.exe`. En PowerShell, los comandos con rutas entre comillas en una sola línea fallan a veces: usar un archivo `.ps1`.
- **GitHub Projects:** el tablero es el proyecto 1 de `Chogarn` con columnas Todo, Esta semana, In Progress y Done. **Modificar las opciones del campo Status regenera todos los IDs y deja las tareas sin estado**: guardar el estado antes y restaurarlo después.
- **El `.env` se lee al crear el contenedor:** tras cambiarlo hay que correr `docker compose -f docker-compose.dev.yml up -d backend`; reiniciar no alcanza. Si falta `GEMINI_MODEL`, la clave o un tope, "Generar rutina" muestra "La IA no está configurada" (503). El `.env` está en `.gitignore`: la clave real nunca va en `.env.example` ni en el código.
- **Gemini rechaza el esquema JSON que genera Pydantic** (error 400 sin detalle): `ai/schema.py` lo aplana (sin `$ref`, `anyOf`, `default` ni límites de largo, rango o cantidad; Pydantic los vuelve a comprobar). Una llamada tarda de 10 a 60 segundos y el cliente corta a los 120.
- **Los tests del backend nunca llaman a Gemini de verdad** (gastan cuota): usan SQLite en memoria y un cliente falso. Las pruebas reales se hacen a mano, de a pocas, y quedan en `ai_calls`.
- **Next.js 16 conserva la página anterior con su estado al navegar** (queda oculta, no se destruye). No dejar estados como "cargando" o "generando" activos después de `router.push`: usar `useTransition`. En una página de cliente, `params` es una promesa (`use(params)`).
- **Con `cacheComponents` (activado desde el esqueleto), una página con parámetros no puede leer `params` ella misma:** aparece el aviso "Blocking Route" en desarrollo y falla `next build`. El patrón que funciona (de la documentación de Next): `page.tsx` de servidor que pasa `params` (la promesa) a una vista de cliente dentro de `<Suspense fallback={<Cargando />}>`, y la vista hace `use(params)`. Verificar con un `next build` en una copia temporal dentro del proyecto (con `node_modules` en la carpeta padre; un enlace simbólico no lo acepta Turbopack), sin tocar el `.next` del servidor de desarrollo.
- **El navegador de pruebas de Claude a veces queda con la pestaña oculta** (`document.visibilityState` en `hidden`): no dibuja, `requestAnimationFrame` se pausa y los `<Suspense>` se quedan en su "Cargando..." aunque la app esté bien. No es un error de la app: confirmar con `next build` o en el navegador del usuario.
- **Todavía no se puede cerrar una semana desde la app.** Para repetir pruebas de generación hay que marcar la semana activa como `closed` en la base (`UPDATE week_plans SET status='closed', closed_at=now() WHERE status='active'`); no se borra.
- En Git Bash, un comando con un heredoc largo y comillas falló al interpretarse: escribir los archivos con la herramienta de escritura.
- Los avisos de git sobre LF y CRLF son inofensivos en este equipo.
