import type { Metadata } from "next";

import { Franja } from "@/components/Franja";
import { CORREO_CONTACTO, EDAD_MINIMA, FECHA_AVISO, RESPONSABLE, VERSION_AVISO } from "@/lib/legal";

export const metadata: Metadata = { title: "Aviso legal · Spotter" };

// El aviso legal, la privacidad y las cookies (borrador de producto pendiente de revisión legal,
// informe del 2026-11-12). Pública, con o sin sesión. "En resumen" y el aviso de dolor van siempre a
// la vista; el detalle, en secciones que se despliegan (sin JavaScript: <details>).

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <details id={id} className="group mb-2 rounded-xl bg-card">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3.5 text-base font-semibold [&::-webkit-details-marker]:hidden">
        {titulo}
        <span
          aria-hidden="true"
          className="size-2.5 shrink-0 rotate-45 border-r-2 border-b-2 border-foreground transition-transform group-open:-rotate-135"
        />
      </summary>
      <div className="px-4 pb-4 text-[15px] leading-relaxed [&_p]:mt-0 [&_p]:mb-3">{children}</div>
    </details>
  );
}

function Tabla({ columnas, filas }: { columnas: string[]; filas: React.ReactNode[][] }) {
  return (
    <div className="mb-3 overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            {columnas.map((c) => (
              <th key={c} className="border-b border-border px-1.5 py-1.5 text-left text-xs font-semibold uppercase text-muted-foreground">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila, i) => (
            <tr key={i}>
              {fila.map((celda, j) => (
                <td key={j} className="border-b border-border px-1.5 py-2 align-top">
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function AvisoLegalPage() {
  return (
    <main className="flex flex-1 flex-col pb-12">
      <Franja titulo="Aviso legal, privacidad y cookies" aros="verde" volver={{ href: "/" }} compacta />
      <div className="mx-auto w-full max-w-xl px-4 pt-5">
        <p className="mt-0 mb-4 text-sm text-muted-foreground">
          Versión {VERSION_AVISO} · Última actualización: {FECHA_AVISO} · Cambio: la IA pasa de Google Gemini a Cloudflare Workers AI.
        </p>

        <section aria-labelledby="resumen" className="rounded-2xl bg-card px-4 pt-4 pb-1">
          <h2 id="resumen" className="mt-0 mb-3 text-2xl">En resumen</h2>
          <ul className="m-0 grid gap-2.5 pl-5 text-[15px] leading-snug">
            <li>Spotter es un proyecto personal de aprendizaje, gratuito y sin fines comerciales. <b>No es consejo médico.</b></li>
            <li>Una inteligencia artificial (Cloudflare Workers AI) te propone la semana. <b>Puede equivocarse, y nada cambia hasta que lo aceptás.</b></li>
            <li>Para tus datos de salud (limitaciones, peso, grasa corporal y lo que cuentes de dolor o cansancio) te pedimos un <b>permiso aparte</b>, que podés retirar.</li>
            <li>A la IA nunca le mandamos tu nombre, tu correo ni tu contraseña.</li>
            <li>No hay publicidad ni analítica: solo la cookie de tu sesión y lo que tu navegador guarda para que no pierdas lo que cargás.</li>
            <li className="mb-3">Podés borrar tu cuenta y todo lo tuyo al instante, desde <b>Perfil › Cuenta › Borrar cuenta</b>.</li>
          </ul>
        </section>

        <section aria-labelledby="dolor" className="my-4 rounded-2xl border-2 border-disco-amarillo bg-disco-amarillo/15 px-4 py-3.5">
          <h2 id="dolor" className="mt-0 mb-2 flex items-center gap-2 text-xl">
            <span aria-hidden="true" className="flex size-6 items-center justify-center rounded-full bg-disco-amarillo text-base text-foreground">!</span>
            Importante: si sentís dolor
          </h2>
          <p className="m-0 text-[15px] leading-relaxed">
            Una molestia muscular leve después de entrenar puede ser normal. <b>Pará enseguida y consultá a un profesional</b> si
            sentís dolor fuerte, punzante o que no se va, dolor en reposo, hormigueo, mareo, náuseas, falta de aire o dolor en el
            pecho. Spotter no puede evaluar tu caso. Si querés que la próxima semana lo tenga en cuenta, contalo en el comentario
            al cerrar la semana: la IA puede bajar la carga o cambiar un ejercicio por prudencia, pero eso no es un tratamiento.
          </p>
        </section>

        <h2 className="mt-6 mb-3 text-sm font-semibold tracking-wide text-muted-foreground uppercase">Todo el detalle</h2>

        <Seccion id="quien" titulo="1. Quién está detrás">
          <p>
            Spotter lo hace y lo mantiene {RESPONSABLE}, estudiante, como proyecto personal de aprendizaje. Es el responsable del
            tratamiento de tus datos. Contacto: {CORREO_CONTACTO}. No hay Delegado de Protección de Datos porque la ley no lo exige
            para un proyecto así.
          </p>
        </Seccion>

        <Seccion id="que-es" titulo="2. Qué es Spotter">
          <p>
            Una herramienta para registrar y planificar entrenamiento de gimnasio con fines de bienestar y estado físico general.
            Vos registrás lo que hacés y, cuando querés, una IA te propone la semana siguiente. Es gratuita, no tiene publicidad y no
            vende nada.
          </p>
        </Seccion>

        <Seccion id="medico" titulo="3. No es consejo médico">
          <p>
            Spotter no tiene finalidad médica: <b>no diagnostica, no previene, no trata ni rehabilita enfermedades ni lesiones</b>, y
            no reemplaza a un médico, kinesiólogo o profesional del entrenamiento. Las propuestas son generales y orientativas, y solo
            tienen en cuenta lo que cargaste. Consultá a un médico antes de empezar o cambiar un programa de ejercicio, sobre todo si
            tenés una lesión, una enfermedad, un embarazo o dudas.
          </p>
        </Seccion>

        <Seccion id="ia" titulo="4. Las propuestas de la IA">
          <p>
            &quot;Generar rutina&quot; usa una inteligencia artificial de Cloudflare (Workers AI) para proponerte la semana a partir de tus datos
            (ver la sección 8) y de reglas de entrenamiento que aplica el propio código de Spotter (cantidad mínima de series,
            reparto entre días y subidas de peso de a poco, entre otras). <b>La IA puede equivocarse.</b> Los pesos, las series y las
            repeticiones son sugerencias: ajustalos a cómo te sentís y a tu técnica.
          </p>
          <p>
            Antes de aceptar ves la propuesta completa, la aceptás o la descartás, y <b>nada se aplica sin que la aceptes</b>. Esto
            es armar un perfil de entrenamiento con tus datos, pero no es una decisión automática con efectos legales sobre vos. Si no
            querés que se use así, podés no usar &quot;Generar rutina&quot;, retirar tu consentimiento de salud u oponerte escribiendo
            a {CORREO_CONTACTO}.
          </p>
        </Seccion>

        <Seccion id="edad" titulo="5. Edad mínima">
          <p>Para usar Spotter tenés que tener <b>{EDAD_MINIMA} años o más</b>. Si no llegás, la app no te deja terminar el perfil.</p>
        </Seccion>

        <Seccion id="datos" titulo="6. Qué datos guardamos y para qué">
          <Tabla
            columnas={["Datos", "Para qué", "Base legal"]}
            filas={[
              ["Correo y contraseña (cifrada, nunca en claro)", "Tu cuenta, iniciar sesión y los enlaces de verificación, recuperación y cambio de correo", "Necesario para darte el servicio"],
              ["Nombre, fecha de nacimiento (se muestra la edad) y sexo", "Personalizar la app; la edad y el sexo ajustan la propuesta", "Necesario para darte el servicio"],
              ["Peso, altura, mediciones (peso y grasa corporal opcional) e IMC calculado (no se guarda)", "Tu evolución; la edad, el peso y la altura ajustan la propuesta", <b key="c">Tu consentimiento explícito</b>],
              ["Limitaciones (opcionales) y tu comentario al cerrar la semana (hasta 1.000 caracteres)", "Que la propuesta tenga en cuenta lesiones, dolor o cansancio", <b key="c">Tu consentimiento explícito</b>],
              ["Rutinas, semanas, lo planificado y lo realizado (series, pesos, repeticiones, minutos, duración, entrada en calor)", "Registrar, ver tu progreso y armar la semana siguiente", "Necesario para darte el servicio"],
              ["Intentos de inicio de sesión (correo e IP)", "Frenar ataques a las contraseñas", "Interés legítimo en la seguridad"],
              ["Un contador de cada llamada a la IA, sin el contenido", "No pasar los límites gratuitos del proveedor", "Interés legítimo; al borrar tu cuenta queda sin dueño y no te identifica"],
            ]}
          />
          <p>
            Si en versiones anteriores marcaste cómo te cayó un ejercicio o si te dolió, esas marcas siguen guardadas en tu cuenta,
            pero ya no se piden ni se mandan a la IA. El correo, la contraseña, el nombre, la fecha de nacimiento, el sexo, el peso y
            la altura son obligatorios: sin ellos la app no funciona y la propuesta no tiene sentido.
          </p>
        </Seccion>

        <Seccion id="salud" titulo="7. Tus datos de salud y tu permiso">
          <p>
            Las limitaciones, el peso, la altura, la grasa corporal y lo que cuentes de dolor o cansancio pueden decir algo de tu
            salud. Por eso te pedimos un consentimiento explícito, en una casilla que viene <b>sin marcar</b> y es aparte de la del
            aviso legal. Guardamos la fecha y la versión de lo que aceptaste para poder demostrarlo.
          </p>
          <p>
            Podés retirarlo cuando quieras desde <b>Perfil › Cuenta › Datos de salud</b> o escribiendo a {CORREO_CONTACTO}. Retirarlo
            no afecta lo que se hizo antes. Desde ese momento &quot;Generar rutina&quot; queda desactivado y no se manda nada más a la IA;
            podés volver a darlo desde el mismo lugar. Si además querés que se borren tus datos, borrá tu cuenta.
          </p>
        </Seccion>

        <Seccion id="que-se-manda" titulo="8. Qué se manda a la IA">
          <p>
            Cuando tocás &quot;Generar rutina&quot;, y solo entonces, se manda a Cloudflare Workers AI: tu edad, peso, altura, sexo, las limitaciones
            que escribiste, el objetivo, el nivel, los días y la estructura elegidos y, si continuás una rutina, lo planificado y lo
            realizado de la semana anterior y tu comentario de cierre. <b>Nunca se mandan tu nombre, tu correo, tu contraseña ni tus
            mediciones de grasa corporal.</b> Para elegir ejercicios del catálogo también se manda un texto con el objetivo y el nivel,
            sin datos tuyos. No escribas en las limitaciones ni en el comentario nada que no quieras compartir.
          </p>
        </Seccion>

        <Seccion id="proveedores" titulo="9. Proveedores y dónde están tus datos">
          <Tabla
            columnas={["Proveedor", "Qué hace", "Dónde"]}
            filas={[
              ["Vercel Inc. (EE. UU.)", "Aloja la app y el servidor", "Frankfurt (Alemania)"],
              ["Neon / Databricks, Inc. (EE. UU.)", "Base de datos", "Frankfurt (Alemania)"],
              ["Cloudflare, Inc.: Workers AI (EE. UU.)", "Genera la propuesta. Según Cloudflare, no usa tu contenido para entrenar modelos ni lo guarda después de responder", "Sin ubicación fija: puede procesarse fuera de la UE"],
              ["Google LLC: Gmail (EE. UU.)", "Manda los correos de verificación, recuperación y cambio de correo", "Servidores de Google"],
            ]}
          />
          <p>
            Son empresas de EE. UU., así que puede haber acceso desde allá. Esas transferencias se amparan en el Marco de Privacidad
            de Datos UE-EE. UU. y, de forma complementaria, en las cláusulas contractuales tipo de la Comisión Europea, cuando el
            proveedor las ofrece. No vendemos ni cedemos tus datos a nadie más.
          </p>
        </Seccion>

        <Seccion id="plazos" titulo="10. Cuánto tiempo los guardamos">
          <p>
            Tu cuenta, tu perfil, tus entrenamientos y tus mediciones se guardan <b>mientras tengas la cuenta</b>. Las mediciones
            también podés borrarlas una por una. Al tocar &quot;Borrar cuenta&quot; se borran al instante. Los registros que no se
            verifican se eliminan al vencer el enlace. Los borradores que guarda tu navegador duran lo que dice la sección 12.
          </p>
        </Seccion>

        <Seccion id="derechos" titulo="11. Tus derechos">
          <p>
            Podés pedir acceso a tus datos, corregirlos, borrarlos, limitar su uso, oponerte, llevártelos en un formato estándar
            (portabilidad) y retirar tu consentimiento. Mucho lo hacés vos en la app: editar el perfil, borrar mediciones, Cambiar
            correo, Cambiar contraseña, Datos de salud y Borrar cuenta (Perfil › Cuenta). Para lo demás, por ejemplo una copia de tus
            datos, escribí a {CORREO_CONTACTO} y te respondemos en un mes como máximo.
          </p>
          <p>
            Si creés que no respetamos tus derechos, podés reclamar ante la Agencia Española de Protección de Datos
            (<a href="https://www.aepd.es" className="underline">www.aepd.es</a>).
          </p>
        </Seccion>

        <Seccion id="cookies" titulo="12. Cookies y almacenamiento del navegador">
          <p>
            Spotter <b>no usa cookies de publicidad ni de analítica</b>, ni de terceros. Solo usa lo necesario para funcionar:
          </p>
          <Tabla
            columnas={["Qué", "Para qué", "Cuánto dura"]}
            filas={[
              ["Cookie spotter_session (propia, no accesible desde JavaScript)", "Mantener tu sesión iniciada", "Sin \"Recordarme\": 12 horas como máximo y se borra al cerrar el navegador. Con \"Recordarme\": 30 días en este aparato"],
              ["Almacenamiento local: borrador del perfil", "No perder lo que cargaste si salís a mitad", "Hasta 7 días o hasta terminar"],
              ["Almacenamiento local: borrador de \"Generar rutina\"", "Volver a lo que elegiste si falla la generación", "Hasta 2 días, o hasta generar o cancelar"],
              ["Almacenamiento local y de sesión: cronómetro y reloj de descanso", "Que el tiempo siga al cambiar de pantalla", "Mientras lo uses o hasta cerrar la pestaña"],
            ]}
          />
          <p>
            La casilla &quot;Recordarme&quot; del inicio de sesión viene sin marcar: marcala si querés que la sesión dure 30 días en ese
            aparato. Si un día sumamos otras cookies, te vamos a pedir permiso antes.
          </p>
        </Seccion>

        <Seccion id="seguridad" titulo="13. Seguridad">
          <p>
            Las contraseñas se guardan con un cifrado de un solo sentido (argon2), la cookie de sesión no es accesible desde
            JavaScript, se limitan los intentos de inicio de sesión y la conexión va cifrada (HTTPS). Ningún sistema es infalible: si
            detectamos un problema que afecte tus datos, te vamos a avisar según lo que pide la ley.
          </p>
        </Seccion>

        <Seccion id="responsabilidad" titulo="14. Responsabilidad">
          <p>
            Spotter es un proyecto de aprendizaje, gratuito, y se ofrece como está. No garantizamos que esté siempre disponible ni
            libre de errores, ni que logres un resultado concreto: eso depende de cada persona. Revisá cada propuesta antes de
            aceptarla, ajustá o descartá lo que no te sirva y respetá lo que te indique tu médico. Entrenar tiene riesgos propios, y
            vos decidís cómo y cuánto entrenás. <b>Nada de este aviso limita la responsabilidad que la ley no permite limitar</b>,
            como la que surge del dolo o de los daños a la vida o a la salud causados por culpa de quien ofrece el servicio.
          </p>
        </Seccion>

        <Seccion id="cambios" titulo="15. Cambios en este aviso">
          <p>
            Si cambiamos algo importante, lo vas a ver en la app antes de seguir usándola, con un resumen de qué cambió. Si cambia algo
            de tu consentimiento de salud, te lo vamos a pedir de nuevo. Si no estás de acuerdo, podés dejar de usar Spotter y borrar
            tu cuenta.
          </p>
        </Seccion>

        <Seccion id="ley" titulo="16. Ley aplicable">
          <p>
            Este aviso se rige por la ley española. Si sos consumidor, nada de esto te quita la protección de las leyes de tu país de
            residencia ni el derecho a ir a los tribunales de tu domicilio.
          </p>
        </Seccion>

        <Seccion id="contacto" titulo="17. Contacto">
          <p>{CORREO_CONTACTO}, para cualquier pregunta sobre tus datos o sobre este aviso.</p>
        </Seccion>
      </div>
    </main>
  );
}
