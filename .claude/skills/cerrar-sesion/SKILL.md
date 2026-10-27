---
name: cerrar-sesion
description: Cierra una sesión de trabajo en Spotter. Verifica que todo ande (tipos y tests), actualiza CLAUDE.md, el README y los docs que correspondan, commitea lo que falta en commits por tema y hace push. Usalo cuando el usuario diga "cerrar sesión", "cerrá la sesión", "commit y push" o "dejalo todo guardado".
---

# Cerrar sesión

El usuario te invocó para cerrar la sesión: **eso es la autorización para commitear y hacer push** (la regla de "no commitear sin que lo pida" de `CLAUDE.md` queda cumplida). No hace falta volver a preguntar, salvo en los casos que se marcan abajo.

Trabajá en este orden y no saltees pasos. Si algo falla, **frená y contá qué pasó**: no commitees a medias ni fuerces nada.

## 1. Ver qué hay

```bash
git status --short
git diff --stat
git log --oneline -5
```

- Identificá los temas del trabajo (por ejemplo "pantallas de Inicio", "backend de períodos", "docs"). Sirven para armar los commits.
- **Archivos sin seguimiento (`??`):** commiteá solo los que son parte de lo hecho en esta sesión (componentes nuevos, tests, migraciones). Los borradores de docs (`docs/*-borrador.md`), `AGENTS.md` y cualquier cosa que el usuario no haya mencionado **no se suben**: listalos al final y preguntá si los quiere.
- **Nunca** subas `.env`, `backups/`, claves, archivos grandes ni nada que el `.gitignore` ya excluya. No uses `git add -A` ni `git add .`: agregá por rutas.

## 2. Verificar antes de commitear

Desde la raíz del proyecto, con Docker levantado (`docker compose -f docker-compose.dev.yml ps`; si está apagado, abrilo y levantalo con `up -d`):

```bash
docker compose -f docker-compose.dev.yml exec -T frontend npx tsc --noEmit
docker compose -f docker-compose.dev.yml run --rm --no-deps backend python -m pytest -q
```

- En `tsc` ignorá los avisos de `LayoutProps` y `.next/dev/types/validator.ts`: son del `.next` generado y vienen de antes.
- Si algo falla por tu cambio, arreglalo. Si no sabés por qué falla, frená y decile al usuario; no commitees con tests rotos.
- Si no tocaste el backend, igual corré los tests (son rápidos, unos 30 s). Si no tocaste el frontend, podés saltear `tsc`, pero decilo.
- Los tests nunca llaman a Gemini de verdad. **No hagas pruebas con la IA real** para cerrar la sesión: gastan cuota.

## 3. Actualizar los documentos

Solo lo que cambió de verdad. Editá, no agregues párrafos nuevos a lo loco: `CLAUDE.md` ya es largo y hay que mantenerlo legible.

- **`CLAUDE.md`**: la sección "Estado y pendientes de producto" y lo que haya quedado desactualizado (estructura de carpetas, comandos, trampas del entorno si descubriste una nueva). Escribí hechos, con la fecha de hoy (`date +%F`), no intenciones. Si algo que figuraba como pendiente ya se hizo, sacalo o tachalo. Mantené el tono y el español rioplatense del archivo.
- **`README.md`**: solo si cambió algo que ve o usa quien lo lee (pantallas, comandos, requisitos, estado de la app).
- **`docs/flujo-app.md`**: si cambió una pantalla o un recorrido del usuario.
- **`docs/modelo-datos.md`**: si hubo una migración o cambió una tabla (y si es nueva, que el número coincida con `backend/migrations/`).
- **`docs/sistema-de-diseno.md`**: si se creó o cambió un componente o patrón visual reutilizable.
- **`docs/decisiones.md`**: agregá una entrada **solo por cada decisión que el usuario tomó** en la sesión (con el número que sigue al último, qué se decidió y la fecha). **Nunca escribas el "por qué"**: dejá `(completar)`, porque esa parte muestra el criterio del estudiante y la escribe él. Si no estás seguro de que algo haya sido una decisión suya y no un detalle, no la agregues.
- Si hubo un número de rutas, tests o tablas en `CLAUDE.md` que cambió (por ejemplo "hasta la 0028" o la cantidad de ejercicios), actualizalo.

No inventes nada: si no sabés qué actualizar, mirá el diff y `git log` de la sesión.

## 4. Commitear

- **Commits por tema, no uno gigante.** Cada commit con una sola idea; los docs van con lo que documentan o en un commit de docs al final.
- Mensajes en español, en el estilo del repo: una línea que dice qué cambió y por qué importa, sin punto final. Mirá `git log --oneline -10` para copiar el tono (por ejemplo "Resúmenes por día como la semana, ⓘ en Rutinas y Entrenar más simple").
- Terminá cada mensaje con la línea de coautoría que indique el sistema en esta sesión.
- Agregá por rutas explícitas (`git add ruta1 ruta2`), commiteá con un heredoc o con `-m` y revisá con `git status` que no quede nada de la sesión sin subir (salvo lo que dejaste afuera a propósito).
- **Nada de `--no-verify`, `--amend` ni rebase.** Si un hook falla, arreglá la causa y hacé un commit nuevo.

## 5. Push

```bash
git push
```

- Rama actual a su remoto (`origin`). Este proyecto trabaja directo en `main`: eso está bien, no abras una rama nueva salvo que el usuario lo pida.
- **Nunca `--force`.** Si el push es rechazado, no resuelvas por tu cuenta: mostrale el error al usuario y proponé `git pull --rebase` o lo que corresponda, y esperá su respuesta.
- Si no hay remoto configurado o falla la autenticación, decilo y no inventes soluciones.

## 6. Issues y tablero (si corresponde)

Si una tarea del tablero quedó terminada en esta sesión y sabés su número de issue, ofrecé cerrarla con un comentario de qué se hizo y moverla a Done. `gh` no está en el PATH: `C:\Program Files\GitHub CLI\gh.exe` (en PowerShell, para comandos largos usá un `.ps1`). **No cambies las opciones del campo Status** del proyecto: regenera los IDs y deja las tareas sin estado. Si no estás seguro de qué issue es, preguntá en vez de adivinar.

## 7. Memoria

Si en la sesión el usuario te corrigió o confirmó una forma de trabajar que conviene recordar, guardala en tu memoria (carpeta de memoria del proyecto) según las reglas de tu sistema, y actualizá `MEMORY.md`. No guardes lo que ya está en el código, en `CLAUDE.md` o en el historial de git.

## 8. Cerrar con un resumen corto

Tu mensaje final debe decir, en español rioplatense y sin vueltas:

- Qué commits hiciste (hash corto y título) y que el push salió bien (o el error).
- Qué documentos actualizaste y qué cambiaste en cada uno.
- Qué verificaste (tipos, tests) y qué **no** pudiste verificar (por ejemplo, pantallas que no viste en un celular).
- Qué quedó afuera a propósito (borradores sin subir, etc.).
- **Qué debería revisar el usuario** y **qué decidiste vos sin preguntar** (como pide `CLAUDE.md` al terminar cada entrega).
- Lo que sigue o queda pendiente, si es real.

No repitas el contenido de los archivos ni listes cada cambio de código: eso ya está en el historial.
