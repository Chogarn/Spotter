import Link from "next/link";
import { Button } from "@/components/ui/button";

// Botón para volver al nivel anterior. Va al principio de la pantalla.
export function BackButton({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <p>
      <Button nativeButton={false} render={<Link href={href} />}>{children}</Button>
    </p>
  );
}
