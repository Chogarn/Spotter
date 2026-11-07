import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Condensed } from "next/font/google";
import "./globals.css";

// Diseño "Disco" (decisión 41): Barlow para el texto y Barlow Condensed para números y títulos.
// No son fuentes variables, así que se cargan solo los pesos que se usan.
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Condensed({
  variable: "--font-barlow-condensed",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: "Spotter",
  description: "Entrenador de gimnasio con IA que arma tu semana según tu progreso real.",
  // App instalada en iPhone (desde "Agregar a pantalla de inicio"): abre sin la barra de Safari
  // y con este nombre bajo el ícono (`apple-icon.png`). La barra de la hora va en negro: el
  // iPhone no acepta otro color ahí sin que la página se dibuje debajo de la hora.
  appleWebApp: { capable: true, title: "Spotter", statusBarStyle: "black" },
};

// El color de la barra de arriba del teléfono (la de la hora): tinta, como la franja.
export const viewport: Viewport = {
  themeColor: "#172033",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es" className={`${barlow.variable} ${barlowCondensed.variable}`}>
      <body>{children}</body>
    </html>
  );
}
