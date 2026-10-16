import { useSyncExternalStore } from "react";

const sinSuscripcion = () => () => {};

// El código que viaja en la dirección de los enlaces de los correos (`?token=...`). Se lee solo en
// el navegador: así la pantalla se prepara sin esperar datos del servidor y no depende de que
// llegue el resto de la página por partes.
// `undefined` = todavía no se leyó (se está preparando la página); "" = la dirección no trae código.
export function useTokenDeLaDireccion(): string | undefined {
  return useSyncExternalStore(
    sinSuscripcion,
    () => new URLSearchParams(window.location.search).get("token") ?? "",
    () => undefined,
  );
}
