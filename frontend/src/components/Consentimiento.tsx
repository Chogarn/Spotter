import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { RESPONSABLE, TEXTO_ACEPTO_AVISO, TEXTO_CONSENTIMIENTO_SALUD } from "@/lib/legal";

// La primera capa de información (art. 11 LOPDGDD) y las dos casillas, separadas y sin marcar: la del
// aviso legal y la del consentimiento de datos de salud (art. 9 RGPD). Se usan en el último paso del
// perfil y en la pantalla para aceptar de las cuentas que ya existían. El enlace va fuera de las
// etiquetas, para que tocar el texto marque la casilla y no abra la página.
export function CasillasLegales({
  aviso,
  salud,
  onAviso,
  onSalud,
}: {
  aviso: boolean;
  salud: boolean;
  onAviso: (v: boolean) => void;
  onSalud: (v: boolean) => void;
}) {
  return (
    <div>
      <p className="mt-0 mb-3 text-[15px] leading-snug text-muted-foreground">
        Spotter es un proyecto de {RESPONSABLE}. Registramos tu entrenamiento y una IA de Google (Gemini) te propone rutinas que
        vos aceptás o descartás. A la IA no le llega tu nombre ni tu correo. Podés retirar tu permiso o borrar todo cuando quieras,
        y reclamar ante la AEPD.
      </p>
      <div className="flex items-start gap-3 rounded-2xl bg-card p-4">
        <Checkbox id="acepto-aviso" checked={aviso} onCheckedChange={(v) => onAviso(v === true)} className="mt-0.5" />
        <Label htmlFor="acepto-aviso" className="leading-snug font-normal">
          {TEXTO_ACEPTO_AVISO}
        </Label>
      </div>
      <div className="mt-2 flex items-start gap-3 rounded-2xl bg-card p-4">
        <Checkbox id="acepto-salud" checked={salud} onCheckedChange={(v) => onSalud(v === true)} className="mt-0.5" />
        <Label htmlFor="acepto-salud" className="leading-snug font-normal">
          {TEXTO_CONSENTIMIENTO_SALUD}
        </Label>
      </div>
      <p className="mt-2 mb-0 text-sm text-muted-foreground">Podés retirar el consentimiento desde Perfil › Cuenta.</p>
      <p className="mt-3 mb-0">
        <Link href="/aviso-legal" target="_blank" className="font-medium text-disco-azul underline underline-offset-2">
          Leer el aviso legal completo
        </Link>
      </p>
    </div>
  );
}
