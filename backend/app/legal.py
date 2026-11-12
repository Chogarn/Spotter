"""La versión vigente del aviso legal y del consentimiento de datos de salud.

Cuando el texto de `/aviso-legal` cambie en algo importante, subir esta versión (y la del frontend,
`lib/legal.ts`): las cuentas que aceptaron otra versión vuelven a ver la pantalla para aceptar.
"""

LEGAL_VERSION = "1.0"

# Edad mínima para usar Spotter (decisión del usuario, 2026-11-12): la piden las condiciones de los
# proveedores de IA, aunque en España se consiente desde los 14.
MIN_AGE = 18
