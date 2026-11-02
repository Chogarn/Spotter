# Plan: registrarse e iniciar sesión con Google

Estado: **plan, sin construir** (escrito el 2026-11-02; el usuario lo retoma el miércoles, cuando llegue a Argentina). Nada de esto está aprobado todavía: antes de implementar, el usuario corrige y aprueba el plan.

## Para qué sirve

Crear la cuenta de un toque, sin inventar contraseña ni esperar el correo de verificación.

## Cómo se accede

Un botón **"Continuar con Google"** en `/registro` y también en `/login`. Es una opción más: registrarse con correo y contraseña sigue igual.

## Qué ve el usuario

1. Toca el botón y Google le muestra su ventana para elegir la cuenta.
2. Si es su primera vez, entra directo al asistente del perfil que ya existe (nombre, nacimiento, peso, altura, sexo). El nombre viene precargado desde Google y se puede corregir.
3. Si ya tenía cuenta, entra a Inicio.

## Acciones

Continuar con Google (registro e ingreso en un solo botón). No hay pantallas nuevas.

## Vista o componentes

Un componente `BotonGoogle` que se pone en las dos pantallas de acceso, más un endpoint nuevo en el backend.

## Datos

- Columna nueva `users.google_sub` (el identificador de Google, único), con la migración **0030**.
- `users.password_hash` hoy es obligatorio: pasa a ser opcional, porque una cuenta de Google no tiene contraseña.
- El correo llega ya verificado desde Google: `email_verified_at` se completa en el momento.
- Endpoint nuevo `POST /auth/google`: recibe la credencial que da Google, la valida en el servidor y pone la misma cookie `spotter_session` de siempre. El resto de la app no cambia.

## Decisiones de diseño (propuestas, a confirmar)

- **Cuenta existente con el mismo correo:** Google entra a esa misma cuenta y se le guarda el `google_sub`. No se crean dos cuentas.
- **Cuenta solo de Google, sin contraseña:**
  - "Cambiar contraseña" no aparece.
  - "Borrar cuenta" se confirma con Google en vez de con contraseña.
  - "Cambiar correo" queda deshabilitado, porque el correo es el de Google.
- **Decidido sin preguntar (corregible):** el botón sirve para registrarse y para ingresar a la vez; el nombre viene de Google y se puede corregir.
- **Abierta:** que quien se registra con Google pueda agregar una contraseña más adelante (si pierde el acceso a su cuenta de Google, pierde Spotter). No está incluido en el plan.

## Criterios de aceptación

1. Con el botón, una persona nueva queda con cuenta y sesión iniciada, y llega al asistente del perfil.
2. Una persona que ya tenía cuenta con ese correo entra a la misma, sin duplicarla.
3. Una credencial de Google falsa, vencida o de otra aplicación da 401 y no crea nada.
4. La cuenta creada por Google puede cerrar sesión, volver a entrar y borrarse.
5. Registrarse con correo y contraseña sigue funcionando igual y los tests actuales pasan.
6. Tests nuevos del backend con un verificador de Google falso (nunca se llama a Google de verdad).

## Pasos, en orden

1. **Verificar en la documentación oficial de Google** que el cliente OAuth sea gratis para este uso y qué pide la pantalla de consentimiento. No darlo por hecho.
2. **El usuario crea el cliente OAuth** en la consola de Google (necesita su cuenta). Pasa el identificador público; en el `.env` van `GOOGLE_CLIENT_ID` y lo que corresponda (sin valor por defecto: si falta, el botón no aparece).
3. Migración 0030, endpoint, verificador del token y tests.
4. Botón en `/login` y `/registro`.
5. Ajuste de Perfil › Cuenta para cuentas sin contraseña.
6. Probar con un usuario descartable en desarrollo (sin tocar los datos reales).

## Riesgos y lo que no se sabe

- Si en desarrollo Google acepta `http://localhost:3001` como origen autorizado: se revisa en el paso 1. (Recordar que `127.0.0.1:3001` no sirve para iniciar sesión, por CORS.)
- En producción el origen autorizado es el dominio de la app: se completa al desplegar (S5), junto con `APP_URL` y `CORS_ORIGINS`.
- La pantalla de consentimiento de Google puede pedir verificación de la app si se publica; con los permisos básicos (correo y perfil) suele no hacer falta, pero **hay que confirmarlo en la fuente oficial**.
- Perder el acceso a la cuenta de Google implica perder el acceso a Spotter (ver la decisión abierta).

## Para el tablero

Cuando se apruebe: crear el issue de GitHub con esta descripción y sumarlo a `docs/backlog.md` (entra en S5, calidad y despliegue, o como mejora aparte; lo decide el usuario).
