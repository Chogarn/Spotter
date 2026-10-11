# Spotter

> Un entrenador que mira tu progreso real y te arma la semana siguiente.

Spotter es una aplicación web para quienes entrenan solos en el gimnasio. El usuario registra lo que entrena y, cuando cierra la semana, una IA analiza su historial y le propone la siguiente: qué subir, qué mantener y qué cambiar. El usuario siempre decide si acepta o descarta lo que la IA propone.

## Problema

Quien entrena solo no sabe cuándo subir el peso, cuándo cambiar un ejercicio ni cuándo acumula fatiga. Sin un entrenador, la rutina queda igual durante meses y el progreso se estanca.

## Usuario

Personas que entrenan por su cuenta (de principiante a intermedio) y no pueden pagar un entrenador personal.

## Cómo funciona

1. El usuario se registra y completa sus datos: edad, peso, altura, sexo (opcional) y limitaciones. Ni los días ni la duración de las sesiones los elige: **los determina la IA** (entre 2 y 6 días) según sus datos, el nivel y el objetivo, y si prefiere entrenar más, la IA recalcula.
2. **Cada vez que empieza una rutina nueva elige su nivel** (principiante, intermedio o avanzado) **y su objetivo** (obligatorios): ganar masa muscular, ganar fuerza, perder grasa, mejorar la condición general o mantenerse activo. No están en el perfil, porque cambian de una rutina a otra. Se da por hecho que entrena en un gimnasio completo.
3. Empieza de una de dos formas:
   - **La app crea su primera rutina** a partir del perfil, el nivel y el objetivo. Después puede **continuar** una rutina que ya tiene (la semana siguiente hereda su nivel y su objetivo) o **empezar una nueva**.
   - **Carga la rutina que ya hace** (ejercicio, series × repeticiones y peso en kilos) y la IA se la mejora.
4. La semana se organiza en días: **Día 1, Día 2, Día 3**... en lugar de lunes o martes, así el usuario entrena a su ritmo.
5. En cada día, cada ejercicio muestra lo planificado (por ejemplo, press banca 3 × 8 con 50 kg) y, si el usuario lo despliega, **cada serie** con sus propias repeticiones y su propio peso. Lo **tilda** si lo hizo tal cual, o carga lo que realmente hizo (3 × 10 con 40 kg). Cada ejercicio puede traer indicaciones de ejecución (por ejemplo, "bajar lento, pausa arriba").
6. Al terminar, toca **"Día completado"** y, si quiere, cuenta cómo se sintió.
7. Cuando decide, toca **"Cerrar semana"**: la IA compara lo planificado con lo real (incluidos los días que no se hicieron) y propone la semana siguiente.

El cierre es siempre manual: nada se genera solo por fecha.

## Estado actual

El proyecto se construye por etapas. Hoy funciona, con registro e inicio de sesión:

- **Perfil** (datos personales y aviso legal).
- **Generar rutina** (camino A), desde la portada: se elige continuar una rutina o empezar una nueva (nivel y objetivo), con Cancelar. Gemini arma la semana, con vista previa y avisos; el usuario acepta o descarta, y solo al aceptar se escribe en el plan (y se crea la rutina nueva).
- **Mis rutinas:** las rutinas (con nombre automático que se puede cambiar), las semanas de cada una, sus días y los ejercicios de cada día, con las series desplegables.
- **Cerrar semana:** botón en la semana activa, con aviso de los días sin completar (sin IA).
- **Registro del día:** editar lo realizado por serie, marcar series y ejercicios como hechos (un ejercicio hecho queda bloqueado hasta reabrirlo) y **Día completado** (que también se puede reabrir).
- **Semana nueva:** al continuar una rutina, la IA lee lo planificado frente a lo real de la última semana cerrada (con una señal por ejercicio: superó, cumplió, no llegó) y propone la siguiente con un resumen; sube la carga si superaste las repeticiones y la mantiene si no llegaste.
- **Cerrar semana con un comentario** escrito (opcional) sobre cómo te sentiste, que la IA tiene en cuenta; y **ver la propuesta pendiente** desde la portada.
- **Cuenta y sesión:** registro e inicio de sesión con cookie `httpOnly` (JWT de 7 días) y contraseñas con hash argon2; sin sesión, todas las pantallas llevan a `/login`.
- **Interfaz** con shadcn/ui y Tailwind en versión básica (los estilos propios vienen más adelante).

Todavía no están: cargar la rutina propia (camino B), el ajuste conversando, y, pospuestos por decisión del proyecto, la nota de cómo me sentí, el esfuerzo por serie y el semáforo de dolor. El catálogo de ejercicios para la IA (hoy un borrador de 84 en `backend/app/ai/exercises.json`, sin conectar) espera una consulta. El plan no se edita a mano: lo único editable es lo realizado, y la IA es la que cambia el plan. El detalle y el orden están en [docs/backlog.md](docs/backlog.md) y en el tablero del proyecto.

## Funcionalidades

### Base
- Registro e inicio de sesión (JWT).
- Perfil con datos personales y aviso legal; nivel y objetivo se eligen al empezar cada rutina.
- Rutinas semanales organizadas en días y ejercicios, con series desglosables (cada serie con sus repeticiones y su peso), indicaciones de ejecución. El plan no se edita a mano; el usuario edita lo realizado. El cardio es un ejercicio más, medido en minutos.
- Registro de sesiones: lo realizado frente a lo planificado, serie por serie. *(El esfuerzo del 1 al 10 y la nota de cómo se sintió el día están definidos pero pospuestos.)*

### Valor de la IA
La IA trabaja sobre los datos del usuario y siempre **propone**: el usuario ve una vista previa de los cambios y los acepta o los descarta. No es un chat genérico.

1. **Primera rutina o mejora de la existente**, según el objetivo.
2. **Cierre de semana:** analiza lo planificado frente a lo real de la semana anterior y propone la siguiente con un resumen de evolución. *(Hoy sube la carga o la mantiene según lo que hiciste; detectar fatiga necesita el esfuerzo por serie, que está pospuesto.)*
3. **Ajuste conversando:** "no tengo esa máquina", "me molesta el hombro". La IA propone una versión modificada de la semana.
4. **Explicación por ejercicio:** botón "¿por qué esto?" con la razón basada en los números del usuario.
5. **Sustitución:** el usuario rechaza un ejercicio y elige entre 2 alternativas propuestas por la IA.

### Fuera del alcance del MVP
Nutrición, wearables, video y consejos médicos. La app muestra un aviso legal visible.

## Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| FastAPI | API del backend en Python; genera la documentación (`/docs`) automáticamente |
| Pydantic | Valida los datos del usuario y las respuestas de la IA antes de guardarlas |
| SQLAlchemy | Trabajar con la base de datos usando clases de Python |
| PostgreSQL | Base de datos relacional |
| Alembic | Migraciones: versiona los cambios de estructura de la base de datos |
| JWT + argon2 | Sesión en una cookie `httpOnly` (JWT de 7 días) y contraseñas con hash |
| shadcn/ui + Tailwind CSS | Componentes de la interfaz (versión básica) |
| Next.js + TypeScript | Frontend |
| pytest | Tests automáticos del backend |
| Docker Compose | Entornos de desarrollo y producción en contenedores |
| Gemini | IA (modelo `gemini-3.5-flash-lite`, plan gratuito): respuestas en JSON validadas con Pydantic, con topes de uso diarios y por minuto que se aplican antes de cada llamada |

## Estructura de carpetas

```
spotter/
├── backend/
│   ├── app/                  # API: main.py, db.py, deps.py, security.py, enums.py, models.py, schemas.py
│   │   ├── routers/          # Endpoints: auth, profile, proposals, routines y weeks
│   │   ├── scripts/          # Tareas de una sola vez (reclamar el usuario de desarrollo)
│   │   └── ai/               # IA: Gemini con topes, formato y reglas de la rutina, prompt
│   ├── migrations/           # Migraciones de Alembic
│   ├── tests/                # Tests con pytest (no llaman a Gemini de verdad)
│   ├── Dockerfile            # Imagen de desarrollo
│   ├── Dockerfile.prod       # Imagen de producción
│   ├── requirements.txt      # Dependencias de producción
│   └── requirements-dev.txt  # Dependencias de desarrollo (pytest)
├── frontend/
│   ├── src/app/              # Páginas (Next.js, App Router): portada, login, registro, perfil, propuesta, rutinas y semanas
│   ├── src/components/       # Componentes compartidos (fila de ejercicio, serie, errores) y ui/ (shadcn)
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

Para levantar la app y usar el perfil, Mis rutinas y el registro del día alcanzan los valores por defecto. Para **Generar rutina** hace falta la IA: copiá `.env.example` a `.env` y completá `GEMINI_API_KEY` (una clave del plan gratuito, de preferencia en un proyecto propio de Google AI Studio, porque los límites son por proyecto), `GEMINI_MODEL` y los topes `GEMINI_DAILY_LIMIT` y `GEMINI_RPM_LIMIT`. No hay valores por defecto a propósito: si falta alguno, la app se niega a llamar a Gemini. El archivo `.env` no se sube al repositorio.

**Cuenta y sesión.** La API exige sesión (excepto `/health` y `/auth/*`): creá tu cuenta en `/registro` e iniciá sesión en `/login`. `JWT_SECRET` firma la sesión (sin valor por defecto en producción; usá 32 caracteres o más) y `COOKIE_SECURE=true` hace que la cookie solo viaje por HTTPS. Si ya tenías datos del desarrollo previo al login, `docker compose -f docker-compose.dev.yml exec backend python -m app.scripts.claim_user` convierte el usuario de desarrollo en tu cuenta (una sola vez; la contraseña la escribís por teclado).

El `.env` se lee al **crear** el contenedor: después de cambiarlo, corré `docker compose -f docker-compose.dev.yml up -d backend` (reiniciar no alcanza).

### Producción (Docker)

Imágenes construidas, sin código montado ni recarga automática, con los servicios corriendo sin privilegios de administrador y la base sin puerto expuesto hacia afuera.

1. Crear el archivo `.env` (copiando `.env.example`) con **contraseñas reales**. `POSTGRES_PASSWORD` y `JWT_SECRET` son obligatorios: sin ellos el compose se niega a arrancar.
2. Si el backend va a estar en otra dirección, definir `NEXT_PUBLIC_API_URL` en el `.env` (se incrusta al compilar el frontend).
3. Levantar todo:

```bash
docker compose -f docker-compose.prod.yml up --build -d
```

Las migraciones se aplican solas en un paso previo (servicio `migrate`) y el backend arranca recién cuando terminan bien. Para apagar: `docker compose -f docker-compose.prod.yml down`.

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
