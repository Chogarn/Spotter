import { Alert, AlertDescription } from "@/components/ui/alert";

// Mensaje de error de una pantalla. Un solo lugar para que todos los errores se vean igual.
export function ErrorMessage({ children }: { children: React.ReactNode }) {
  return (
    <Alert variant="destructive" role="alert">
      <AlertDescription className="whitespace-pre-wrap">{children}</AlertDescription>
    </Alert>
  );
}

// Error corto dentro de una fila (una serie, un ejercicio), donde un recuadro sería demasiado.
export function InlineError({ children }: { children: React.ReactNode }) {
  return (
    <small role="alert" className="text-destructive">
      {children}
    </small>
  );
}
