# Spotter

> Un entrenador que mira tu progreso real y te arma la semana siguiente.

Spotter es una aplicación web para quienes entrenan solos en el gimnasio. El usuario registra lo que entrena y, cuando cierra la semana, una IA analiza su historial y le propone la siguiente: qué subir, qué mantener y qué cambiar. El usuario siempre decide si acepta o descarta lo que la IA propone.

## Problema

Quien entrena solo no sabe cuándo subir el peso, cuándo cambiar un ejercicio ni cuándo acumula fatiga. Sin un entrenador, la rutina queda igual durante meses y el progreso se estanca.

## Usuario

Personas que entrenan por su cuenta (de principiante a intermedio) y no pueden pagar un entrenador personal.

## Cómo funciona

1. **Registro con correo verificado.** La persona se registra, toca el enlace que le llega por correo (la cuenta se crea al tocarlo) y completa su perfil en un asistente de una pregunta por pantalla: nombre, fecha de nacimiento, peso, altura, sexo, lesiones o limitaciones y aviso legal.
2. **Cada rutina nueva se arma con cuatro elecciones:** **nivel** (principiante, intermedio o avanzado), **objetivo** (ganar masa, ganar fuerza, perder grasa o mantenerse activo), **días por semana** (de 2 a 6; un principiante, 2 o 3) y **estructura** (cuerpo completo, torso y pierna o empuje, tirón y piernas, según los días y el nivel). No están en el perfil, porque cambian de una rutina a otra. Se da por hecho un gimnasio completo.
3. **La IA arma la rutina.** Elige solo ejercicios de un catálogo de 124 (recuperados con embeddings y pgvector) y el código valida que cumpla las reglas de entrenamiento. La persona ve una vista previa y **acepta o descarta**; recién al aceptar se escribe en el plan. En la propuesta puede **cambiar un ejercicio** por otro del catálogo. Después puede **continuar** la rutina (objetivo y nivel quedan fijos) o empezar otra. No se carga una rutina propia.
4. **La semana se organiza en días** ("Día 1", "Día 2"...), no en lunes o martes: la persona entrena a su ritmo.
5. **Entrenar.** Desde "Empezar" se abre el modo entrenar, un ejercicio a la vez, con la serie en grande, un reloj de descanso y un contador de la sesión. Cada serie se marca como hecha o se corrige con lo que realmente se hizo. Cada ejercicio trae su "Cómo hacerlo" y por qué está en la rutina.
6. **Día completado.** Cierra la sesión (se puede reabrir con una confirmación).
7. **Cerrar semana** (siempre manual, nunca por fecha): avisa los días sin hacer, que cuentan como no hechos, y permite cargar el peso, la grasa corporal y un comentario sobre cómo se sintió, todo opcional. Con eso, la IA compara lo planificado con lo real y propone la semana siguiente, que la persona acepta o descarta.

## Estado actual

El proyecto se construye por etapas. Hoy funciona de punta a punta:

- **Cuenta:** registro con correo verificado, inicio de sesión con la casilla "Recordarme" (sesión de 30 días o de 12 horas), recuperar la contraseña, cambiar la contraseña y el correo, y borrar la cuenta. La sesión es un JWT en una cookie `httpOnly` y las contraseñas llevan hash argon2.
- **Perfil** en dos pestañas (Perfil y Cuenta): cada dato se edita por separado.
- **Generar rutina** con vista previa, avisos de las reglas, aceptar o descartar, y cambiar un ejercicio sin IA. Una sola generación a la vez, con topes de uso de la IA que se aplican antes de cada llamada.
- **Inicio, Entrenar y Rutinas:** la semana en curso, el modo entrenar con reloj de descanso, las rutinas con sus semanas y días (mirar sin registrar) y reabrir semanas o días cerrados.
- **Semana nueva:** al continuar una rutina, la IA lee lo planificado frente a lo real (con una señal por ejercicio: superó, cumplió o no llegó) y el comentario de cierre, y propone la siguiente. Sube la carga si superaste lo planificado, la mantiene si no llegaste y, si el comentario cuenta fatiga o cargas altas, baja un escalón: el peso lo calcula el código, no la IA.
- **Progreso:** resúmenes por día y por semana (con "Cómo te fue": superaste, cumpliste o no llegaste en cada ejercicio), radar de músculos, mapa muscular sobre el cuerpo, evolución por ejercicio, calendario y seguimiento del peso con IMC.
- **Interfaz** con el estilo "Disco" (inspirado en los discos de pesas) sobre shadcn/ui y Tailwind; ver [docs/sistema-de-diseno.md](docs/sistema-de-diseno.md).

**Todavía no está:** el despliegue en producción, las capturas de pantalla en este archivo y la revisión de los criterios y del catálogo por una persona con formación en educación física.

**Descartado por ahora:** el ajuste conversando durante la semana, la nota de cómo me sentí por día, el esfuerzo por serie y el semáforo de dolor con escala. En su lugar, la IA deduce el esfuerzo de la carga y las repeticiones y lee el comentario de cierre. El plan no se edita a mano: lo único editable es lo realizado, y el plan solo cambia con la semana nueva. El detalle y el orden están en [docs/backlog.md](docs/backlog.md) y en el tablero del proyecto.

## Funcionalidades

### Base
- Registro e inicio de sesión (JWT), con verificación de correo.
- Perfil con datos personales y aviso legal; el nivel, el objetivo, los días y la estructura se eligen al empezar cada rutina.
- Rutinas semanales organizadas en días y ejercicios, con series desglosables (cada serie con sus repeticiones y su peso) e indicaciones de ejecución. El cardio y los isométricos son ejercicios con duración.
- Registro de sesiones: lo realizado frente a lo planificado, serie por serie.

### Valor de la IA
La IA trabaja sobre los datos del usuario y siempre **propone**: se ve una vista previa de los cambios y se aceptan o descartan. No es un chat genérico.

1. **Rutina nueva**, según el nivel, el objetivo, los días y la estructura elegidos.
2. **Cierre de semana:** analiza lo planificado frente a lo real y propone la siguiente, con un resumen de evolución.
3. **Explicación por ejercicio:** el ícono ⓘ muestra "Cómo hacerlo" y por qué el ejercicio está en la rutina.

### Fuera del alcance del MVP
Nutrición, wearables, video y consejos médicos. La app pide aceptar que no da consejo médico al crear el perfil y lo recuerda en letra chica en el día y en la propuesta; la página completa del aviso legal está en espera (borrador en [docs/aviso-legal-borrador.md](docs/aviso-legal-borrador.md)).

## Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| FastAPI | API del backend en Python; genera la documentación (`/docs`) automáticamente |
| Pydantic | Valida los datos del usuario y las respuestas de la IA antes de guardarlas |
| SQLAlchemy | Trabajar con la base de datos usando clases de Python |
| PostgreSQL + pgvector | Base de datos relacional; pgvector guarda los vectores del catálogo de ejercicios (RAG) |
| Alembic | Migraciones: versiona los cambios de estructura de la base de datos |
| JWT + argon2 | Sesión en una cookie `httpOnly` (JWT de 30 días o de 12 horas, según "Recordarme") y contraseñas con hash |
| shadcn/ui + Tailwind CSS | Componentes de la interfaz, con el estilo propio "Disco" |
| Next.js + TypeScript | Frontend |
| pytest | Tests automáticos del backend |
| Docker Compose | Entornos de desarrollo y producción en contenedores |
| Gemini | IA (modelo `gemini-3.5-flash-lite`, plan gratuito) y embeddings (`gemini-embedding-001`): respuestas en JSON validadas con Pydantic, con topes de uso diarios y por minuto que se aplican antes de cada llamada |

## Estructura de carpetas

```
spotter/
├── backend/
│   ├── app/                  # API: main.py, db.py, deps.py, security.py, enums.py, models.py, schemas.py
│   │   ├── routers/          # Endpoints: auth, calendar, exercises, measurements, period, profile, proposals, routines y weeks
│   │   ├── scripts/          # Tareas de una sola vez (reclamar el usuario de desarrollo e indexar el catálogo)
│   │   └── ai/               # IA: Gemini con topes, catálogo de ejercicios y RAG, reglas de la rutina, prompt
│   ├── migrations/           # Migraciones de Alembic
│   ├── tests/                # Tests con pytest (no llaman a Gemini de verdad)
│   ├── Dockerfile            # Imagen de desarrollo
│   ├── Dockerfile.prod       # Imagen de producción
│   ├── requirements.txt      # Dependencias de producción
│   └── requirements-dev.txt  # Dependencias de desarrollo (pytest)
├── frontend/
│   ├── src/app/              # Páginas (Next.js, App Router): bienvenida, login, registro, inicio, entrenar, progreso, perfil, propuesta, rutinas y semanas
│   ├── src/components/       # Componentes compartidos (asistentes, discos, mapa muscular, radar...) y ui/ (shadcn)
│   ├── src/lib/              # Tipos de la API, apiFetch (sesión) y funciones de formato
│   ├── src/proxy.ts          # Redirige a /login si no hay sesión
│   ├── Dockerfile            # Imagen de desarrollo
│   └── Dockerfile.prod       # Imagen de producción
├── docs/                     # Flujo, modelo de datos y backlog
├── docker-compose.dev.yml    # Entorno de desarrollo
├── docker-compose.prod.yml   # Entorno de producción
├── .env.example              # Variables de entorno de ejemplo
├── CLAUDE.md                 # Contexto del proyecto para asistentes de IA
└── README.md
```

## Cómo levantar el proyecto

### Desarrollo (Docker)

Requiere Docker Desktop abierto. Desde la raíz del proyecto:

```bash
docker compose -f docker-compose.dev.yml up --build
```

| Servicio | URL / puerto |
|---|---|
| Frontend (Next.js) | http://localhost:3001 |
| Backend (FastAPI) | http://localhost:8000 (documentación en `/docs`, salud en `/health`) |
| PostgreSQL | `localhost:5434` |
| Mailpit (buzón falso donde llegan los correos en desarrollo) | http://localhost:8025 |

El código se monta desde tu PC y se recarga solo al guardar. Para apagar todo: `docker compose -f docker-compose.dev.yml down` (agregá `-v` para borrar también los datos de la base).

### Base de datos (migraciones)

Las tablas se crean con Alembic. Con el entorno de desarrollo levantado, desde la raíz del proyecto:

```bash
docker compose -f docker-compose.dev.yml exec backend alembic upgrade head
```

Otros comandos útiles (mismo prefijo `docker compose ... exec backend`):

| Comando | Para qué sirve |
|---|---|
| `alembic current` | Ver qué migración está aplicada |
| `alembic revision --autogenerate -m "descripción"` | Generar una migración nueva a partir de los cambios en `backend/app/models.py` (revisarla antes de aplicarla) |
| `alembic downgrade -1` | Deshacer la última migración |

En desarrollo las migraciones **no se aplican solas**: se corren a mano para no tocar los datos por sorpresa.

### Variables de entorno

Para levantar la app, registrarse (los correos llegan a Mailpit) y usar el registro del día alcanzan los valores por defecto. Para **Generar rutina** hace falta la IA: copiá `.env.example` a `.env` y completá `GEMINI_API_KEY` (una clave del plan gratuito, de preferencia en un proyecto propio de Google AI Studio, porque los límites son por proyecto), `GEMINI_MODEL`, los topes `GEMINI_DAILY_LIMIT` y `GEMINI_RPM_LIMIT`, y los de los embeddings (`GEMINI_EMBEDDING_*`). Después hay que indexar el catálogo una vez: `docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.index_catalog`. No hay valores por defecto a propósito: si falta alguno, la app se niega a llamar a Gemini. El archivo `.env` no se sube al repositorio.

**Cuenta y sesión.** La API exige sesión (excepto `/health` y `/auth/*`): creá tu cuenta en `/registro` (el enlace de verificación llega a Mailpit en desarrollo; en producción hacen falta `SMTP_*`, `APP_URL` y `EMAIL_DAILY_LIMIT`) e iniciá sesión en `/login`. `JWT_SECRET` firma la sesión (sin valor por defecto en producción; usá 32 caracteres o más) y `COOKIE_SECURE=true` hace que la cookie solo viaje por HTTPS. Si ya tenías datos del desarrollo previo al login, `docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.claim_user` convierte el usuario de desarrollo en tu cuenta (una sola vez; la contraseña la escribís por teclado).

El `.env` se lee al **crear** el contenedor: después de cambiarlo, corré `docker compose -f docker-compose.dev.yml up -d backend` (reiniciar no alcanza).

### Producción (Docker)

Imágenes construidas, sin código montado ni recarga automática, con los servicios corriendo sin privilegios de administrador y la base sin puerto expuesto hacia afuera.

1. Crear el archivo `.env` (copiando `.env.example`) con **contraseñas reales**. `POSTGRES_PASSWORD` y `JWT_SECRET` son obligatorios: sin ellos el compose se niega a arrancar.
2. Si el backend va a estar en otra dirección, definir `NEXT_PUBLIC_API_URL` en el `.env` (se incrusta al compilar el frontend).
3. Levantar todo:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Las migraciones se aplican solas en un paso previo (servicio `migrate`) y el backend arranca recién cuando terminan bien. **Después hay que indexar el catálogo una vez** (`docker compose -f docker-compose.prod.yml exec backend python -m app.scripts.index_catalog`): sin eso, la IA recibe todos los ejercicios sin ordenar por similitud. Para apagar: `docker compose -f docker-compose.prod.yml down`.

Este compose corre la aplicación completa como en producción, en tu PC o en un servidor propio. El despliegue en la nube todavía no está definido.

### Tests del backend

Las dependencias de desarrollo (pytest) están en `backend/requirements-dev.txt`; la imagen de producción no las incluye:

```bash
docker compose -f docker-compose.dev.yml run --rm --no-deps backend python -m pytest -q
```

Los tests usan una base SQLite en memoria y un Gemini simulado: no necesitan PostgreSQL ni gastan cuota de la IA.

## Documentación

- [Flujo de la app](docs/flujo-app.md): cómo se usa de principio a fin.
- [Modelo de datos](docs/modelo-datos.md): tablas y relaciones.
- [Decisiones](docs/decisiones.md): qué se decidió, por qué y qué se descartó.
- [Criterios de entrenamiento](docs/criterios-entrenamiento.md): lo que dice la evidencia, con sus fuentes, como base de las reglas de la IA.
- [Backlog](docs/backlog.md): tareas e ideas para más adelante.
- [CLAUDE.md](CLAUDE.md): decisiones y convenciones del proyecto para asistentes de IA.
