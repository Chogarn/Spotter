---
name: iniciar-sesion
description: Arranca una sesión de trabajo en Spotter. Levanta la app (Docker) si está apagada, revisa git y los pendientes, y le dice al usuario en pocas líneas dónde quedaron y por dónde seguir. Usalo cuando el usuario diga "iniciar sesión", "empecemos", "levantá la app y decime dónde quedamos" o abra una sesión nueva sin una tarea concreta.
---

# Iniciar sesión

Este skill es el espejo de `cerrar-sesion`: deja todo listo para trabajar y orienta al usuario. **No cambia nada del proyecto**: no edita archivos, no commitea, no hace push, no corre migraciones ni llama a la IA. Si algo hay que arreglar, lo decís y esperás.

`AGENTS.md` y tu memoria ya se cargaron solos al abrir la sesión: **no los releas enteros**. Usalos para saber qué reglas aplican y qué estaba pendiente.

## 1. Estado del proyecto

```bash
git status -sb
git log --oneline -8
```

- Decí en qué rama estás y si hay cambios sin commitear o commits sin subir (`ahead` o `behind` en la primera línea de `status -sb`).
- Si hay cambios sin commitear que **no** son de esta sesión (venían de antes), contá cuáles son sin tocarlos. Los borradores de docs sin seguimiento (`AGENTS.md`, `docs/*-borrador.md`) son conocidos: mencionalos en una sola línea, no los listes uno por uno.
- Si `behind` es mayor que cero, avisalo: hay trabajo en el remoto que falta traer. No hagas `git pull` sin que el usuario lo diga.

## 2. Levantar la app

```bash
docker compose -f docker-compose.dev.yml ps
```

- Si Docker no responde (error de conexión a la API), abrí Docker Desktop (`C:\Program Files\Docker\Docker\Docker Desktop.exe`) y esperá a que `docker info` conteste (hasta unos 3 minutos).
- Si los contenedores están apagados o faltan, corré `docker compose -f docker-compose.dev.yml up -d` y volvé a mirar `ps`. Los cuatro tienen que estar arriba: base de datos, backend, frontend y Mailpit.
- **Nunca** toques los contenedores de otros proyectos (`gestor-gastos`, `image_identifier_db`).
- No corras migraciones por tu cuenta. Si hay migraciones nuevas sin aplicar (por ejemplo, tras traer cambios del remoto), decilo y preguntá: la base de desarrollo tiene las pruebas reales del usuario, y antes de migrar conviene un respaldo con `pg_dump` a `backups/`.
- Tras levantar, comprobá que responde: `curl -s -o /dev/null -w "%{http_code}" http://localhost:8000/health` (esperá 200; el backend puede tardar unos segundos) y que el frontend contesta en `http://localhost:3001`.
- Si falta una variable del `.env` (por ejemplo, la IA da 503 "no está configurada"), decilo; no la inventes ni la escribas.

## 3. Ver dónde quedaron

- Mirá la sección "Estado y pendientes de producto" de `AGENTS.md`, en especial el último párrafo "Agregado del …" y la lista "Lo que sigue".
- Mirá las últimas decisiones de `docs/decisiones.md` (las 3 más nuevas) y si tienen `(completar)` sin escribir: esa parte la escribe el usuario, solo recordáselo.
- Si el último cierre dejó algo "sin ver en un celular", mencionalo como lo primero para revisar.

No leas todos los documentos de `docs/`: abrí solo el que haga falta para la tarea que elija el usuario.

## 4. Responder con un resumen corto

Tu mensaje debe ser breve, en español rioplatense, y tener estas partes (omití las que no apliquen):

- **App:** qué levantaste o si ya estaba arriba, y las direcciones: frontend `http://localhost:3001`, backend `http://localhost:8000`, Mailpit `http://localhost:8025`.
- **Git:** rama, si hay algo sin commitear o sin subir.
- **Dónde quedamos:** dos o tres líneas con lo último que se hizo.
- **Por dónde seguir:** de una a tres opciones concretas, sacadas de los pendientes reales, con tu recomendación en una línea. Si el usuario ya dijo qué quiere hacer, saltá esto y empezá.
- **Ojo:** cualquier cosa rara (Docker caído, variable que falta, migración sin aplicar, cuota de la IA, tests que fallaban al cerrar).

Cerrá preguntando qué quiere hacer, en texto (el usuario no usa los botones de opciones). No empieces ninguna tarea del backlog por tu cuenta: **el usuario está al mando y la IA propone**.
