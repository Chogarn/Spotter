// Datos del aviso legal en un solo lugar. La versión tiene que coincidir con `backend/app/legal.py`:
// si se sube, las cuentas que aceptaron otra vuelven a ver la pantalla para aceptar.
export const VERSION_AVISO = "1.0";
export const FECHA_AVISO = "12 de noviembre de 2026";

// Quién es el responsable de los datos y cómo contactarlo (RGPD, art. 13).
// Confirmados por el usuario el 2026-11-12 (el correo es el Gmail de Spotter que manda los mails).
export const RESPONSABLE = "Bruno Muzzio";
export const CORREO_CONTACTO = "spotter.gym.app.ia@gmail.com";

export const EDAD_MINIMA = 18;

// El texto de la casilla de salud: el mismo en el perfil, la pantalla para aceptar y el Perfil.
export const TEXTO_CONSENTIMIENTO_SALUD =
  "Consiento que Spotter use mis datos de salud (limitaciones, peso, altura, grasa corporal y lo que cuente de dolor o cansancio) para armar mis rutinas, y que los mande a Google Gemini para generarlas.";
export const TEXTO_ACEPTO_AVISO = "Leí el aviso legal y entiendo que Spotter no es consejo médico.";
