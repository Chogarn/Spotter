# Aviso legal: ya se muestra en la app

**Estado (2026-11-12, decisión 138):** el aviso legal salió de la espera. El texto vigente está en la página pública [`frontend/src/app/aviso-legal/page.tsx`](../frontend/src/app/aviso-legal/page.tsx) y sale del informe `reports/Aviso legal de Spotter en España.md` (investigación del 2026-11-12, pensada para España). Este archivo queda solo como puntero; el borrador del 16 de octubre (pensado para Argentina) quedó viejo y se reemplazó.

## Dónde se ve

1. **Bienvenida, Login y Registro:** el enlace "Aviso legal · Privacidad · Cookies" al pie (`PieLegal.tsx`). En Registro, además, la primera capa de información arriba del botón.
2. **Último paso del perfil:** dos casillas sin marcar, el aviso y el consentimiento de datos de salud (`Consentimiento.tsx`).
3. **Perfil › Cuenta › Legal y privacidad:** el aviso aceptado (fecha y versión) y "Datos de salud" con Retirar o Dar consentimiento (`FilasLegales.tsx`).
4. **Página `/aviso-legal`:** pública, con "En resumen", el aviso de dolor siempre a la vista y 17 secciones plegables.
5. **Pantalla para aceptar** (`AceptarAviso.tsx`): para las cuentas que no aceptaron la versión vigente.

## Lo que falta antes de publicar

- **Cambiar de IA:** las condiciones de Gemini no permiten el plan gratuito en apps para usuarios del EEE. Cuando se cambie, actualizar las secciones 4, 8 y 9 y la casilla de salud (nombra a Google Gemini).
- **Revisión de un abogado:** la cláusula de responsabilidad, el consentimiento que se retira sin borrar los datos, el art. 32 de la LOPDGDD (bloqueo frente al borrado al instante), el registro de actividades (art. 30) y la evaluación de impacto (art. 35), que probablemente son obligatorios.
- **Comprobar** en dataprivacyframework.gov las certificaciones de Google, Vercel y Neon.

## Si el aviso cambia

Subir la versión en `backend/app/legal.py` (`LEGAL_VERSION`) y en `frontend/src/lib/legal.ts` (`VERSION_AVISO`, con la fecha): las cuentas que aceptaron otra versión vuelven a ver la pantalla para aceptar.
