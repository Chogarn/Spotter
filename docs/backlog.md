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
- [x] ~~Editar la semana a mano~~: **no se hace** (decisión del usuario, 2026-10-09). El plan y la propuesta no se editan; solo se edita lo realizado, y el plan lo cambia la IA (#29). Cerrada como "no se hace" `backend` `frontend` (#13)
- [x] Registro de sesiones (API): lo realizado por serie, series y ejercicios hechos, ejercicio cerrado y reabrir, Día completado y reabrir `backend` (#14). El esfuerzo pasó a su propia tarea (#48)
- [x] Vista de planes semanales: Mis rutinas, Semana y Día `frontend` (#15)
- [x] Formulario de registro de sesión: la vista del día con Editar, Marcar como hecha y Día completado `frontend` (#16)
- [x] ~~Estado global en el frontend~~: **no se hace por ahora**. Cada pantalla pide sus datos y ninguna necesita compartir estado; se reabre si aparece un caso concreto `frontend` (#17)
- [x] Perfil del usuario (edad, peso, altura, nivel, equipamiento, limitaciones y objetivo) `backend` `frontend` (#18)
- [x] Publicación LinkedIn 2: primer avance con capturas, publicada el 2026-10-12 `docs` (#19)

## S3: Autenticación
- [x] Registro de usuario `backend` (#20)
- [x] Login con JWT: cookie httpOnly de 7 días, `/auth/login`, `/auth/logout` y `/auth/me` `backend` (#21)
- [x] Proteger rutas del backend: `get_current_user` lee la cookie y da 401 `backend` (#22)
- [x] Pantallas de registro e inicio de sesión `frontend` (#23)
- [x] Rutas protegidas en el frontend: `proxy.ts`, `apiFetch` y Cerrar sesión `frontend` (#24)
- [x] Tests básicos con pytest (auth y rutinas): 23 de autenticación y 8 del script de reclamo `backend` (#25)

## S4: IA, complementos y mejoras
- [x] Prompt y respuesta en JSON validada con Pydantic, para la primera rutina `ia` `backend` (#26). El prompt de la semana siguiente va en #27
- [x] Cerrar semana: botón con aviso de los días sin completar, sin IA `backend` `frontend` (#47)
- [x] Generar semana nueva: al continuar una rutina, la IA lee lo planificado frente a lo real de la última semana cerrada y propone la siguiente, con un resumen (antes "Cierre semanal"). Probada con Gemini real `ia` (#27)
- [x] Progreso: resumen de cada semana (días, series, kilos movidos, minutos de cardio, cómo te fue en cada ejercicio, lo que dijo la IA y el comentario), con `GET /weeks/{id}/summary` `frontend` `backend` (#28)
- [x] Progreso: gráfico de un ejercicio a lo largo de las semanas (mayor peso por semana y récord, en SVG). Depende de #28 `frontend` `backend` (#62)
- [x] ~~Ajuste conversando (regenera la semana y la guarda)~~: **no se hace por ahora** (decisión 45, 2026-10-12). Durante la semana el plan no cambia; lo que no anda se cuenta al cerrarla. Cerrada como "no se hace por ahora" `ia` (#29)
- [x] Topes de uso de Gemini (diario y por minuto) `ia` `backend` (#30)
- [x] Propuestas de la IA: ver la pendiente desde la portada (`GET /proposals/pending`) y vista previa con aceptar o descartar para "Generar rutina" `ia` `backend` `frontend` (#45). El antes y después pasó a #49
- [x] Antes y después en las propuestas de semana nueva: qué cambia, con el valor anterior y el nuevo. Depende de #27 (hecha); el ajuste (#29) se descartó por ahora `ia` `backend` `frontend` (#49)
- [ ] Nota de cómo me sentí al terminar la sesión (botones y texto). **Pospuesta**: decisión 37 `backend` `frontend` (#46)
- [x] Comentario escrito del usuario al cerrar la semana (cómo se sintió), que la IA lee al armar la semana siguiente `backend` `ia` `frontend` (#50)
- [ ] Esfuerzo por serie (1 a 10) al editar lo realizado. **Pospuesto**: decisión 37 `backend` `frontend` (#48)
- [x] Catálogo de ejercicios para la IA (RAG): la IA arma la semana solo con ejercicios de `backend/app/ai/exercises.json` (118, aprobado el 2026-10-14). Embeddings de Gemini en PostgreSQL con pgvector, recuperación por nivel y similitud, y el código rechaza lo que no esté en el catálogo. Decisión 58. Pendiente: consultar al profesor si es lo que se espera de RAG `backend` `ia` (#52)
- [ ] Semáforo de dolor (R31): zona y gravedad de 0 a 10 en la nota del día. **Pospuesto**: decisión 37; depende de #46 `backend` `frontend` `ia` (#51)
- ~~Elegir camino A o B al empezar (#43) y formulario de rutina actual, camino B (#44)~~ **No se hacen**: se descartó el camino B (decisión 40); el nivel y el objetivo se eligen al generar
- [x] Refactor y mejoras de UX: shadcn/ui y Tailwind en versión básica (sin estilos propios todavía), con componentes compartidos para el error y el recuadro de confirmación. Decisión 38; probado en una copia temporal `frontend` (#31)
- [x] Diseño "Disco" (tema): colores de los discos, fuentes Barlow y Barlow Condensed, variables de shadcn en `globals.css` y modo oscuro. Decisión 41 `frontend` (#53)
- [x] Navegación y pantalla Entrenar: barra fija abajo (Entrenar, Rutinas y Perfil), portada "Entrenar" con el próximo día y el progreso en discos, "Cerrar semana" al final de Entrenar y "Cerrar sesión" en el Perfil. Decisiones 42 y 44. Depende de #53 `frontend` (#54)
- [x] Rediseño del día, las rutinas y la propuesta: series como discos que se tocan para marcarlas, acciones chicas con íconos (lápiz, tilde, cruz, candado y tacho con confirmación) y el resumen de la IA en la propuesta. Decisiones 43 y 44. Depende de #53 `frontend` (#55)
- [x] El día con progreso, "Semana pasada" y discos a la vista: barra de progreso arriba, lo real de la última semana cerrada de la rutina en cada ejercicio (con la diferencia de peso) y discos que se marcan sin abrir. Cambio chico en `GET /weeks/{id}/days/{n}` `frontend` `backend` (#56)
- [x] Modo entrenar, un ejercicio a la vez: "Empezar día N" abre una pantalla con la serie actual en grande, "Serie hecha" y el ejercicio siguiente. "Serie hecha" guarda lo planificado (se corrige con el lápiz) y no hay reloj de descanso (decisión 46). Depende de #56 `frontend` (#57)
- [x] Día compacto, entrar al ejercicio y Entrenar al centro de la barra: la lista del día solo con nombre grande, números y discos del ejercicio en curso; tocar la tarjeta entra al ejercicio con el detalle (semana pasada, cómo hacerlo, por qué, lápiz en la esquina, reabrir y deshacer). Decisión 47 `frontend` (#58)
- [x] Reloj de descanso circular: botón redondo junto a "Serie hecha", el círculo ocupa el lugar de la serie, −15 s, +15 s y Saltar; vibra al terminar y una franja lo muestra en otras pantallas. Decisión 48. Depende de #58 `frontend` (#59)
- [x] Inicio, la página principal con sesión iniciada: saludo, "Hoy te toca", avisos y accesos rápidos; Entrenar pasa a `/entrenar` y la barra tiene cinco lugares (Progreso reservado para #28). Decisión 51 `frontend` (#60)
- [x] Revisar cómo se decide la cantidad de días por semana: **opción A**, el usuario la elige al generar (principiante 2 o 3, el resto de 2 a 6), se guarda en la rutina y se puede cambiar al continuar. Decisión 52 `ia` `backend` `frontend` (#61)
- [ ] Publicación LinkedIn 3: cómo la IA arma tu semana `docs` (#32)

> **Para la Semana 4 (idea, sin definir):** pasar la lectura de datos a Server Components de Next (cookie del usuario reenviada al backend, invalidación por etiquetas tras cada acción) y que los componentes reciban los datos como propiedades. Reemplaza la tarea #17, cerrada como "no se hace por ahora".

## S5: Calidad y despliegue
- [ ] Explicación por ejercicio ("¿por qué esto?") `ia` `complementaria`
- [x] Sustitución de ejercicios en la propuesta: botón "Cambiar ejercicio" con las alternativas del catálogo, en todos los días donde aparece y sin IA (decisión 65, 2026-10-15) `backend` `frontend`. Pendiente aparte, sin definir: cambiar un ejercicio ya aceptado en la semana activa.
- [ ] Animación de carga mientras se genera la rutina (hoy aparece solo un texto) `frontend`
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
| ~~Generar semana nueva (#27)~~ | Hecho: al continuar una rutina desde "Generar rutina", la IA lee lo real de la última semana cerrada. Probada con Gemini real | — |
| Nota de cómo me sentí (#46), pospuesta | Al tocar "Día completado" en la vista del día | Nada |
| Esfuerzo por serie (#48), pospuesto | Campo opcional al tocar "Editar" en una serie | Nada |
| Semáforo de dolor (#51), pospuesto | Zona y gravedad en la nota del día, al elegir "con dolor" | #46 |
| Catálogo de ejercicios / RAG (#52), hecho | Cambia cómo se arma la propuesta al tocar "Generar rutina"; no es una pantalla | Consulta al profesor y revisión de una persona de educación física |
| Antes y después en las propuestas (#49) | En la vista previa de la propuesta (`/rutina/propuesta/{id}`) cuando es una semana nueva | Semana nueva (#27, hecha) |
| ~~Diseño "Disco", tema (#53)~~ | Hecho: toda la app: cambian colores, fuentes y formas sin cambiar qué hace cada pantalla | Nada |
| ~~Navegación y pantalla Entrenar (#54)~~ | Hecho: barra fija abajo en todas las pantallas con sesión; "Entrenar" reemplaza la portada actual | #53 |
| ~~Rediseño del día, las rutinas y la propuesta (#55)~~ | Hecho: `/semanas/{id}/dia/{n}`, `/rutinas` y `/rutina/propuesta/{id}` | #53 |
| ~~El día con progreso y "Semana pasada" (#56)~~ | Hecho: `/semanas/{id}/dia/{n}` | — |
| ~~Modo entrenar (#57)~~ | Hecho: "Empezar día N" en Entrenar, o "Entrenar serie por serie" en el día; `/semanas/{id}/dia/{n}/entrenar` | — |
| ~~Día compacto y entrar al ejercicio (#58)~~ | Hecho: `/semanas/{id}/dia/{n}` y `.../entrenar?ejercicio=K`; la barra de navegación | — |
| ~~Reloj de descanso (#59)~~ | Hecho: botón redondo junto a "Serie hecha", dentro del ejercicio; franja arriba de la barra | — |
| ~~Elegir camino A o B (#43)~~ y ~~formulario de rutina actual (#44)~~ | No se hacen: se descartó el camino B (decisión 40) | — |
| ~~Editar la semana a mano (#13)~~ | No se hace: el plan solo lo cambia la IA, con la semana nueva | — |

**Decisiones pendientes del usuario:** consultar al profesor si el RAG con pgvector de #52 es lo que se espera. (Cerradas el 2026-10-14, decisiones 59 a 64: series por ejercicio, R5b, R20/R24/R25, R30 "no implementada", avisos y ejercicios repetidos. Resueltos antes: los botones Cerrar semana y Generar, y que el plan no se edita a mano.)

## Hecho el 2026-10-14 y 15 (fuera de los issues, con su decisión)

- [x] Catálogo con RAG: 118 ejercicios, pgvector, recuperación y validación (decisión 58, #52).
- [x] Cambiar un ejercicio de la propuesta por otro del catálogo (decisión 65).
- [x] Reabrir una semana cerrada, y dos opciones claras al terminar la semana, en Entrenar e Inicio (decisión 66).
- [x] Una sola generación a la vez, pantalla de carga completa y pantalla de "aceptado" (decisión 67).
- [x] Un ícono por objetivo de rutina (decisión 68).
- [x] Evolución de cada ejercicio por fecha, acumulando todas las rutinas (decisión 69).
- [x] Pantalla del día: pasar al día anterior o al siguiente con barritas y flechas.
- [ ] Sin definir: cambiar un ejercicio ya aceptado en la semana activa (hoy solo en la propuesta).

## Anotado el 2026-10-15 (para hacer; el usuario pidió agendarlas)

Surgieron al probar los asistentes, la barra con tres botones y Inicio. Cada una dice qué está claro y qué falta decidir; **no se construyen sin que el usuario vea antes una maqueta** (reglas de trabajo del proyecto). Sin issues de GitHub todavía: se crean cuando el usuario lo confirme.

- [ ] **Rediseño de los botones y accesos al estilo Disco** `frontend`
  - **Para qué:** los accesos de Inicio ("Tus rutinas", "Nueva rutina", "Resúmenes semanales", "Estadísticas por ejercicio") y otros botones se ven genéricos frente a la estética que se fue formando (discos, tinta, píldoras, Barlow Condensed). El usuario duda de que estén de acuerdo.
  - **Alcance a revisar:** accesos de Inicio, y el botón "Nueva rutina" de Rutinas (hoy chico, arriba a la derecha; opciones mostradas el 2026-10-15: A tarjeta punteada arriba, **B botón ancho abajo, la tentativa**, C "+" flotante).
  - **A definir:** forma y jerarquía de los botones (principal, secundario, de acceso), qué ícono o disco lleva cada acceso y cuántos van por fila.
  - **Criterios:** maqueta aprobada por el usuario antes de tocar el código; mismos colores y fuentes que el resto; sin perder las etiquetas accesibles.

- [ ] **Pausar la rutina activa y ver otra, desde Rutinas** `frontend` `backend`
  - **Para qué:** poder tener otra rutina a mano sin cerrar la semana en curso, con **una sola activa a la vez**.
  - **Cómo se accede:** botón en Rutinas (en la tarjeta de la rutina o en su detalle).
  - **Depende de una decisión del usuario, todavía abierta:** hoy no se puede generar ni empezar otra rutina con una semana en curso (409). Opciones planteadas: (1) dejarlo como está; (2) crear la nueva **en espera** y activarla al cerrar la actual; (3) **pausar** la semana en curso y alternar. Recomendación de la IA: la 2, porque respeta que cerrar sea manual y que la IA analice la semana. Falta también si puede haber más de una en espera.
  - **Impacto técnico si se hace:** estado nuevo de semana en la base (migración 0019), y cambios en Rutinas, Inicio y Entrenar.

- [ ] **Estadísticas y Progreso con la estética de la app** `frontend`
  - **Para qué:** cómo se muestran lo hecho, lo no hecho, lo que se llegó y lo que no se llegó ("Cómo te fue": cuadros verde y amarillo con "superaste" y "no llegaste", frases con flechas) y el gráfico de evolución tiene una estética distinta a la del resto.
  - **Alcance:** las dos pantallas de Progreso (Resúmenes semanales y Estadísticas por ejercicio).
  - **A definir:** cómo se ven "hecho / no hecho / llegó / no llegó" con los discos y la paleta Disco (rojo hecho, verde cumplido, amarillo aviso), sin que el rojo signifique error.
  - **Criterios:** maqueta aprobada; los estados se entienden sin leer el texto.

- [ ] **Recuperar y restablecer la contraseña** `backend` `frontend`
  - **Para qué:** hoy, si alguien olvida la contraseña, no tiene cómo volver a entrar.
  - **Cómo se accede:** enlace "Olvidé mi contraseña" en el inicio de sesión.
  - **A definir:** cómo llega el enlace (correo) y con qué servicio; **verificar en la fuente oficial** si el plan gratuito del servicio alcanza antes de elegirlo; vencimiento del enlace; si cierra las sesiones abiertas.
  - **Datos:** un token de un solo uso con vencimiento, guardado hasheado. La contraseña se sigue guardando con argon2.
  - **Criterios:** el enlace funciona una sola vez y vence; la respuesta es igual exista o no el correo (no revela cuentas); tests.

- [ ] **Encabezado de Inicio: dónde va la fecha y el logo** `frontend` `docs`
  - **Para qué:** ordenar lo de arriba de Inicio ("Hola, nombre"): el usuario no sabe si la **fecha** va ahí, un poco más abajo o en otro lado, y si el **logo** va arriba del nombre, a la izquierda, o solo en Inicio.
  - **Primer paso: investigación de diseño** (referencias de apps y sitios similares, jerarquía del encabezado, uso del logo) y recién después propuesta con maquetas.
  - **A definir:** posición de la fecha, posición y tamaño del logo, y si el logo se repite en otras pantallas. El logo es **provisorio**: falta elegir el definitivo y revisar el amarillo sobre fondo claro.
  - **Criterios:** maqueta aprobada por el usuario; el encabezado no repite información de "Hoy te toca".

### Definidas el 2026-10-15 (listas para decidir y construir)

- [x] **Progreso: lo hecho frente a lo que tocaba, por ejercicio** `backend` `frontend` — **hecho el 2026-10-15**, con la decisión del usuario de comparar **contra lo planificado** (no contra la semana pasada). `GET /weeks/{id}/summary` suma `sets` (lo planificado y lo real de cada serie) y la lista plegada de "Cómo te fue" muestra "Hiciste 1 × 12 · 42,5 kg / Tocaba 1 × 10 · 40 kg" cuando difiere. Comparar contra la semana pasada (`previous`) queda como mejora posible. Plan original:
  - **Para qué:** hoy "Cómo te fue" dice solo la palabra ("superaste", "como estaba", "no llegaste"). Falta el número: cuánto subió, o cuánto faltó.
  - **Cómo se accede:** Progreso, pestaña "Resúmenes semanales" (sin pantalla nueva).
  - **Qué ve el usuario:** en cada fila del ejercicio, además del disco y la palabra, el mejor valor de la semana ("62,5 kg") y la diferencia ("+2,5").
  - **El dato que falta, con precisión:** `GET /weeks/{id}/summary` devuelve por ejercicio solo `name`, `kind` y `signal` (`ExerciseResultOut`). Para mostrar el número hay que sumar, por ejercicio:
    - `unit`: `"kg"`, `"reps"`, `"s"` o `"min"` (la misma que ya usa `GET /exercises/{id}/history`, según el tipo de ejercicio).
    - `best`: el mejor valor realizado esa semana (el mayor peso en un ejercicio de fuerza, repeticiones, segundos o minutos).
    - `previous`: el mejor valor de la **semana cerrada anterior** de la misma rutina (nulo si no hay).
    - Opcional, `planned`: el valor planificado (el mismo cálculo que ya usa `signal`).
  - **Qué ya existe:** el mejor valor por semana y por ejercicio se calcula en `GET /exercises/{id}/history` (decisión 69) y lo planificado frente a lo real, en `ai/history.py`. No hace falta tabla ni migración: es leer y devolver lo que ya se calcula.
  - **Decisión pendiente del usuario:** la diferencia, ¿contra **la semana pasada** (progreso real) o contra **lo planificado** (coincide con la señal)? Recomendación: contra la semana pasada, y la palabra ("superaste") sigue diciendo lo de lo planificado.
  - **Criterios de aceptación:** el endpoint devuelve `unit`, `best` y `previous`; un ejercicio sin semana anterior no muestra diferencia; un ejercicio "sin registrar" no muestra número; las unidades se leen bien (kg, reps, s, min); tests del cálculo con y sin semana anterior.

- [x] **Calendario de entrenamientos** `backend` `frontend` — **hecho el 2026-10-15** (`GET /calendar?month=&tz=`, `Calendario.tsx`, pestaña en Progreso y acceso en Inicio; 9 tests). Queda decidido que un día reabierto no se marca.
  - **Para qué:** ver de un vistazo en qué días de la semana y del mes se entrenó, con los días entrenados marcados.
  - **Cómo se accede:** Progreso, como tercera pestaña ("Resúmenes semanales", "Estadísticas" y **"Calendario"**), en `/progreso/calendario`; y un acceso más en la sección "Tu progreso" de Inicio.
  - **Es histórico (decisión del usuario, 2026-10-15):** muestra **todo lo entrenado desde el primer día**, juntando todas las rutinas (como las Estadísticas, decisión 69). No se limita a la semana ni a la rutina en curso.
  - **Qué ve el usuario:** un mes en cuadrícula de 7 columnas (lunes primero), con un **disco verde** en cada día en que completó un día de entrenamiento, el día de hoy con **aro azul**, y el nombre del mes con flechas para pasar al anterior o al siguiente. Se puede ir hacia atrás hasta **el mes del primer entrenamiento** (más atrás no hay nada) y no más allá del mes actual. Arriba del mes, un contador: cuántos días entrenó ese mes y en total.
  - **Acciones:** pasar de mes; tocar un día marcado para ver debajo qué se hizo ese día ("Día 2 · Cuerpo completo B", la rutina y la semana), con enlace al día. Solo lectura.
  - **Vista y componentes:** una página `progreso/calendario/page.tsx`, un componente `Calendario.tsx` (la cuadrícula) y se reutiliza `Disco` y `Flecha`; las pestañas se agregan en `PestanasProgreso.tsx`.
  - **Datos:** ya existen. `workout_sessions.finished_at` es cuándo tocó "Día completado"; el día del plan, la semana y la rutina salen de `plan_days`, `week_plans` y `routines`. Falta un endpoint de lectura, por ejemplo `GET /calendar?month=2026-10`, que devuelve las sesiones terminadas del mes (fecha y hora, `week_id`, `day_index`, título, nombre de la rutina) y, junto con eso, `first_month` (el mes del primer entrenamiento, para saber hasta dónde se puede retroceder) y `total_days` (los días entrenados en total). Se pide un mes por vez, así que el historial largo no pesa. Sin migración.
  - **Cuidado con la zona horaria:** `finished_at` se guarda con zona horaria y el perfil no guarda la del usuario. Una sesión terminada a las 22:00 en Argentina cae en el día siguiente en UTC. Propuesta: el endpoint devuelve el instante tal cual y **el navegador agrupa por día local**.
  - **Decidido por el usuario (2026-10-15):**
    - **Qué cuenta como "entrenó":** el día en que tocó **"Día completado"** (`finished_at`), no la primera serie.
    - **Dos días completados el mismo día del calendario:** se ve **un solo marcado**; son los días en que fue al gimnasio.
    - **El calendario no depende del plan:** el "Día 1" de una rutina puede ser cualquier día de la semana, no necesariamente el lunes. Por eso el calendario muestra fechas reales y no intenta ubicar "Día 1, Día 2" en lunes, martes, etc.
  - **Todavía a decidir:** si un día reabierto deja de marcarse (propuesta: sí, porque `finished_at` vuelve a quedar vacío).
  - **Criterios de aceptación:** un día completado aparece marcado en su fecha local; se puede retroceder hasta el mes del primer entrenamiento y no más; una sesión de una rutina vieja o ya terminada también aparece; dos días completados el mismo día se marcan una sola vez; un día reabierto no aparece; las sesiones de otro usuario no aparecen; el cambio de mes funciona y no pide más de un mes por vez; el día de hoy se distingue; tests del endpoint (mes con y sin sesiones, borde de mes y zona horaria).

## Ideas para después (fuera del MVP, sin definir)

Ideas anotadas durante el diseño. No son tareas todavía: antes de convertirlas en issues hay que definirlas (qué ve el usuario, qué acciones tiene, criterios de aceptación).

- **Sistema de rachas por día, semana y mes.** Premiar la constancia, apoyado en el botón "Día completado" (sesión terminada) para que el usuario sienta satisfacción y motivación.
  - A definir: qué cuenta como día cumplido, como semana cumplida y como mes cumplido; qué rompe una racha; dónde se muestra.
  - Punto a decidir: la racha diaria debería contar los **días planificados**, no los días del calendario, para que un día de descanso no la rompa.
  - Se podría calcular con datos que ya existen (sesiones terminadas y series reales), sin tablas nuevas.
- **Calendario de entrenamientos** (idea del usuario, 2026-10-15; **ya definida como tarea**, ver "Definidas el 2026-10-15"). Un calendario donde se ven marcados los días en que se entrenó, para ver de un vistazo qué días de la semana (y del mes) se cumplió.
  - Los días del plan se llaman "Día 1, Día 2" y no son del calendario (decisión de producto); el calendario mostraría las **fechas reales** en que se completó cada día (`workout_sessions.finished_at`, que ya se guarda), sin cambiar ese criterio.
  - A definir: dónde vive (una tercera pestaña de Progreso, o en Inicio), si es vista de semana, de mes o las dos, cómo se marca un día entrenado (con el disco verde de "completado", igual que en el resto) y qué muestra al tocar un día (qué día del plan fue y cuánto duró).
  - Punto a decidir: qué hacer con un día completado que se reabrió después, y con dos días completados el mismo día del calendario.
  - Se puede construir con datos que ya existen, sin tablas nuevas ni IA; lo nuevo sería un endpoint de lectura de las fechas. Se relaciona con la idea de rachas (arriba): el calendario sería su vista natural.
- **Logros y récords personales** (relacionado con las rachas): marcas como "mejor peso en press banca".
- **Entrada por voz** para contar cómo se sintió el usuario (hoy solo texto y botones rápidos).
- **Notificaciones al usuario.** Avisos que ayudan a seguir el plan, por ejemplo: "Hoy te toca el Día 3", "Tenés pendiente el Día 2" o "Te salteaste el Día 4".
  - A definir: por qué canal llegan (dentro de la app, correo, avisos del navegador o del celular), cuándo se envían, qué eventos las disparan y cómo se desactivan.
  - Punto a decidir: respetar el control del usuario. Como el cierre de la semana es manual y los días se llaman "Día 1, Día 2" (no lunes ni martes), los avisos deberían **sugerir** ("completaste todos los días, ¿cerrar la semana?") y nunca hacer nada solos.
  - Se podrían calcular con datos que ya existen (el plan activo y las sesiones terminadas); lo nuevo sería el envío y las preferencias del usuario.
- **Ideas que surgieron el 2026-10-13, sin definir ni decidir** (el usuario las dejó para después):
  - **Un color por objetivo de la rutina** (fuerza rojo, masa azul, perder grasa amarillo, condición general verde, mantenerme activo gris), siempre como **anillo** (disco hueco) y nunca como relleno, para no chocar con el rojo y el verde de los estados (decisión 49). Se vería en el disco que asoma en las franjas, en Rutinas, en el reloj y en las barras de progreso.
  - **Preguntar al tocar "Día completado" con ejercicios sin registrar:** "¿Los hiciste como estaban planificados?", con "Sí, marcar todo" o "No, completar igual". Surgió al probar: una semana con los días completados pero sin series llega a la IA y a Progreso como "sin registrar".
  - **PWA (instalable) y despliegue:** `app/manifest.ts` con nombre, ícono (propuesta: disco rojo sobre tinta) y `display: "standalone"` para abrirla sin la barra del navegador; requiere HTTPS al publicar (S5). Para tiendas: Google Play con una TWA (PWABuilder) es un paso chico; la App Store necesita Capacitor y puede rechazarla. Costos de las tiendas sin verificar.
  - **Evitar el cartel de traducción de Chrome** con `<meta name="google" content="notranslate">`.
- **Reloj o cronómetro en el día de entrenamiento** (idea del usuario, 2026-10-12). **Ya es tarea: #59** (decisión 48, reloj de descanso circular); lo que sigue queda como historial de la idea. Para controlar el **descanso entre series** y el **tiempo de los ejercicios isométricos** (plancha) sin salir de la pantalla del día.
  - **Lo activa el usuario** (decisión del usuario): el reloj nunca arranca solo ni se dispara al marcar una serie como hecha; el usuario lo inicia con un botón cuando quiere usarlo.
  - A definir: si es una cuenta regresiva que arranca con el descanso del ejercicio (`rest_seconds`) o con los segundos de la serie isométrica (`duration_seconds`), un cronómetro libre, o las dos; qué pasa al llegar a cero (aviso sonoro o vibración, pasar a la serie siguiente); y si lo medido en un isométrico se guarda como lo realizado.
  - Punto a decidir: dónde vive. En la fila de cada serie (un botón por serie) o como una barra fija al pie del día, que sirve para todas.
  - Detalle técnico a tener en cuenta: en el celular, la pantalla se apaga y el navegador pausa los temporizadores; el tiempo debería calcularse con la hora de inicio y no contando segundos, y el sonido o la vibración necesitan un permiso del navegador.
  - Se podría construir con datos que ya existen (`plan_exercises.rest_seconds` y `plan_sets.duration_seconds`), sin tablas nuevas ni llamadas a la IA.
