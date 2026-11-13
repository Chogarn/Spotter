# Resolver Gemini antes de publicar el aviso

*Investigación de producto del 12 de noviembre de 2026. No es asesoramiento legal: el texto propuesto es un borrador para que lo revise un abogado.*

El aviso legal de Spotter tiene que hacer bastante más que lo que hacía el borrador del 16 de octubre. Como cualquiera puede registrarse, el RGPD se aplica de lleno: vos sos el **responsable del tratamiento** y tenés que identificarte, explicar en dos capas qué datos usás, con qué base, a quién se mandan y qué derechos tiene cada persona. Además, como Spotter guarda lesiones, dolor, peso y grasa corporal, necesitás un **consentimiento explícito aparte**, en una casilla sin marcar. Lo legalmente importante cabe en cuatro lugares (pie del login y del registro, paso 7 del perfil, una fila en el Perfil y la página pública `/aviso-legal`), sumando un aviso de IA donde se genera la rutina. Pero hay un problema anterior al texto: las condiciones vigentes de la API de Gemini dicen que **solo se pueden usar servicios de pago en apps que se ofrecen a usuarios del Espacio Económico Europeo** (EEE: la UE más Noruega, Islandia y Liechtenstein). Eso choca de frente con la regla del proyecto de que la IA nunca genere costo. Mientras no lo decidas, el aviso no puede describir con honestidad cómo se usa Gemini. El resto (cookies, descargo de salud, IA, responsabilidad) se resuelve con buena redacción. Lo que necesita tu criterio es la lista de abajo.

---

## Decisiones que tenés que tomar vos

Cada punto trae las opciones sin elegir por vos. El detalle y las fuentes están en las secciones que siguen.

1. **Gemini gratis frente a usuarios del EEE.** Las condiciones dicen "You may use only Paid Services when making API Clients available to users in the European Economic Area" ([Gemini API Additional Terms](https://aistudio.google.com/docs/terms)). Opciones: (a) activar la facturación en el proyecto de Google con un tope de gasto bajo, lo que rompe la regla de "costo cero" o la obliga a cambiar a "costo acotado"; (b) cerrar Spotter al público y dejarlo solo para vos y testers invitados, cosa que también es discutible; (c) seguir en el plan gratuito sabiendo que se incumple la cláusula, con riesgo de que Google suspenda la clave (esto no es una opción de cumplimiento); (d) apagar "Generar rutina" para el público hasta resolverlo. Pase lo que pase, el aviso **no puede afirmar** que el uso gratuito cumple las condiciones de Google.
2. **"Recordarme" tildado de fábrica (decisión 98).** El criterio europeo (WP194) acepta una casilla "Recordarme" como forma de consentir la cookie de 30 días, siempre que la persona la marque ella. Una casilla premarcada no es consentimiento (sentencia Planet49). Opciones: destildarla; mantenerla y defender que la cookie es "estrictamente necesaria" (argumento débil); o mantenerla y aceptar el riesgo, que es leve.
3. **Qué datos tuyos publicar.** El RGPD exige tu identidad y un contacto: alcanza con nombre y correo. La LSSI (la ley de servicios de internet) pide además **domicilio y NIF**, pero solo si Spotter es una "actividad económica", y hay buenos argumentos de que no lo es. Opciones: nombre y correo solamente; nombre, correo y domicilio de notificaciones; o todo, NIF incluido. Además, ¿qué correo de contacto? (por ejemplo, el Gmail de Spotter).
4. **Edad mínima: 14 o 18.** En España se consiente solo desde los 14 (art. 7 LOPDGDD), pero las condiciones de Gemini prohíben usar la API en apps "likely to be accessed by individuals under the age of 18" ([Gemini API Additional Terms](https://aistudio.google.com/docs/terms)). Si elegís 14, chocás con Google. Con 18 no hay choque. En los dos casos, el asistente del perfil ya pide la fecha de nacimiento y podría bloquear a quien no llegue.
5. **Consentimiento de salud aparte, y limitaciones opcionales.** Hace falta una casilla propia, sin marcar, distinta de la del aviso. Tenés que decidir: (a) si las limitaciones son opcionales (el prompt ya contempla "ninguna indicada"); (b) qué pasa si alguien no consiente, por ejemplo si puede usar Spotter sin generar rutinas; (c) si guardás la fecha y la versión de lo aceptado. Esto último exige demostrar el consentimiento (art. 7.1 RGPD) y **contradice el "sin migración" de la maqueta aprobada**.
6. **Registro de actividades (art. 30) y evaluación de impacto (EIPD, art. 35).** Con datos de salud no hay exención del registro. Spotter, además, suma al menos dos criterios de la lista de la AEPD (salud y valoración de hábitos con IA). Opciones: escribir los dos documentos ahora, cortos (unas páginas, sin publicarlos), o postergarlos sabiendo que la AEPD dice que con dos criterios la EIPD es "preceptiva".
7. **(Extra) Portabilidad.** No hay botón de "Exportar mis datos". Opciones: construirlo o prometer en el aviso que se atiende por correo dentro del mes.
8. **(Extra) Correo por Gmail personal y Vercel Hobby.** Ninguno de los dos te da un contrato de encargado (DPA) firmado. Opciones: aceptarlo y nombrarlos como destinatarios, o cambiar de proveedor de correo más adelante.

---

## El RGPD se aplica entero aunque Spotter sea gratis

La "excepción doméstica" del RGPD solo cubre actividades "exclusivamente personales o domésticas". El Tribunal de Justicia de la UE la interpreta **de forma estricta**: en Ryneš dejó afuera hasta una cámara casera que filmaba la vereda ([resumen de Ryneš](https://www.thomashelbing.com/en/wissen/llms.mdx/dsgvo-hub/rechtsprechung/1.4.20-eugh-rynes)). Una app en la nube abierta a cualquiera, que guarda datos de personas que no sos vos (ya la usó un amigo), no entra ahí. Que sea gratis o un proyecto de aprendizaje no cambia nada, porque el RGPD no exige actividad comercial ([RGPD, EUR-Lex](https://eur-lex.europa.eu/eli/reg/2016/679/oj)). En la analogía de Git: vos sos el dueño del repo y respondés por lo que entra, aunque el servidor sea de otro. Vercel, Neon y Google son los "servidores" (encargados o terceros que reciben datos).

La segunda pieza es que buena parte de lo que guarda Spotter son **datos de salud**. Las limitaciones (lesiones, patologías) y los comentarios sobre dolor o fatiga lo son sin discusión, según el art. 4.15 y el considerando 35 del RGPD. El peso y la altura sueltos están en zona gris. El Grupo del Artículo 29 (el antecesor del Comité Europeo de Protección de Datos) dijo que los datos de una app son de salud cuando, **combinados o seguidos en el tiempo**, permiten sacar conclusiones sobre el estado de salud, "sean o no exactas" ([Hunton sobre la carta del GT29](https://www.hunton.com/privacy-and-cybersecurity-law-blog/article-29-working-party-clarifies-scope-health-data-processed-lifestyle-wellbeing-apps)). Spotter calcula el IMC, guarda la grasa corporal y registra el peso semana a semana, así que lo prudente es tratarlos como datos de salud.

Eso define la base legal. Para los datos comunes (cuenta, entrenamientos), alcanza con "es necesario para darte el servicio" (art. 6.1.b). Para los de salud no: el art. 9.2 no admite esa base, y el Comité Europeo de Protección de Datos (EDPB) dice que entonces el consentimiento explícito "sigue siendo la única excepción lícita posible" ([EDPB, Directrices 05/2020](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf), párr. 99). La ley española no lo complica: el art. 9.1 de la LOPDGDD solo prohíbe que el consentimiento alcance para ideología, religión, orientación sexual y similares, y **la salud no está en esa lista** ([LOPDGDD, BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673)).

### Cómo tiene que ser la casilla de salud

El EDPB es concreto. Hace falta una **declaración expresa**, con un texto que diga "consiento el tratamiento…" y no "me queda claro que mis datos serán tratados" (ejemplo 17, párr. 96). Las **casillas premarcadas no valen**, y tampoco seguir usando la app (párr. 79). Tiene que pedirse **antes** de usar los datos (párr. 90). Si va junto a otros asuntos, tiene que distinguirse claramente de ellos (art. 7.2 RGPD). Por eso la casilla actual del paso 7, que mezcla "entiendo que no es consejo médico" con el uso de datos, **no alcanza** como consentimiento explícito. Además, hay que poder **demostrarlo** (art. 7.1) y retirarlo tan fácil como se dio (art. 7.3) ([EDPB 05/2020](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf)). El EDPB da un ejemplo que encaja con Spotter: pedir datos de salud **necesarios** para un servicio personalizado, con consentimiento explícito, es válido (párr. 102). Para que el consentimiento sea "libre", conviene que lo no imprescindible (las limitaciones) sea opcional y que el texto explique por qué hacen falta el sexo, el peso y la altura. El modelo de la industria es Strava: consentimiento aparte para los datos de salud, opcionales, y una pantalla de ajustes para retirarlo, aclarando que retirarlo no afecta lo ya tratado ([Strava Privacy Policy](https://www.strava.com/legal/privacy)).

### Edad, registro de actividades y EIPD

En España, una persona consiente sola **desde los 14 años** ([LOPDGDD art. 7](https://www.boe.es/buscar/act.php?id=BOE-A-2018-16673)), y el responsable tiene que hacer esfuerzos "razonables" y proporcionados al riesgo para comprobarlo ([EDPB 05/2020](https://www.edpb.europa.eu/system/files/documents/files/file1/edpb_guidelines_202005_consent_en.pdf), párr. 132-133). Pero Gemini exige 18 años o más tanto al desarrollador como a los usuarios probables de la app ([Gemini API Additional Terms](https://aistudio.google.com/docs/terms)), y la AEPD cuenta a los menores de 14 como "sujetos vulnerables" que suman riesgo ([lista AEPD de EIPD](https://www.aepd.es/documento/listas-dpia-es-35-4.pdf)). Bloquear en el asistente del perfil una fecha de nacimiento por debajo del mínimo es la medida razonable para un proyecto chico.

No hace falta un Delegado de Protección de Datos (DPD): solo es obligatorio en tratamientos "a gran escala" o en los casos del art. 34 de la LOPDGDD. El **registro de actividades sí**: la exención para organizaciones chicas no se aplica si hay categorías especiales (art. 30.5 RGPD). Para vos alcanza con una sola actividad, "Usuarios de Spotter", con finalidad, datos, destinatarios, transferencias, plazos y medidas de seguridad. En cuanto a la **EIPD**, la AEPD dice que es "preceptiva cuando es posible identificar dos o más factores de riesgo" ([AEPD, FAQ EIPD](https://www.aepd.es/preguntas-frecuentes/2-tus-obligaciones-como-responsable-del-tratamiento/10-evaluacion-de-impacto/FAQ-0226-en-que-supuestos-es-necesario-realizar-una-evaluacion-de-impacto)). Spotter cumple el criterio 4 (salud) y el 1 o el 10 (valorar hábitos, IA generativa) de su lista ([lista AEPD](https://www.aepd.es/documento/listas-dpia-es-35-4.pdf)). La "gran escala" casi seguro no aplica con pocos usuarios, pero la regla de los dos criterios empuja a hacer una EIPD corta. Ninguno de los dos documentos se publica: se guardan por si los pide la AEPD.

### Información en dos capas y perfiles

Cuando los datos se piden directamente a la persona, hay que darle **en ese momento** todo lo del art. 13 del RGPD: quién es el responsable y cómo contactarlo, para qué y con qué base, destinatarios, transferencias fuera de la UE y su garantía, plazos, derechos, cómo retirar el consentimiento, el derecho a reclamar ante la autoridad, si dar los datos es obligatorio y si hay perfiles. España permite hacerlo en **dos capas**: una básica junto al formulario y un enlace al resto (art. 11 LOPDGDD). La AEPD propone los epígrafes Responsable, Finalidad, Legitimación, Destinatarios, Derechos y Procedencia ([AEPD, derecho de información](https://www.aepd.es/es/derechos-y-deberes/conoce-tus-derechos/derecho-de-informacion)). Es como un `README` con un resumen arriba y un enlace a `docs/`.

Spotter **elabora perfiles**: evalúa aspectos personales como la salud o el rendimiento (art. 4.4). Pero probablemente **no toma decisiones automatizadas** en el sentido del art. 22, porque la IA propone, la persona acepta o descarta, y nada tiene efectos jurídicos. Igual hay que decirlo en la primera capa, junto con el derecho a oponerse (art. 11.2 LOPDGDD) ([RGPD](https://eur-lex.europa.eu/eli/reg/2016/679/oj)). El "nada cambia hasta que lo aceptás" de Spotter es justamente la intervención humana que lo deja fuera del art. 22.

Sobre derechos y plazos: los datos se guardan solo el tiempo necesario (art. 5.1.e). Para Spotter, eso es mientras exista la cuenta. "Borrar cuenta" ya cubre la supresión (art. 17). La **portabilidad** (art. 20) se aplica porque las bases son el consentimiento y el contrato, y hoy no hay exportación: habría que atenderla a mano dentro del mes (art. 12.3). Hay una duda que las notas no resolvieron: el art. 32 de la LOPDGDD obliga en principio a **bloquear** los datos (guardarlos apartados durante el plazo de posibles reclamos) en vez de borrarlos al instante, cosa que choca con el borrado inmediato de Spotter. No se leyó el texto del artículo, así que queda para el abogado. Los contadores de `ai_calls` sin dueño dejan de ser datos personales si no guardan nada que identifique a la persona (ni el prompt ni la IP), y conviene comprobarlo en el código.

---

## Gemini, Vercel, Neon y Gmail: lo que dicen sus condiciones

### La cláusula del EEE es el problema principal

Las condiciones adicionales de la API de Gemini, **vigentes desde el 23 de marzo de 2026**, tienen dos párrafos sobre el EEE que hacen cosas distintas. Uno, en la parte de uso de datos, protege al **desarrollador que está en el EEE**: le aplica las reglas de uso de datos del plan de pago aunque use el cupo gratuito, o sea que Google no usa sus prompts para mejorar productos. El otro, en negrita entre las restricciones de uso, mira a los **usuarios finales**: "You may use only Paid Services when making API Clients available to users in the European Economic Area, Switzerland, or the United Kingdom" ([Gemini API Additional Terms](https://aistudio.google.com/docs/terms)). Spotter es una app pública para gente en España, así que, leída al pie de la letra, usarla con el plan gratuito **incumple** la cláusula. Que la app sea gratis no importa: la cláusula mira si el servicio *de Gemini* es pago, no la app. Las notas no encontraron ninguna página de Google que aclare si un proyecto personal sin fines comerciales cuenta como "ofrecido a usuarios del EEE".

Esto también desactualiza una línea de `CLAUDE.md`: "En el plan gratuito Google puede usar el contenido para mejorar sus productos". Para un desarrollador en España, el texto vigente de Google dice lo contrario: se aplican las reglas del plan de pago. Además, en el plan gratuito Google pide expresamente "Do not submit sensitive, confidential, or personal information to the Unpaid Services". Prohíbe usar la API "to provide medical advice" y la limita a apps no dirigidas a menores de 18 ([Gemini API Additional Terms](https://aistudio.google.com/docs/terms)). Su política de usos prohibidos suma que no se pueden usar datos personales "without legally-required consent" ni hacer "misleading claims of expertise" en salud ([Generative AI Prohibited Use Policy](https://policies.google.com/terms/generative-ai/use-policy)). Spotter ya evita los diagnósticos, y el consentimiento explícito de salud cubre lo segundo.

El rol de Google también depende del plan. En el de pago, Google trata los prompts como **encargado**, según su "Data Processing Addendum for Products Where Google is a Data Processor". En el gratuito, las condiciones no ofrecen ese contrato, y que Google use el contenido para sí apunta a que actúa como **responsable independiente** ([Gemini API Additional Terms](https://aistudio.google.com/docs/terms)). Si elegís activar la facturación, el aviso puede decir "Google trata los datos por cuenta nuestra". Si no, tiene que decir otra cosa. Por eso el texto propuesto deja esa sección como `[PENDIENTE]`.

### Vercel, Neon y Gmail: alojamiento en Frankfurt, empresas de EE. UU.

**Vercel** limita el plan Hobby al "personal or non-commercial use" y define lo comercial como cualquier despliegue para "financial gain of anyone" (cobros, anuncios, afiliados, que te paguen por hacerlo). Un proyecto de estudiante sin cobros ni anuncios entra en lo no comercial, y hasta las donaciones están permitidas ([Vercel Fair Use Guidelines](https://vercel.com/docs/limits/fair-use-guidelines)). El problema es otro: su **DPA dice que se aplica solo a los planes Pro y Enterprise** ([Vercel DPA](https://vercel.com/legal/dpa)), aunque sus términos digan que los datos personales se tratan según ese DPA ([Vercel Terms](https://vercel.com/legal/terms)). En Hobby, entonces, puede que no tengas el contrato de encargado que pide el art. 28 del RGPD. Vercel dice estar certificada en el Marco de Privacidad de Datos UE-EE. UU. ([Vercel KB](https://vercel.com/kb/guide/is-vercel-certified-under-dpf)), pero un blog de 2026 lo niega, así que hay que comprobarlo en la lista oficial.

**Neon** ahora contrata como **Databricks, Inc.** Su DPA (actualizado el 14 de octubre de 2026) es un anexo de Databricks, suma a Grafana Labs (EE. UU.) como subencargado y no dice claramente si cubre el plan gratuito ([Neon DPA](https://neon.com/dpa)). La base de Spotter está en Frankfurt, así que los datos guardados quedan en la UE, aunque una empresa de EE. UU. podría acceder a ellos.

**Gmail personal** usado por SMTP aguanta unos 500 correos por día ([Gmail sending limits](https://support.google.com/mail/answer/22839?hl=en)), muy por encima del tope de 50 de Spotter. Pero en una cuenta de consumo Google actúa como responsable bajo su política de privacidad general, y no hay contrato de encargado: ese contrato existe para Workspace, aunque esto se sabe de forma general y no se verificó. Por Gmail solo pasan el correo de la persona y los enlaces, pero hay que nombrarlo como destinatario.

Para las **transferencias a EE. UU.**, la garantía habitual es el Marco de Privacidad de Datos UE-EE. UU. (DPF, la decisión de adecuación de 2023), con las cláusulas contractuales tipo (CCT) de respaldo. El DPF **sigue vigente**: el Tribunal General rechazó el recurso de Latombe el 3 de septiembre de 2025, pero la casación (C-703/25 P) sigue pendiente ([WilmerHale](https://www.wilmerhale.com/en/insights/blogs/wilmerhale-privacy-and-cybersecurity-law/20251201-european-court-of-justice-to-review-challenge-to-eu-us-data-privacy-framework)). Por eso conviene nombrar las dos garantías. Google declara su certificación en el DPF ([Google privacy frameworks](https://policies.google.com/privacy/frameworks?hl=en)), y Databricks solo aparece en fuentes secundarias. Ninguna de las tres certificaciones se comprobó en [la lista oficial](https://www.dataprivacyframework.gov/list): hay que hacerlo, con fecha, antes de publicar.

---

## Cookies, consumo, producto sanitario y Reglamento de IA

### La cookie de sesión no necesita banner; la de 30 días tildada es el punto flojo

El art. 22.2 de la LSSI exige consentimiento para guardar o leer datos en el aparato de la persona. Dice "dispositivos de almacenamiento" en general, así que también alcanza a `localStorage` y `sessionStorage`. Pero exceptúa lo que sea **estrictamente necesario para un servicio que la persona pidió** ([LSSI, BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758)). La guía de la AEPD, según los resúmenes (el PDF no se pudo leer), exime las cookies de "entrada del usuario", de personalización y de autenticación "únicamente de sesión" ([marketing4ecommerce](https://marketing4ecommerce.net/la-aepd-presenta-la-guia-para-el-uso-de-las-cookies-2019-novedades-y-ejemplos-practicos/)). Eso cubre la cookie `spotter_session` sin "Recordarme" (12 horas, se borra al cerrar el navegador) y los borradores, el reloj de descanso y el cronómetro: **no hace falta banner**, alcanza con informarlos. Si algún día sumás analítica, eso cambia.

La duda es la cookie de **30 días**. El dictamen WP194 del Grupo del Artículo 29 dice que las cookies de inicio de sesión persistentes **no** están exentas por defecto, porque la persona puede no saber que cerrar el navegador no cierra la sesión. Ese mismo dictamen acepta una casilla "Recordarme" junto al formulario como forma válida de consentir ([WP194](https://ec.europa.eu/justice/article-29/documentation/opinion-recommendation/files/2012/wp194_en.pdf); el contenido viene del conocimiento previo del investigador y no de la lectura del PDF). La clave es que la marque la persona: Planet49 y las Directrices 05/2020 dicen que una casilla premarcada no es consentimiento ([EDPS, caso Planet49](https://edps.europa.eu/sites/edp/files/publication/19-11-07_case_study_based_on_planet49_and_solutions_en.pdf)). La infracción por cookies es leve en la LSSI, pero contradice tu decisión 98, así que la decisión es tuya.

### La LSSI probablemente no se aplica, pero tu nombre y un correo se publican igual

La LSSI cubre servicios "normalmente a título oneroso" (a cambio de algo) o, si son gratis, "en la medida en que constituyan una actividad económica para el prestador" ([LSSI, Anexo](https://www.boe.es/buscar/act.php?id=BOE-A-2002-13758)). Si aplica, su art. 10 exige nombre, **domicilio, correo y NIF** con acceso "permanente, fácil, directa y gratuita", y omitirlos puede ser infracción leve o grave. Legálitas dice que no se aplica a una web personal "cuando no se realice ningún tipo de actividad económica" ([Legálitas](https://www.legalitas.com/actualidad/requisitos-legales-para-web-o-blog)). Spotter no cobra, no tiene anuncios y no es tu trabajo, así que el encaje es débil, aunque no seguro. Como el RGPD igual exige tu identidad y un contacto, la diferencia práctica se reduce al domicilio y al NIF (decisión 3).

### "No me hago responsable de lesiones" no vale como está escrito

La frase del borrador ("Quien lo creó no se responsabiliza por lesiones ni por daños") es, como mínimo, parcialmente ineficaz. Si se aplicara la ley de consumo, excluir la responsabilidad "por la muerte o por las lesiones" es **abusivo y nulo** (art. 86.2 TRLGDCU), y la cláusula "se tendrá por no puesta" (art. 83) ([TRLGDCU, BOE](https://www.boe.es/buscar/act.php?id=BOE-A-2007-20555)). Lo más probable es que no se aplique, porque esa ley regula relaciones con "empresarios" y un estudiante que ofrece algo gratis para aprender probablemente no lo es. Aun así, por el Código Civil la responsabilidad por **dolo** (daño hecho a propósito o a sabiendas) no se puede renunciar (art. 1102) y la culpa extracontractual (art. 1902) sigue existiendo ([Código Civil, BOE](https://www.boe.es/buscar/act.php?id=BOE-A-1889-4763)). La redacción válida es un **aviso de riesgo**: propuestas orientativas, revisalas, pará si te duele, sin garantía de disponibilidad, más una **cláusula de salvaguarda**: "nada de esto limita la responsabilidad que la ley no permite limitar". Por la misma lógica, la cláusula de ley aplicable no puede quitarle a un consumidor la protección de su país ni los tribunales de su domicilio. Y los cambios del aviso se avisan antes, con la opción de irse (Borrar cuenta).

### Spotter no es producto sanitario mientras hable de bienestar

Para el Reglamento de productos sanitarios, el software solo es producto sanitario si tiene una finalidad médica propia, y la guía MDCG 2019-11 (revisión de junio de 2025) suma ejemplos de apps de bienestar que no lo son ([Emergo by UL](https://www.emergobyul.com/news/european-revision-primary-software-guidance-mdcg-2019-11-revision-1-small-changes-meaningful)). Lo que manda es la **finalidad que declarás**, incluido lo que dice el aviso legal. Por eso el texto tiene que decir que Spotter "no diagnostica, no previene, no trata ni rehabilita" y describir el ajuste ante dolor como prudencia general de entrenamiento, no como manejo del dolor.

### Reglamento de IA: avisar que lo genera una IA es barato y cubre la duda

El art. 50 del Reglamento de IA rige desde el **2 de agosto de 2026**. El Digital Omnibus, en vigor desde el 27 de julio de 2026, solo le dio hasta el 2 de diciembre de 2026 al marcado legible por máquina (50.2) de los sistemas que ya estaban en el mercado ([Lewis Silkin](https://www.lewissilkin.com/insights/2026/07/27/the-digital-omnibus-on-ai-enters-into-force-today-102nedo)). Spotter no es de alto riesgo, porque el fitness no está en el Anexo III, aunque las notas no leyeron ese anexo. Tampoco es un chatbot, así que el 50.1 ("interactuar directamente") encaja mal. La excepción del art. 2.10 protege a quien usa una IA "in the course of a purely personal non-professional activity", no a quien ofrece un servicio público ([AI Act art. 2](https://artificialintelligenceact.eu/article/2/)). Un particular que integra Gemini en una app propia con su nombre se parece a un "proveedor", aunque sea gratis, y queda para el abogado. La solución barata: decir de forma "clara y distinguible", a más tardar en la primera interacción ([AI Act art. 50](https://artificialintelligenceact.eu/article/50/)), que la propuesta la genera una IA (Google Gemini), que puede equivocarse y que se revisa antes de aceptarla. Guardar el resumen de la IA marcado como "generado por IA" en la base es una medida razonable para el 50.2.

---

## Dónde va cada cosa y cómo escribirla para el teléfono

El estudio de usabilidad de NN/g encontró que la gente siente que las políticas están escritas "para otros abogados", busca un dato puntual en lugar de leer todo y busca los textos legales en Ajustes o en el pie de página. Recomienda un **resumen arriba**, la fecha de actualización, un resumen de los cambios, un índice con enlaces, letra de 14 pt o más y nada de mayúsculas sostenidas ([NN/g](https://www.nngroup.com/articles/privacy-policies-terms-use-pages/)). Para las casillas, el sistema de diseño de gov.uk pide no premarcarlas, poner la casilla a la izquierda, usar etiquetas cortas y **no meter enlaces dentro de la etiqueta**, además de mostrar errores específicos ([GOV.UK Checkboxes](https://design-system.service.gov.uk/components/checkboxes/)). Las Directrices 03/2022 del EDPB sobre patrones engañosos agregan, para Spotter: no presionar con culpa o miedo para que se marque la casilla, que retirar no cueste más que dar, la misma redacción en todos lados y nada de frases vagas como "mejorar el servicio" sin nombrar a Gemini ([EDPB 03/2022](https://www.edpb.europa.eu/our-work-tools/our-documents/guidelines/guidelines-032022-deceptive-design-patterns-social-media_en)).

El sector usa una página propia de descargo médico (iFIT, MacroFactor, Arvo) que nombra síntomas concretos: iFIT manda parar ante dolor, mareo, náuseas o dolor de pecho ([iFIT Medical Disclaimer](https://www.ifit.com/legal/ifit-medical-disclaimer)). Ninguna de las apps revisadas tiene un descargo propio para planes generados por IA, así que ese hueco lo llena Spotter con su "la IA propone, vos decidís".

Los cuatro lugares aprobados alcanzan, con tres ajustes. Primero, el **registro** recoge el correo, así que, además del enlace al pie, necesita una primera capa de dos líneas (art. 11 LOPDGDD). Segundo, el **paso 7** pasa a tener dos casillas separadas. Tercero, el **aviso de IA** va también donde se genera: en el último paso de "Generar rutina" y arriba de la propuesta. El bloque amarillo de dolor no puede depender solo del color: tiene que llevar un título con texto ("Importante").

---

## Texto propuesto

> **Borrador de producto, pendiente de revisión por un abogado.** Los `[PENDIENTE: …]` marcan decisiones tuyas. Cambia respecto del borrador del 16/10: ya no menciona las marcas de carga y dolor (no se piden ni se mandan a la IA), la sesión dura 30 días con "Recordarme" o hasta cerrar el navegador sin él, existen Borrar cuenta, Cambiar correo y Cambiar contraseña, está "Cargar medición" con grasa corporal opcional y el alojamiento es Vercel y Neon en Frankfurt más Gmail. La cláusula de responsabilidad es válida y el texto suma consentimiento de salud, derechos, cookies, proveedores y transferencias.

### Página `/aviso-legal`

**Aviso legal, privacidad y cookies de Spotter**
*Versión [PENDIENTE: 1.0] · Última actualización: [PENDIENTE: fecha] · Qué cambió: primera versión.*

**En resumen**

- Spotter es un proyecto personal de aprendizaje, gratuito y sin fines comerciales, para organizar tu entrenamiento. **No es consejo médico.**
- Una inteligencia artificial (Google Gemini) te propone la semana. **Puede equivocarse, y nada cambia hasta que lo aceptás.**
- Guardamos tu cuenta, tu perfil y lo que entrenás. Para tus datos de salud (limitaciones, peso, grasa corporal y lo que cuentes de dolor o cansancio) te pedimos un **permiso aparte**, que podés retirar.
- A la IA nunca le mandamos tu nombre, tu correo ni tu contraseña.
- No hay publicidad ni analítica. Solo usamos la cookie de tu sesión y lo que tu navegador guarda para que no pierdas lo que estás cargando.
- Podés borrar tu cuenta y todo lo tuyo desde **Perfil › Cuenta › Borrar cuenta**, al instante.

**Índice:** 1. Quién está detrás · 2. Qué es Spotter · 3. No es consejo médico · 4. Si sentís dolor · 5. Las propuestas de la IA · 6. Edad mínima · 7. Qué datos guardamos y para qué · 8. Tus datos de salud y tu permiso · 9. Qué se manda a la IA · 10. Proveedores y dónde están tus datos · 11. Cuánto tiempo los guardamos · 12. Tus derechos · 13. Cookies y almacenamiento del navegador · 14. Seguridad · 15. Responsabilidad · 16. Cambios en este aviso · 17. Ley aplicable · 18. Contacto

**1. Quién está detrás**
Spotter lo hace y lo mantiene [PENDIENTE: nombre y apellido], estudiante, como proyecto personal de aprendizaje. Es el responsable del tratamiento de tus datos. Contacto: [PENDIENTE: correo de contacto]. [PENDIENTE, según la decisión 3: domicilio a efectos de notificaciones y NIF, o nada.] No hay Delegado de Protección de Datos porque la ley no lo exige para un proyecto así.

**2. Qué es Spotter**
Spotter es una herramienta para registrar y planificar entrenamiento de gimnasio con fines de bienestar y estado físico general. Vos registrás lo que hacés y, cuando querés, una IA te propone la semana siguiente. Es gratuito, no tiene publicidad y no vende nada.

**3. No es consejo médico**
Spotter no tiene finalidad médica: **no diagnostica, no previene, no trata ni rehabilita enfermedades ni lesiones**, y no reemplaza a un médico, kinesiólogo o profesional del entrenamiento. Las propuestas son generales y orientativas, y solo tienen en cuenta lo que cargaste. Consultá a un médico antes de empezar o cambiar un programa de ejercicio, sobre todo si tenés una lesión, una enfermedad, un embarazo o dudas.

**4. ⚠ Importante: si sentís dolor** *(bloque destacado en amarillo, con este título en texto)*
Una molestia muscular leve después de entrenar puede ser normal. **Pará enseguida y consultá a un profesional** si sentís dolor fuerte, punzante o que no se va, dolor en reposo, hormigueo, mareo, náuseas, falta de aire o dolor en el pecho. Spotter no puede evaluar tu caso. Si querés que la próxima semana lo tenga en cuenta, contalo en el comentario al cerrar la semana: la IA puede bajar la carga o cambiar un ejercicio por prudencia, pero eso no es un tratamiento.

**5. Las propuestas de la IA**
"Generar rutina" usa una inteligencia artificial de Google (Gemini) para proponerte la semana a partir de tus datos (ver la sección 9) y de reglas de entrenamiento que aplica el propio código de Spotter (cantidad mínima de series, reparto entre días, subidas de peso de a poco, entre otras). **La IA puede equivocarse.** Los pesos, las series y las repeticiones son sugerencias: ajustalos a cómo te sentís y a tu técnica. Antes de aceptar ves la propuesta completa, la aceptás o la descartás, y **nada se aplica sin que la aceptes**. Esto es armar un perfil de entrenamiento con tus datos, pero no es una decisión automática con efectos legales sobre vos. Si no querés que se use así, podés no usar "Generar rutina" u oponerte escribiendo a [PENDIENTE: correo].
[PENDIENTE, según la decisión 1: una línea sobre el plan de Gemini que se use.]

**6. Edad mínima**
Para usar Spotter tenés que tener **[PENDIENTE: 18 / 14] años o más**. Si no llegás, la app no te deja terminar el perfil.

**7. Qué datos guardamos y para qué**

| Datos | Para qué | Base legal |
|---|---|---|
| Correo y contraseña (guardada cifrada, nunca en claro) | Crear tu cuenta, iniciar sesión, mandarte enlaces de verificación, recuperación y cambio de correo | Es necesario para darte el servicio |
| Nombre, fecha de nacimiento (se muestra la edad) y sexo | Personalizar la app y, la edad y el sexo, ajustar la propuesta | Es necesario para darte el servicio |
| Peso, altura, mediciones (peso y grasa corporal opcional, "Cargar medición") e IMC calculado (no se guarda) | Mostrarte tu evolución; la edad, el peso y la altura también ajustan la propuesta | **Tu consentimiento explícito** (sección 8) |
| Limitaciones que escribas [PENDIENTE: opcional] y tu comentario al cerrar la semana (hasta 1.000 caracteres) | Que la propuesta tenga en cuenta lesiones, dolor o cansancio | **Tu consentimiento explícito** (sección 8) |
| Rutinas, semanas, lo planificado y lo realizado (series, pesos, repeticiones, minutos, duración de la sesión, entrada en calor) | Que puedas registrar, ver tu progreso y que la IA arme la semana siguiente | Es necesario para darte el servicio |
| Intentos de inicio de sesión (correo e IP) | Frenar ataques a las contraseñas | Interés legítimo en la seguridad |
| Un contador de cada llamada a la IA, sin el contenido | No pasar los límites gratuitos del proveedor | Interés legítimo; al borrar tu cuenta queda sin dueño y no te identifica |

Si alguna vez marcaste en versiones anteriores cómo te cayó un ejercicio o si te dolió, esas marcas siguen guardadas en tu cuenta, pero ya no se piden ni se mandan a la IA.

Los datos obligatorios (correo, contraseña, nombre, fecha de nacimiento, sexo, peso y altura) hacen falta para que la app funcione y la propuesta tenga sentido. Sin ellos no se puede crear el perfil. [PENDIENTE: justificar el sexo como obligatorio o volverlo opcional.]

**8. Tus datos de salud y tu permiso**
Las limitaciones, el peso, la altura, la grasa corporal y lo que cuentes de dolor o cansancio pueden decir algo de tu salud. Por eso solo los usamos si marcás la casilla de consentimiento del perfil, que viene **sin marcar** y es aparte de la del aviso legal. Podés retirar el permiso cuando quieras desde **Perfil › [PENDIENTE: "Datos de salud" › Retirar]** o escribiendo a [PENDIENTE: correo]. Retirarlo no afecta lo que se hizo antes. A partir de ahí dejamos de usar esos datos y [PENDIENTE: qué pasa: se borran las limitaciones y las mediciones, y "Generar rutina" queda desactivado, o lo que decidas]. Guardamos la fecha y la versión de lo que aceptaste para poder demostrarlo [PENDIENTE: depende de la decisión 5].

**9. Qué se manda a la IA**
Cuando tocás "Generar rutina", y solo entonces, se manda a Google Gemini: tu edad, peso, altura, sexo, las limitaciones que escribiste, el objetivo, el nivel, los días y la estructura elegidos y, si continuás una rutina, lo planificado y lo realizado de la semana anterior y tu comentario de cierre. **Nunca se mandan tu nombre, tu correo, tu contraseña ni tus mediciones de grasa corporal.** Para elegir ejercicios del catálogo también se manda un texto con el objetivo y el nivel, sin datos tuyos. No escribas en las limitaciones ni en el comentario nada que no quieras compartir.
[PENDIENTE, según la decisión 1. Si se pasa al plan de pago: "Google trata estos datos por cuenta de Spotter, como encargado, no los usa para mejorar sus productos y los guarda poco tiempo para detectar abusos." Si no se pasa: no publicar este aviso hasta resolverlo.]

**10. Proveedores y dónde están tus datos**

| Proveedor | Qué hace | Dónde |
|---|---|---|
| Vercel Inc. (EE. UU.) | Aloja la app y el servidor | Funciones en Frankfurt (Alemania) |
| Neon / Databricks, Inc. (EE. UU.) | Base de datos | Frankfurt (Alemania) |
| Google LLC: Gemini API (EE. UU.) | Genera la propuesta | Servidores de Google [PENDIENTE] |
| Google LLC: Gmail (EE. UU.) | Manda los correos de verificación, recuperación y cambio de correo | Servidores de Google |

Son empresas de EE. UU., así que puede haber acceso desde allá. Esas transferencias se amparan en el Marco de Privacidad de Datos UE-EE. UU. y, de forma complementaria, en las cláusulas contractuales tipo de la Comisión Europea, cuando el proveedor las ofrece. [PENDIENTE: comprobar en dataprivacyframework.gov la certificación de cada empresa y poner la fecha de la comprobación.] No vendemos ni cedemos tus datos a nadie más.

**11. Cuánto tiempo los guardamos**
Tu cuenta, tu perfil, tus entrenamientos y tus mediciones se guardan **mientras tengas la cuenta**. Las mediciones también podés borrarlas una por una. Al tocar "Borrar cuenta" se borran al instante [PENDIENTE: revisar el bloqueo del art. 32 LOPDGDD con el abogado]. Los registros que no se verifican se eliminan al vencer el enlace. Los intentos de inicio de sesión se guardan [PENDIENTE: plazo real según el código]. Los borradores que guarda tu navegador duran como se indica en la sección 13.

**12. Tus derechos**
Podés pedir acceso a tus datos, corregirlos, borrarlos, limitar su uso, oponerte, llevártelos en un formato estándar (portabilidad) y retirar tu consentimiento. Mucho lo podés hacer vos en la app: editar el perfil, borrar mediciones, Cambiar correo, Cambiar contraseña y Borrar cuenta (Perfil › Cuenta). Para lo demás, por ejemplo una copia de tus datos, escribí a [PENDIENTE: correo] y te respondemos en un mes como máximo. [PENDIENTE: o "con el botón Exportar mis datos", si se construye.] Si creés que no respetamos tus derechos, podés reclamar ante la Agencia Española de Protección de Datos (www.aepd.es).

**13. Cookies y almacenamiento del navegador**
Spotter **no usa cookies de publicidad ni de analítica**, ni de terceros. Solo usa lo necesario para funcionar, que no requiere tu consentimiento:

| Qué | Para qué | Cuánto dura |
|---|---|---|
| Cookie `spotter_session` (propia, no accesible desde JavaScript) | Mantener tu sesión iniciada | Sin "Recordarme": 12 horas como máximo, y se borra al cerrar el navegador. Con "Recordarme": 30 días en este aparato |
| Almacenamiento local: borrador del perfil | Que no pierdas lo que cargaste si salís a mitad | Hasta 7 días o hasta terminar |
| Almacenamiento local: borrador de "Generar rutina" | Volver a lo que elegiste si falla la generación | Hasta 2 días, o hasta generar o cancelar |
| Almacenamiento local y de sesión: cronómetro y reloj de descanso | Que el tiempo siga al cambiar de pantalla | Mientras lo uses o hasta cerrar la pestaña |

La casilla "Recordarme" del inicio de sesión [PENDIENTE, según la decisión 2: "viene sin marcar: marcala si querés que la sesión dure 30 días en este aparato"]. Si un día sumamos otras cookies, te vamos a pedir permiso antes.

**14. Seguridad**
Las contraseñas se guardan con un cifrado de un solo sentido (argon2), la cookie de sesión no es accesible desde JavaScript, se limitan los intentos de inicio de sesión y la conexión va cifrada (HTTPS). Ningún sistema es infalible: si detectamos un problema que afecte tus datos, te vamos a avisar según lo que pide la ley.

**15. Responsabilidad**
Spotter es un proyecto de aprendizaje, gratuito, y se ofrece como está. No garantizamos que esté siempre disponible ni libre de errores, ni que logres un resultado concreto: eso depende de cada persona. Revisá cada propuesta antes de aceptarla, ajustá o descartá lo que no te sirva y respetá lo que te indique tu médico. Entrenar tiene riesgos propios, y vos decidís cómo y cuánto entrenás. **Nada de este aviso limita la responsabilidad que la ley no permite limitar**, como la que surge del dolo o de los daños a la vida o a la salud causados por culpa de quien ofrece el servicio.

**16. Cambios en este aviso**
Si cambiamos algo importante, lo vas a ver en la app antes de que rija, con un resumen de qué cambió. Si cambia algo de tu consentimiento de salud, te lo vamos a pedir de nuevo. Si no estás de acuerdo, podés dejar de usar Spotter y borrar tu cuenta.

**17. Ley aplicable**
Este aviso se rige por la ley española. Si sos consumidor, nada de esto te quita la protección de las leyes de tu país de residencia ni el derecho a ir a los tribunales de tu domicilio.

**18. Contacto**
[PENDIENTE: correo de contacto]. Para cualquier pregunta sobre tus datos o sobre este aviso.

### Textos cortos para cada lugar

**1. Pie de Login y Registro (sin sesión).** El enlace: "Aviso legal · Privacidad · Cookies" → `/aviso-legal`. En **Registro**, sobre el botón, la primera capa: "Responsable: [PENDIENTE: nombre]. Usamos tu correo para crear tu cuenta y mandarte el enlace de verificación. Podés acceder a tus datos, corregirlos o borrarlos. Más información en el Aviso legal." En **Login**, junto a la casilla: "Recordarme (guarda una cookie 30 días en este aparato)".

**2. Paso 7 del asistente del perfil (dos casillas sin marcar, el enlace fuera de las etiquetas).**
Primera capa arriba: "Antes de terminar: Spotter es un proyecto de [PENDIENTE: nombre]. Con tus datos registramos tu entrenamiento y una IA de Google (Gemini) te propone rutinas que vos aceptás o descartás. A la IA no le llega tu nombre ni tu correo. Podés retirar tu permiso, oponerte o borrar todo cuando quieras, y reclamar ante la AEPD."
☐ "Leí el aviso legal y entiendo que Spotter no es consejo médico." *(obligatoria para seguir)*
☐ "Consiento que Spotter use mis datos de salud (limitaciones, peso, altura, grasa corporal y lo que cuente de dolor o cansancio) para armar mis rutinas, y que los mande a Google Gemini para generarlas." *(separada; obligatoria u opcional según la decisión 5)*
Debajo, fuera de las etiquetas: "Leer el aviso legal completo". Error si falta la primera: "Marcá la casilla para seguir." La edad mínima se controla antes, en el paso de la fecha de nacimiento: "Para usar Spotter tenés que tener [PENDIENTE: 18/14] años o más."

**3. Perfil, pestaña Cuenta.** Fila "Aviso legal: Aceptado el [fecha] (versión [n])" → `/aviso-legal`. Fila aparte "Datos de salud: Consentido el [fecha] · Retirar" → confirmación que explica qué pasa al retirarlo y enlaza a la sección 8. (Las fechas exigen guardarlas: decisión 5.)

**4. Página `/aviso-legal`.** Pública, con o sin sesión: el texto de arriba, con "En resumen", índice con anclas, secciones cortas y el bloque amarillo titulado "Importante".

**Aviso de IA en el punto de uso.** En el último paso de "Generar rutina", sobre el botón: "La propuesta la arma una IA (Google Gemini) con tus datos del perfil y tu última semana. Puede equivocarse: revisala antes de aceptarla." Arriba de la propuesta, junto al resumen: "Propuesta generada por IA · Nada cambia hasta que la aceptes." La letra chica que ya existe en el día y en la propuesta puede quedar, alineada con este texto.

---

## Conclusión

El aviso deja de ser un descargo de responsabilidad y pasa a ser la explicación de cómo respeta Spotter las reglas que más le pesan: datos de salud con permiso explícito, una IA que propone sin decidir y proveedores nombrados con su país. Casi todo se resuelve redactando bien y con dos cambios chicos de pantalla (una casilla más y un aviso de IA donde se genera). Hay una parte que no es de redacción sino de producto, y la tenés que decidir antes de publicar: la cláusula de Gemini para el EEE, la edad mínima y si guardás la prueba del consentimiento. La regla de "costo cero" se escribió pensando en no pagar. Esta investigación muestra que, para una app pública en Europa, no pagar y cumplir las condiciones de Google hoy van en direcciones opuestas.

## Qué tiene que revisar un abogado

- La lectura de la cláusula de Gemini ("only Paid Services" para usuarios del EEE) y si un proyecto personal gratuito entra en ella.
- Si la LSSI se aplica a Spotter y si hay que publicar domicilio y NIF.
- Si la autodeclaración de la fecha de nacimiento alcanza como control de edad en una app con datos de salud.
- Si el peso y la altura, solos, entran en el consentimiento explícito, y si el sexo obligatorio está justificado (minimización).
- El art. 32 de la LOPDGDD (bloqueo) frente al borrado al instante de "Borrar cuenta".
- La falta de contrato de encargado con Vercel (Hobby), Gmail personal y, quizás, Neon en el plan gratuito.
- La cláusula de responsabilidad, la de ley aplicable y si un particular que integra Gemini es "proveedor" según el Reglamento de IA.
- La "Recordarme" premarcada frente a WP194 y Planet49.
- Si es obligatorio hacer ya la EIPD y el registro de actividades.

## Qué no se verificó

No se comprobaron en la lista oficial del DPF las certificaciones de Google, Vercel y Databricks (en Vercel hay versiones contradictorias). Tampoco se leyó el texto completo del DPA de Google para encargados ni el de Databricks para Neon, ni se confirmó si una cuenta de Gmail personal tiene algún DPA. No se pudieron leer: los PDF de la guía de cookies de la AEPD y de WP194 (lo de "Recordarme" viene de conocimiento previo), la guía MDCG 2019-11 (dio 403), el considerando 19 del Reglamento de productos sanitarios, el Anexo III y las definiciones del Reglamento de IA en EUR-Lex, el texto consolidado del Omnibus de IA, los arts. 32 y 34 de la LOPDGDD, los arts. 85 y 90 del TRLGDCU, los arts. 1102 y 1902 del Código Civil (citados de memoria), Roma I y Bruselas I bis, ni los ejemplos de pantalla de las Directrices 03/2022 del EDPB. Los artículos del RGPD se citan por conocimiento del texto oficial y no se volvieron a descargar. Tampoco se confirmó si el "Digital Omnibus" de protección de datos (propuesto en noviembre de 2025) cambió la definición de categorías especiales, ni qué pasa con la cuota y los cobros si un proyecto de Google con facturación activa se queda dentro del cupo gratuito. Del código de Spotter se comprobó que el borrador del perfil dura 7 días y que el prompt manda edad, peso, altura, sexo y limitaciones (con "ninguna indicada" si están vacías). Quedan sin comprobar las claves exactas de almacenamiento local, el plazo real de los intentos de inicio de sesión y si `ai_calls` guarda algo identificable.
