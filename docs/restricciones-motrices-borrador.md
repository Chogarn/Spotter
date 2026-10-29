# Restricciones motrices: plan (borrador)

**Estado: DESCARTADO, fuera del alcance de la app (decisión 105, 2026-10-29).** Queda solo como referencia. Texto original: borrador para decidir, sin construir (2026-10-16). Nada de esto está en la app. Las reglas que aparecen acá son **propuestas** y necesitan tu aprobación, como todas (hoy están aprobadas solo R1 a R36).

**Por qué hace falta.** Hoy lo que la persona escribe en "limitaciones" viaja a la IA como texto y el prompt le pide "evitá los ejercicios que las carguen". Pero el mismo prompt le exige cubrir los 6 grupos grandes (cuádriceps, isquios y glúteos incluidos) con 10 a 20 series por grupo. Las dos órdenes chocan y el código no tiene cómo resolverlo: la búsqueda del catálogo ignora las limitaciones a propósito. Resultado posible: alguien en silla de ruedas recibe prensa de piernas.

**Principio.** *Lo que se marca en un casillero lo hace cumplir el código; el texto libre solo informa a la IA.* El código bloquea en tres lugares: lo que se le muestra a la IA, lo que se acepta de vuelta (como hoy con los ejercicios fuera del catálogo) y las alternativas de "Cambiar ejercicio".

**Aviso.** No es consejo médico. Una persona con formación en educación física o en rehabilitación tiene que revisar las reglas y las etiquetas antes de usarlas.

---

## 1. Qué dicen las fuentes (poco, y hay que leerlo con cuidado)

| Fuente | Qué aporta | Límite |
|---|---|---|
| [OMS 2020, guías de actividad física](https://pmc.ncbi.nlm.nih.gov/articles/PMC7719906/) (en su borrador, adultos con discapacidad) | Fuerza al menos 2 días por semana trabajando los grandes grupos musculares, y aeróbico de 150 a 300 minutos; adaptado a la capacidad de cada persona | La frase de discapacidad la leí en el **borrador**; hay que confirmarla en el texto final |
| [NCHPAD, entrenamiento sentado](https://www.nchpad.org/resources/upper-body-workout-for-wheelchair-users-seated-strength-training/) y [lesión medular](https://www.nchpad.org/resources/spinal-cord-injury/) | Usuarios de silla: 3 días por semana sin repetir el mismo grupo en días seguidos, empuje **y** tirón, y fortalecer hombro posterior y espalda alta para cuidar los hombros; bandas elásticas sirven sentado | Son recursos prácticos, **no guías clínicas** |
| Brazo o mano: **no encontré nada** | Una búsqueda específica no devolvió guías sobre amputación o pérdida de un miembro superior | Hay que buscar aparte (carga de un solo lado, prótesis, equilibrio del hombro) o consultar a un profesional |

Conclusión: para silla de ruedas hay apoyo razonable; para un brazo o una mano, hoy **no tenemos fuente**, y cualquier regla sería de diseño.

---

## 2. Restricciones a considerar

Redacción de los casilleros pensada para decir lo que la persona **no puede hacer**, sin etiquetas médicas. Cada una dice qué bloquea y qué le falta al catálogo para que se pueda cumplir.

| # | Casillero propuesto | Qué se bloquea | Se puede con el catálogo de hoy | Qué falta |
|---|---|---|---|---|
| 1 | **No puedo usar las piernas** (silla de ruedas, parálisis, amputación de ambas) | Los 39 ejercicios de tren inferior (`region = lower`) y el cardio que usa las piernas | **Sí** | Decidir el cardio (ver 3) |
| 2 | **No puedo estar de pie** (o necesito entrenar sentado) | Ejercicios que solo se hacen de pie | **No** | Etiqueta nueva `posture` (de pie, sentado, acostado, cualquiera) en los 118 |
| 3 | **No puedo usar un brazo** (amputación, parálisis, hemiplejía); con el lado izquierdo o derecho | Ejercicios que exigen los dos brazos (barra, dominadas, flexiones...) | **No** | Etiqueta nueva `bilateral` y revisar cuáles se pueden hacer con un brazo |
| 4 | **No puedo agarrar bien con una mano o las dos** (sin dedos, sin mano, parálisis de agarre) | Ejercicios con mucha demanda de agarre (dominadas, remo con barra, peso muerto...) | **No** | Etiqueta nueva `grip_demand` (alto, bajo); ver ganchos o muñequeras |
| 5 | **Una articulación con limitación** (hombro, rodilla, cadera, espalda baja) | Ejercicios que la cargan | **Parcial**: por músculo (hombros) sí; por articulación no | Etiqueta nueva `joint_load` |
| 6 | **Equilibrio o coordinación limitados** (esclerosis múltiple, parálisis cerebral, ataxia) | Ejercicios libres o inestables (peso libre sobre la cabeza, unipodales) | **No** | Etiqueta nueva `stability_demand` |
| 7 | **Fatiga o espasticidad** | No se bloquea: se **ajusta** (menos volumen, descansos más largos) | — | Reglas de ajuste, no de bloqueo (fase posterior) |

Quedan fuera de este plan: discapacidad visual o auditiva y las condiciones médicas que no son motrices.

---

## 3. Reglas propuestas (todas de diseño, salvo lo indicado)

| # | Regla | Base |
|---|---|---|
| R37 | **Bloqueo por restricción.** Cada casillero marcado bloquea los ejercicios que corresponden, en el prompt, en la validación y en "Cambiar ejercicio". La IA no puede devolver uno bloqueado: el código lo rechaza y reintenta | Diseño |
| R38 | **Lo bloqueado no cuenta para los mínimos.** Los grupos que no se pueden entrenar salen de R1 y de R3 (y de los volúmenes por objetivo), y se avisa cuáles quedaron afuera | Diseño; apoyada en que la OMS pide adaptar a la capacidad de cada persona |
| R39 | **Equilibrio de empuje y tirón** cuando solo se entrena el tren superior: al menos tanto tirón como empuje, con trabajo de hombro posterior y espalda alta | NCHPAD (recurso práctico, no guía clínica). Certeza media-baja |
| R40 | **Cardio bloqueado.** Si la restricción deja sin cardio posible, no se exige R17 y se avisa "no hay cardio disponible con tu restricción". Cardio de brazos se agrega al catálogo más adelante (ergómetro de brazos) | Diseño. La OMS pide 150 a 300 minutos aeróbicos |
| R41 | **Frecuencia sin repetir grupos.** Con 3 o más días de fuerza y tren superior solamente, el mismo grupo no se repite en días seguidos | NCHPAD para lesión medular. Certeza baja |
| R42 | **Cada casillero se explica en pantalla**: qué se va a evitar y qué no se puede garantizar. El aviso legal aplica | Diseño |

R38 es la importante: sin ella, el código seguiría avisando "faltan series de cuádriceps" a alguien que no puede entrenarlos.

---

## 4. Cómo podría verse en el perfil (a decidir con maqueta)

- **A. Paso nuevo del asistente**, antes de "limitaciones": "¿Hay algo que no puedas hacer?" con los casilleros, y el texto libre actual debajo ("Contanos más"). Es lo más visible y evita olvidarlo.
- **B. Tarjeta "Restricciones" en el Perfil**, con un lápiz como las otras. Más prolijo, pero fácil de no ver al registrarse.
- **Brazo o mano:** una segunda pregunta chica "¿Cuál?" (izquierdo, derecho) cuando se marca.
- **Cuando se cambia una restricción**, la semana en curso **no se toca**: se aplica a la próxima propuesta, como todo lo que cambia el plan (la IA propone, vos decidís).

---

## 5. Qué habría que construir

1. **Perfil:** campo nuevo `profiles.restrictions` (lista de valores fijos), migración, el paso o la tarjeta, y el cambio en la API.
2. **Catálogo:** las etiquetas nuevas de la tabla 2, revisadas por una persona con formación (118 ejercicios), y ejercicios nuevos adaptados (ergómetro de brazos, trabajo con bandas, versiones sentadas).
3. **Código de la IA:** el filtro en `retrieve.py`, una regla de rechazo en `rules.py`, el filtro de "Cambiar ejercicio", los mínimos que se adaptan (R38) y el texto del prompt.
4. **Pruebas:** que nunca salga un ejercicio bloqueado, que los mínimos se adapten, que "Cambiar ejercicio" respete el bloqueo y que el cardio bloqueado avise.

---

## 6. Fases propuestas

| Fase | Contenido | Depende de |
|---|---|---|
| **1** | Casillero **"No puedo usar las piernas"** con R37, R38 y R40, sobre las etiquetas que ya existen. Paso en el perfil | Tu aprobación; decidir el cardio |
| **2** | Etiquetas `posture`, `bilateral` y `grip_demand` en el catálogo, y los casilleros 2, 3 y 4 | Revisión por una persona con formación; búsqueda de fuentes para brazo y mano |
| **3** | Articulaciones (5), equilibrio (6) y ajustes de fatiga (7) | Lo anterior |

---

## 7. Decisiones abiertas (para cuando vuelvas)

1. ¿Arrancamos por la **fase 1** (solo piernas) o querés pensar ya el perfil completo?
2. **Cardio sin piernas:** ¿se bloquea todo, o dejamos la natación y el remo (que no sé si corresponden) hasta que una persona con formación lo defina?
3. **Perfil:** ¿paso del asistente (A) o tarjeta en el Perfil (B)?
4. **Brazo o mano:** ¿buscamos fuentes antes de construirlo, o lo dejamos como regla de diseño marcada como tal?
5. **Texto de los casilleros:** ¿te sirven estas palabras o preferís otras?
6. ¿Quién revisa las reglas y el catálogo? (es la misma persona con formación en educación física que ya está pendiente para las reglas R1 a R36).
