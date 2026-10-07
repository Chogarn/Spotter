# Modelo de datos de Spotter

Este documento define las tablas de la base de datos (PostgreSQL). Parte del flujo descrito en [`flujo-app.md`](flujo-app.md) y es la base para los modelos de SQLAlchemy y las migraciones de Alembic.

## Estado de implementación

Las migraciones de Alembic crean estas tablas por etapas:

| Migración | Tablas | Estado |
|---|---|---|
| `0001` núcleo | `users`, `profiles`, `exercises`, `week_plans`, `plan_days`, `plan_exercises`, `workout_sessions`, `set_entries` | Implementada |
| Semana 4 | `plan_proposals`, `ai_calls` | Pendiente: se agregan cuando se construya la IA |
| Cuando haga falta | `body_weight_logs` | Pendiente |

## Diagrama

```mermaid
erDiagram
    USERS ||--|| PROFILES : tiene
    USERS ||--o{ BODY_WEIGHT_LOGS : registra
    USERS ||--o{ WEEK_PLANS : tiene
    USERS ||--o{ WORKOUT_SESSIONS : entrena
    USERS ||--o{ PLAN_PROPOSALS : recibe
    USERS ||--o{ AI_CALLS : genera
    WEEK_PLANS ||--o{ PLAN_DAYS : incluye
    WEEK_PLANS ||--o{ PLAN_PROPOSALS : origina
    PLAN_DAYS ||--o{ PLAN_EXERCISES : contiene
    EXERCISES ||--o{ PLAN_EXERCISES : "se planifica en"
    EXERCISES ||--o{ SET_ENTRIES : "se realiza en"
    PLAN_DAYS |o--o{ WORKOUT_SESSIONS : "se entrena como"
    WORKOUT_SESSIONS ||--o{ SET_ENTRIES : contiene
    PLAN_EXERCISES |o--o{ SET_ENTRIES : "se compara con"

    USERS {
        int id PK
        string email UK
        string password_hash
        string name
        datetime created_at
    }
    PROFILES {
        int user_id PK
        int age
        decimal weight_kg
        int height_cm
        string sex
        string level
        string goal
        int days_per_week
        int session_minutes
        string equipment
        text limitations
        datetime legal_notice_accepted_at
    }
    BODY_WEIGHT_LOGS {
        int id PK
        int user_id FK
        decimal weight_kg
        datetime logged_at
    }
    EXERCISES {
        int id PK
        string name
        string name_normalized UK
        string muscle_group
        datetime created_at
    }
    WEEK_PLANS {
        int id PK
        int user_id FK
        date week_start
        string status
        string origin
        json original_routine
        text ai_summary
        datetime created_at
    }
    PLAN_DAYS {
        int id PK
        int week_plan_id FK
        int day_index
        string title
    }
    PLAN_EXERCISES {
        int id PK
        int plan_day_id FK
        int exercise_id FK
        int position
        int sets
        int reps
        decimal target_weight_kg
        text reason
        bool edited_by_user
    }
    WORKOUT_SESSIONS {
        int id PK
        int user_id FK
        int plan_day_id FK
        datetime performed_at
        string feeling
        text notes
    }
    SET_ENTRIES {
        int id PK
        int session_id FK
        int plan_exercise_id FK
        int exercise_id FK
        int set_number
        int reps
        decimal weight_kg
        int effort
    }
    PLAN_PROPOSALS {
        int id PK
        int user_id FK
        int week_plan_id FK
        string kind
        text request_text
        json proposed_changes
        string status
        datetime created_at
        datetime resolved_at
    }
    AI_CALLS {
        int id PK
        int user_id FK
        string kind
        datetime created_at
    }
```

## Tablas

### users
Cuenta del usuario.

| Campo | Detalle |
|---|---|
| id | Clave primaria |
| email | Único |
| password_hash | Contraseña con hash, nunca en texto plano |
| name | Nombre |
| created_at | Fecha de alta |

### profiles
Datos del usuario y objetivo. Una fila por usuario.

| Campo | Detalle |
|---|---|
| user_id | Clave primaria y foránea a `users` |
| age, weight_kg, height_cm | Edad, peso corporal y altura |
| sex | Opcional; solo para ajustar cargas iniciales |
| level | `principiante`, `intermedio` o `avanzado` |
| goal | **Obligatorio.** `masa`, `fuerza`, `perder_grasa`, `condicion_general` o `mantenerme_activo` |
| days_per_week, session_minutes | Días disponibles y duración de cada sesión |
| equipment | `gimnasio`, `mancuernas` o `casa` |
| limitations | Lesiones o limitaciones (texto opcional) |
| legal_notice_accepted_at | Cuándo aceptó el aviso legal |

### body_weight_logs
Historial del peso corporal, para ver la evolución. Cuando el usuario actualiza su peso se agrega una fila y se actualiza `profiles.weight_kg`.

### exercises
Ejercicios conocidos por la app. **No hay catálogo precargado**: la tabla crece sola.

| Campo | Detalle |
|---|---|
| name | Nombre tal como lo escribió la IA o el usuario |
| name_normalized | **Único.** Minúsculas y sin tildes, para evitar duplicados |
| muscle_group | Opcional; lo propone la IA |

### week_plans
Un plan por semana. Las semanas anteriores se conservan como historial.

| Campo | Detalle |
|---|---|
| week_start | Fecha de inicio de la semana |
| status | `draft`, `active` o `closed` |
| origin | `generated` (camino A) o `improved` (camino B) |
| original_routine | JSON con la rutina que cargó el usuario; solo en el camino B |
| ai_summary | Resumen de evolución que genera la IA al cerrar la semana |

### plan_days
Días de entrenamiento de una semana. `day_index` va de 1 a 7 y `title` es el nombre del día (por ejemplo, "Pecho y tríceps").

### plan_exercises
Lo **planificado**: qué toca hacer en cada día.

| Campo | Detalle |
|---|---|
| position | Orden dentro del día |
| sets, reps | Series y repeticiones |
| target_weight_kg | Peso objetivo en kilos |
| reason | Explicación de la IA ("¿por qué esto?") |
| edited_by_user | `true` si el usuario lo cambió a mano; la IA lo respeta |

### workout_sessions
Una sesión de entrenamiento realizada.

| Campo | Detalle |
|---|---|
| plan_day_id | Día del plan que se entrenó (opcional) |
| performed_at | Cuándo se hizo |
| feeling | `easy`, `good`, `hard` o `pain` |
| notes | Texto libre opcional ("cómo me sentí") |

### set_entries
Lo **real**: cada serie que el usuario hizo.

| Campo | Detalle |
|---|---|
| plan_exercise_id | Ejercicio planificado con el que se compara (opcional) |
| exercise_id | Ejercicio realizado |
| set_number, reps, weight_kg | Número de serie, repeticiones y peso en kilos |
| effort | Esfuerzo de 1 a 10 (opcional) |

### plan_proposals
Lo que propone la IA antes de aplicarse.

| Campo | Detalle |
|---|---|
| kind | `adjust`, `week_close`, `improve` o `repeat_exercise` |
| request_text | Pedido del usuario, si lo hubo ("solo puedo 3 días") |
| proposed_changes | JSON con los cambios, validado con Pydantic |
| status | `pending`, `accepted` o `discarded` |
| resolved_at | Cuándo el usuario aceptó o descartó |

### ai_calls
Una fila por cada llamada a Gemini. Los topes diario y por minuto se calculan contando estas filas.

## Decisiones de diseño

1. **Los ejercicios crecen solos.** La IA elige libremente los ejercicios. Al guardar un plan se busca el ejercicio por `name_normalized`; si no existe, se crea. Así "Press banca" y "press de banca" son el mismo ejercicio y el historial queda comparable.
2. **Planificado y real van separados.** `plan_exercises` guarda lo que toca y `set_entries` lo que se hizo. Esa diferencia es la base del análisis semanal.
3. **La IA propone y el usuario decide.** Los cambios se guardan primero en `plan_proposals` con estado `pending` y solo se escriben en `week_plans` cuando el usuario acepta.
4. **`ai_calls` no se borra.** Igual que el tope diario de Gemini, depende de contar filas; borrarlas permitiría saltearse el límite. Por eso no hay endpoint para eliminarlas.
5. **Historial de semanas.** Cada semana es un `week_plan` propio con su estado; al cerrarla pasa a `closed` y se conserva.
6. **Ediciones manuales respetadas.** `edited_by_user` evita que la IA pise los cambios que hizo el usuario al armar la semana siguiente.
