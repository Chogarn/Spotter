# Modelo de datos de Spotter

Este documento define las tablas de la base de datos (PostgreSQL). Parte del flujo descrito en [`flujo-app.md`](flujo-app.md) y es la base para los modelos de SQLAlchemy y las migraciones de Alembic.

## Estado de implementación

Las migraciones de Alembic crean estas tablas por etapas:

| Migración | Tablas | Estado |
|---|---|---|
| `0001` núcleo | `users`, `profiles`, `exercises`, `week_plans`, `plan_days`, `plan_exercises`, `workout_sessions`, `set_entries` | Implementada |
| `0002` fin de sesión y cierre de semana | Agrega `week_plans.closed_at` y `workout_sessions.finished_at` | Implementada |
| `0003` series planificadas e indicaciones | Crea `plan_sets`; agrega `plan_exercises.execution_notes` y `set_entries.plan_set_id`; quita `sets`, `reps` y `target_weight_kg` de `plan_exercises` | Implementada |
| `0008` etiquetas de ejercicio | Agrega a `exercises` las etiquetas cerradas de R13: `region`, `direction`, `primary_muscle`, `secondary_muscles`, `mechanic`, `equipment` y `level` | Implementada |
| `0007` descanso y movilidad | Agrega `plan_exercises.rest_seconds` (descanso entre series) y `plan_days.mobility_notes` (texto de movilidad y equilibrio) | Implementada |
| `0006` sin duración de sesión en el perfil | Quita `profiles.session_minutes`: la duración de la sesión la determina la IA | Implementada |
| `0005` sin días por semana en el perfil | Quita `profiles.days_per_week` y su restricción: la cantidad de días se calcula a partir de `plan_days` | Implementada |
| `0004` cardio con duración | Agrega `exercises.kind` y `duration_minutes` en `plan_sets` y `set_entries`; hace opcionales `reps` (en ambas) y `set_entries.weight_kg`; agrega la restricción "repeticiones o minutos" | Implementada |
| `0009` IA | Crea `plan_proposals` y `ai_calls` (los topes de Gemini se calculan contando `ai_calls`, que no se borra) | Implementada |
| `0010` isométricos | Agrega `exercises.kind = isometric` y `duration_seconds` en `plan_sets` y `set_entries`; la restricción pasa a "repeticiones, minutos o segundos (exactamente una)" | Implementada |
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
    PLAN_EXERCISES ||--o{ PLAN_SETS : "se divide en"
    PLAN_SETS |o--o{ SET_ENTRIES : "se compara con"
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
        string kind
        string region
        string direction
        string primary_muscle
        json secondary_muscles
        string mechanic
        string equipment
        string level
        datetime created_at
    }
    WEEK_PLANS {
        int id PK
        int user_id FK
        date week_start
        datetime closed_at
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
        text mobility_notes
    }
    PLAN_EXERCISES {
        int id PK
        int plan_day_id FK
        int exercise_id FK
        int position
        text execution_notes
        int rest_seconds
        text reason
        bool edited_by_user
    }
    PLAN_SETS {
        int id PK
        int plan_exercise_id FK
        int set_number
        int reps
        int duration_minutes
        int duration_seconds
        decimal target_weight_kg
    }
    WORKOUT_SESSIONS {
        int id PK
        int user_id FK
        int plan_day_id FK
        datetime performed_at
        datetime finished_at
        string feeling
        text notes
    }
    SET_ENTRIES {
        int id PK
        int session_id FK
        int plan_exercise_id FK
        int plan_set_id FK
        int exercise_id FK
        int set_number
        int reps
        int duration_minutes
        int duration_seconds
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
| *(sin días ni duración)* | **El perfil no tiene "días por semana" ni "duración de la sesión"**: los determina la IA. La cantidad de días se calcula con `plan_days` |
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
| kind | `strength` (series y repeticiones), `cardio` (minutos) o `isometric` (segundos, como la plancha). Por defecto `strength` |
| region | `upper`, `lower`, `core` o `full_body` (cardio y cuerpo entero) |
| direction | `push`, `pull` o `none` (piernas, core y cardio) |
| primary_muscle | `chest`, `back`, `shoulders`, `biceps`, `triceps`, `quadriceps`, `hamstrings`, `glutes`, `calves`, `core` o `full_body` |
| secondary_muscles | Lista de músculos secundarios (los mismos valores). Vacía por defecto. Se cuenta a 0,5 (R5). La valida Pydantic, no la base |
| mechanic | `compound` (multiarticular) o `isolation` (monoarticular) |
| equipment | `barbell`, `dumbbell`, `machine`, `cable`, `bodyweight`, `band`, `kettlebell` u `other` |
| level | `principiante`, `intermedio` o `avanzado` |

Las etiquetas son **obligatorias** y las asigna la IA; el código las valida (R13) y la base rechaza cualquier valor fuera de las listas. Con ellas se cuentan las series por músculo (R3, R20, R24, R25), las indirectas (R5) y el equilibrio entre tirón y empuje (R14).

### week_plans
Un plan por semana. Las semanas anteriores se conservan como historial. La semana se cierra **a mano**, con un botón; nunca se genera sola por fecha.

| Campo | Detalle |
|---|---|
| week_start | Cuándo el usuario activó la semana. No tiene que ser un lunes: la semana es un ciclo |
| closed_at | Cuándo el usuario la cerró con el botón. Vacío mientras sigue abierta |
| status | `draft`, `active` o `closed` |
| origin | `generated` (camino A) o `improved` (camino B) |
| original_routine | JSON con la rutina que cargó el usuario; solo en el camino B |
| ai_summary | Resumen de evolución que genera la IA al cerrar la semana |

### plan_days
Días de entrenamiento de una semana. `day_index` va de 1 a 7 y es el **orden** dentro de la semana ("Día 1", "Día 2"...), no un día del calendario. `title` describe el foco del día (por ejemplo, "Pecho y tríceps").

| Campo | Detalle |
|---|---|
| mobility_notes | Texto opcional con la **movilidad y el equilibrio** del día (por ejemplo, "5 a 10 min de movilidad de cadera"). Es una indicación de texto, editable por el usuario; no se registra serie por serie (R26) |

### plan_exercises
Lo **planificado**: qué ejercicio toca hacer en cada día. Las series, repeticiones y pesos no están acá: están en `plan_sets`.

| Campo | Detalle |
|---|---|
| position | Orden dentro del día |
| rest_seconds | **Descanso entre series, en segundos.** Campo propio y editable: la IA lo propone (R8) y el usuario lo puede cambiar. Opcional; no puede ser negativo |
| execution_notes | Indicaciones de ejecución propias de esta rutina (ritmo, pausas, técnica), por ejemplo "bajar lento, pausa de 2 segundos arriba". Opcional |
| reason | Explicación de la IA ("¿por qué esto?") |
| edited_by_user | `true` si el usuario cambió el ejercicio o alguna de sus series a mano; la IA lo respeta |

### plan_sets
Una fila por **serie planificada**. Permite que cada serie tenga sus propias repeticiones y su propio peso (por ejemplo 10 × 50, 8 × 55, 6 × 60, 4 × 65).

| Campo | Detalle |
|---|---|
| plan_exercise_id | Ejercicio planificado al que pertenece (se borra en cascada) |
| set_number | Número de serie. **Único** dentro de cada ejercicio |
| reps | Repeticiones planificadas. Vacío en cardio |
| duration_minutes | Minutos planificados. Solo en cardio |
| duration_seconds | Segundos planificados. Solo en ejercicios isométricos |
| target_weight_kg | Peso planificado en kilos. Vacío en ejercicios con peso corporal y en cardio |

La base exige que cada serie tenga **una sola medida**: repeticiones, minutos o segundos (nunca dos ni ninguna).

El resumen "4 × 10 con 50 kg" **se calcula** a partir de estas filas, no se guarda: si las series son iguales se muestra así, y si difieren se muestra un rango ("10 a 4 reps · 50 a 65 kg").

### workout_sessions
Una sesión de entrenamiento realizada.

| Campo | Detalle |
|---|---|
| plan_day_id | Día del plan que se entrenó (opcional) |
| performed_at | Cuándo se empezó |
| finished_at | Cuándo el usuario tocó "Día completado". Vacío mientras la sesión está en curso; volver a dejarlo vacío la reabre |
| feeling | `easy`, `good`, `hard` o `pain` |
| notes | Texto libre opcional ("cómo me sentí") |

### set_entries
Lo **real**: cada serie que el usuario hizo.

| Campo | Detalle |
|---|---|
| plan_exercise_id | Ejercicio planificado al que corresponde (opcional) |
| plan_set_id | Serie planificada con la que se compara. Vacío en las series extra que no estaban en el plan |
| exercise_id | Ejercicio realizado |
| set_number | Número de serie |
| reps | Repeticiones realizadas. Vacío en cardio |
| duration_minutes | Minutos realizados. Solo en cardio |
| duration_seconds | Segundos realizados. Solo en ejercicios isométricos |
| weight_kg | Peso en kilos. Vacío en ejercicios con peso corporal y en cardio |

Igual que en `plan_sets`, la base exige una sola medida: repeticiones, minutos o segundos.
| effort | Esfuerzo de 1 a 10 (opcional) |

### plan_proposals
Lo que propone la IA antes de aplicarse.

| Campo | Detalle |
|---|---|
| kind | `adjust`, `week_close`, `improve` o `repeat_exercise` |
| request_text | Pedido del usuario, si lo hubo ("no tengo esa máquina") |
| proposed_changes | JSON con los cambios, validado con Pydantic. En `generate` tiene dos claves: `routine` (la semana completa: días, ejercicios, series) y `warnings` (lista de `{rule, message}` con los avisos del código: volumen, duración) |
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
7. **La semana es un ciclo que el usuario cierra.** `closed_at` queda vacío hasta que el usuario toca "Cerrar semana". Se puede cerrar con días sin hacer: esos días se cuentan como no hechos y viajan a la IA como información.
8. **Los días se llaman Día 1, Día 2.** `day_index` es un orden, no un día de la semana, así que la semana se puede correr sin que nada se rompa.
9. **La sesión se cierra con un botón.** `finished_at` distingue una sesión en curso de una terminada, y permite reabrirla. Los datos se guardan a medida que se cargan, no recién al terminar.
10. **Las series se guardan una por una.** `plan_sets` tiene una fila por serie planificada, así cada serie puede tener sus propias repeticiones y su propio peso, y se compara serie por serie con lo realizado (`set_entries.plan_set_id`). Con una sola fuente de verdad no hay dos lugares que puedan contradecirse.
11. **Las indicaciones de ejecución son de la rutina.** `execution_notes` vive en el ejercicio planificado, no en el ejercicio general: el usuario la escribe o la edita, y la IA puede proponerla.
12. **El cardio es un ejercicio con duración.** No hay una tabla aparte: un ejercicio de cardio es un `exercises` con `kind = cardio` y sus series se miden en `duration_minutes`. Así entra en el mismo flujo (tilde, "Día completado", planificado frente a real). La intensidad (ritmo moderado, "que puedas hablar") va en `execution_notes`.
13. **Una serie se mide en repeticiones o en minutos.** Una restricción de la base lo garantiza. Además, `set_entries.weight_kg` pasó a ser opcional, lo que también permite registrar ejercicios con peso corporal.
14. **Los días los define la rutina, no el perfil.** Por eso `profiles` ya no tiene `days_per_week`: cuántos días entrena una persona se calcula contando los `plan_days` de su semana activa.
15. **La duración de la sesión tampoco está en el perfil.** La determina la IA, igual que los días. Por eso se quitó `profiles.session_minutes`. El usuario puede pedir más (más días o sesiones más largas), nunca menos.
16. **El descanso es un campo propio y editable.** `plan_exercises.rest_seconds` guarda el descanso entre series de cada ejercicio. La IA lo propone según el tipo de ejercicio y el usuario lo cambia. Con ese dato el código podrá estimar cuánto dura una sesión.
17. **La movilidad y el equilibrio son un texto del día.** `plan_days.mobility_notes` es un texto libre, sin series ni tilde. Es lo más simple y se puede pasar a un tipo de ejercicio más adelante si hace falta registrarlos.
18. **Las etiquetas del ejercicio son obligatorias y cerradas.** Región, dirección, músculo primario, mecánica, equipamiento y nivel no admiten valores libres, y los ejercicios de cardio o de cuerpo entero usan `full_body`. Así el código puede contar series por músculo sin depender de texto libre.
19. **Los isométricos son un tipo de ejercicio con su propio valor de tiempo.** `exercises.kind = isometric` y `duration_seconds` en las series, en segundos porque una plancha dura 30 a 60 segundos. Siguen el mismo patrón que el cardio (que va en minutos). Cuentan como fuerza para los días y el volumen, y llevan las etiquetas R13 como la fuerza (la plancha: región `core`, músculo `core`), no `full_body`.
