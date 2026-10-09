import Link from "next/link";

// Botón para volver al nivel anterior. Va al principio de la pantalla.
export function BackButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <p>
      <Link href={href}>
        <button type="button">{children}</button>
      </Link>
    </p>
  );
}
