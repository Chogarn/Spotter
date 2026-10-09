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

El proyecto se construye por etapas. Hoy funciona, con un usuario de desarrollo (todavía no hay login):

- **Perfil** (datos personales y aviso legal).
- **Generar rutina** (camino A), desde la portada: se elige continuar una rutina o empezar una nueva (nivel y objetivo), con Cancelar. Gemini arma la semana, con vista previa y avisos; el usuario acepta o descarta, y solo al aceptar se escribe en el plan (y se crea la rutina nueva).
- **Mis rutinas:** las rutinas (con nombre automático que se puede cambiar), las semanas de cada una, sus días y los ejercicios de cada día, con las series desplegables.
- **Cerrar semana:** botón en la semana activa, con aviso de los días sin completar (sin IA).
- **Registro del día:** editar lo realizado por serie, marcar series y ejercicios como hechos (un ejercicio hecho queda bloqueado hasta reabrirlo) y **Día completado** (que también se puede reabrir).

Todavía no están: registro e inicio de sesión (semana 3), cargar la rutina propia (camino B), generar la semana siguiente leyendo lo real (hoy "Generar rutina" no mira la semana cerrada), el ajuste conversando, la nota de cómo me sentí, el esfuerzo por serie y la edición manual del plan. El detalle y el orden están en [docs/backlog.md](docs/backlog.md) y en el tablero del proyecto.

## Funcionalidades

### Base
- Registro e inicio de sesión (JWT).
- Perfil con datos personales y aviso legal; nivel y objetivo se eligen al empezar cada rutina.
- Rutinas semanales organizadas en días y ejercicios, con series desglosables (cada serie con sus repeticiones y su peso), indicaciones de ejecución y edición manual. El cardio es un ejercicio más, medido en minutos.
- Registro de sesiones: lo realizado frente a lo planificado, con esfuerzo del 1 al 10 y una nota de cómo se sintió.

### Valor de la IA
La IA trabaja sobre los datos del usuario y siempre **propone**: el usuario ve una vista previa de los cambios y los acepta o los descarta. No es un chat genérico.

1. **Primera rutina o mejora de la existente**, según el objetivo.
2. **Cierre de semana:** analiza el historial y devuelve qué subir, qué mantener, qué cambiar por estancamiento y dónde hay fatiga, y propone la semana siguiente con un resumen de evolución.
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
| JWT | Autenticación de usuarios |
| Next.js + TypeScript | Frontend |
| pytest | Tests automáticos del backend |
| Docker Compose | Entornos de desarrollo y producción en contenedores |
| Gemini | IA (modelo `gemini-3.5-flash-lite`, plan gratuito): respuestas en JSON validadas con Pydantic, con topes de uso diarios y por minuto que se aplican antes de cada llamada |

## Estructura de carpetas

```
spotter/
├── backend/
│   ├── app/                  # API: main.py, db.py, deps.py, enums.py, models.py, schemas.py
│   │   ├── routers/          # Endpoints: profile, proposals, routines y weeks
│   │   └── ai/               # IA: Gemini con topes, formato y reglas de la rutina, prompt
│   ├── migrations/           # Migraciones de Alembic
│   ├── tests/                # Tests con pytest (no llaman a Gemini de verdad)
│   ├── Dockerfile            # Imagen de desarrollo
│   ├── Dockerfile.prod       # Imagen de producción
│   ├── requirements.txt      # Dependencias de producción
│   └── requirements-dev.txt  # Dependencias de desarrollo (pytest)
├── frontend/
│   ├── src/app/              # Páginas (Next.js, App Router): portada, perfil, propuesta, rutinas y semanas
│   ├── src/components/       # Componentes compartidos (fila de ejercicio, serie, botón de volver)
│   ├── src/lib/              # Tipos de la API y funciones de formato
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
