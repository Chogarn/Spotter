# Spotter

> Un entrenador que mira tu progreso real y te arma la semana siguiente.

Spotter es una aplicación web para quienes entrenan solos en el gimnasio. El usuario registra sus sesiones y, al cerrar cada semana, una IA analiza su historial y le arma la semana siguiente: qué subir, qué mantener y qué cambiar.

> Estado: planificación (semana 1). Este README se irá completando durante el desarrollo.

## Problema

Quien entrena solo no sabe cuándo subir el peso, cuándo cambiar un ejercicio ni cuándo acumula fatiga. Sin un entrenador, la rutina queda igual durante meses y el progreso se estanca.

## Usuario

Personas que entrenan por su cuenta (de principiante a intermedio) y no pueden pagar un entrenador personal.

## Solución

El usuario registra cada sesión (peso, repeticiones y esfuerzo percibido). Al cerrar la semana, Spotter analiza ese historial y genera la semana siguiente, que se puede ajustar conversando con la IA.

## Funcionalidades

### Base
- Registro e inicio de sesión (JWT).
- Perfil: objetivo, nivel, días disponibles, equipamiento y limitaciones.
- Catálogo de ejercicios (tabla fija; la IA elige solo de ahí).
- Crear y editar rutinas.
- Registro de sesiones: peso, repeticiones y esfuerzo (1 a 10).

### Valor de la IA
La IA trabaja sobre los datos del usuario y cada interacción modifica la aplicación; no es un chat genérico.

1. **Cierre semanal:** analiza el historial y devuelve qué subir, qué mantener, qué cambiar por estancamiento y dónde hay fatiga. Genera la semana siguiente y un resumen de evolución.
2. **Ajuste conversando:** "solo puedo 3 días", "no tengo esa máquina", "me molesta el hombro". La IA regenera la semana y el cambio queda guardado en la rutina.
3. **Explicación por ejercicio:** botón "¿por qué esto?" con la razón basada en los números del usuario.
4. **Sustitución:** el usuario rechaza un ejercicio y elige entre 2 alternativas equivalentes del catálogo.

### Fuera del alcance del MVP
Nutrición, wearables, video y consejos médicos. La app mostrará un aviso legal visible.

## Tecnologías

| Tecnología | Para qué se usa |
|---|---|
| FastAPI | API del backend en Python; genera la documentación (`/docs`) automáticamente |
| Pydantic | Valida los datos del usuario y las respuestas de la IA antes de guardarlas |
| SQLAlchemy / SQLModel | Trabajar con la base de datos usando clases de Python |
| PostgreSQL | Base de datos relacional |
| Alembic | Migraciones: versiona los cambios de estructura de la base de datos |
| JWT | Autenticación de usuarios |
| Next.js + TypeScript | Frontend |
| pytest | Tests automáticos del backend |
| Docker Compose | Entornos de desarrollo y producción en contenedores |
| Gemini | IA: plan gratuito, respuestas en JSON, con topes de uso diarios y por minuto |
| Vercel + Render/Railway | Deploy (a confirmar según los planes gratuitos vigentes) |

## Estructura de carpetas

```
spotter/
├── backend/        # API FastAPI (app/, tests/, Dockerfile)
├── frontend/       # Next.js + TypeScript (src/, Dockerfile)
├── docs/           # Documentación y backlog
├── .env.example    # Variables de entorno de ejemplo
└── README.md
```

Los archivos `docker-compose.dev.yml` y `docker-compose.prod.yml` se agregan en la semana 1.

## Cómo levantar el proyecto

A completar en la semana 1, cuando estén listos los archivos de Docker Compose.

Variables de entorno: copiar `.env.example` a `.env` y completar los valores. El archivo `.env` no se sube al repositorio.

## Plan de 6 semanas

| Semana | Objetivo | Contenido |
|---|---|---|
| S1 | Planificación y setup | Idea, repo, backlog en GitHub Projects, Docker dev/prod, esqueleto, modelo de datos |
| S2 | Core | Catálogo de ejercicios, rutinas, registro de sesiones, vistas, API REST |
| S3 | Autenticación | Registro/login JWT, rutas protegidas, tests básicos |
| S4 | IA | Cierre semanal con IA, ajuste conversando, límites de uso |
| S5 | Calidad y deploy | Explicación y sustitución, deploy en producción, tests, README completo |
| S6 | Demo Day | Video demo, post final y plan a 30 días |

El detalle de tareas y las publicaciones de LinkedIn están en [`docs/backlog.md`](docs/backlog.md).
