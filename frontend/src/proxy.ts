import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Nombre de la cookie de sesión que pone el backend (backend/app/security.py).
const COOKIE = "spotter_session";
const PUBLICAS = ["/bienvenida", "/login", "/registro"];

// Chequeo OPTIMISTA: solo mira si hay cookie de sesión, sin validarla (eso lo hace la API, que
// responde 401 si el token no sirve). Sirve para no mostrar pantallas protegidas a quien no
// inició sesión.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLICAS.includes(pathname)) return NextResponse.next();
  // Sin sesión, la raíz muestra la bienvenida (la dirección sigue siendo "/").
  if (pathname === "/" && !request.cookies.has(COOKIE)) {
    return NextResponse.rewrite(new URL("/bienvenida", request.url));
  }
  if (!request.cookies.has(COOKIE)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  // Todas las rutas menos los archivos internos de Next y los estáticos.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
