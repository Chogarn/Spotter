import Link from "next/link";

import { cn } from "cn";

// El enlace permanente al aviso legal, al pie de las pantallas sin sesión.
export function PieLegal({ className }: { className?: string }) {
  return (
    <p className={cn("mt-8 mb-0 text-center text-sm", className)}>
      <Link href="/aviso-legal" className="font-medium underline underline-offset-2">
        Aviso legal · Privacidad · Cookies
      </Link>
    </p>
  );
}
