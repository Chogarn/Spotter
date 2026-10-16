# Sistema de diseño "Disco" de Spotter

Documento del sistema tal como **está hoy en el código** (2026-10-15) y auditoría de lo que se
aparta de él. Está hecho leyendo `frontend/src` sin modificar nada. Las decisiones de diseño
son del usuario (`docs/decisiones.md`, 41 a 44 y 47 a 55): lo que sigue propone, no decide.

## 1. El sistema

### Idea
Los discos de pesas. Gris cemento de fondo, tinta azul noche para el texto y los botones
principales, y los colores de los discos de competición para los estados. La app es siempre
clara. Los números y títulos van en Barlow Condensed (como las placas de una máquina) y el
texto en Barlow.

### Colores (`globals.css`)

| Token | Valor | Significado | Cómo se usa |
|---|---|---|---|
| `disco-tinta` | `#172033` | texto, botón principal, "hoy" | relleno y texto |
| `disco-rojo` | `#d7263d` | serie o ejercicio hecho, semana en curso, logo | **relleno**, nunca como error |
| `disco-azul` | `#1f5fbf` | la carga (kg), **el día que toca hoy** (aro), **el récord**, selección, foco | texto grande, aros, relleno |
| `disco-amarillo` | `#f2c230` | avisos y propuesta pendiente | borde o relleno |
| `disco-verde` | `#2e9e5b` | día completado, cumplido, semana cerrada | **relleno**, no texto |
| `disco-verde-texto` | `#1c7040` | verde para texto | texto chico |
| `disco-amarillo-texto` | `#6b5000` | amarillo para texto | texto chico |
| `destructive` | `#c41f35` | error | texto e íconos de error |
| `background` / `card` | `#e9ecee` / `#ffffff` | fondo y tarjetas | |
| `muted` / `muted-foreground` | `#dde2e7` / `#4a5568` | fondos suaves y texto secundario | |
| `border` / `input` | `#cbd2d9` / `#a9b2bd` | bordes | |

### Estados (los discos, `Disco.tsx`)

| Estado | Dibujo | Dónde |
|---|---|---|
| Serie o ejercicio hecho | disco **rojo** lleno, borde tinta | día, modo entrenar |
| Día completado | disco **verde** lleno | semana, Inicio, Rutinas, Progreso |
| Día a medias | borde rojo, sin relleno | semana, Rutinas |
| Pendiente | borde punteado gris | semana, Rutinas |
| Hoy (el próximo día) | aro **azul** sólido | Inicio y Entrenar |
| Día entrenado (calendario) | disco **verde** con el número del día; hoy con aro azul | Progreso, Calendario |
| No llegaste | borde **amarillo** (aviso, no error) | Progreso |

### Tipografía
- **Títulos** (`h1`, `h2`): Barlow Condensed 700, interlineado 1.05. `h1` global de 2.5 rem; cada
  pantalla lo agranda con `text-4xl` a `text-7xl`.
- **Números y nombres en tarjetas:** `font-heading` con `font-bold`.
- **Texto:** Barlow. Secundario en `text-muted-foreground`, chico en `text-sm` o `text-xs`.

### Forma
- **Botones:** píldora (`border-radius: 9999px` global a `[data-slot="button"]`). Principal oscuro,
  secundario `outline`, `ghost` para íconos. Tamaños de `ui/button`: default 32 px, `lg` 36 px,
  `icon-lg` 36 px. Los principales de pantalla se agrandan a mano (`h-12 w-full text-base`).
- **Tarjetas:** `rounded-2xl bg-card p-4` (o `p-5`). La tarjeta que importa lleva
  `border-2 border-disco-tinta`.
- **Opciones del asistente:** `rounded-2xl`, borde azul cuando está elegida.
- **Radio base:** `--radius: 0.875rem`.

### Patrones
- **Encabezado oscuro** con un disco asomando (Inicio, acceso, bienvenida).
- **Asistente** de una pregunta por pantalla (`Asistente.tsx`): progreso, flecha, Cancelar, Continuar.
- **Barra de abajo** fija con Entrenar elevado.
- **Carga:** barra con discos que se suman (`Cargando.tsx`); generación en pantalla completa.
- **Lectura de un día:** tarjeta por ejercicio con disco(s), se despliega al tocar.

## 2. Auditoría

**Qué se revisó:** `globals.css`, 28 componentes propios, 11 de `components/ui` y las pantallas de
`app/`. Búsqueda de colores sueltos, valores arbitrarios, estilos en línea y repeticiones.
**No se midió** en un celular real ni se probó con lector de pantalla; los contrastes sí se calcularon
(WCAG) con los valores del código.

### Resumen
| | |
|---|---|
| Colores fuera de la paleta | **0** colores de Tailwind por defecto; 2 hex sueltos (en la regla de números del asistente) |
| Valores arbitrarios | 12 tipos; el más repetido, `text-[1.35rem]` (5 veces) |
| Estilos en línea | 7, todos de medidas calculadas o `pre-wrap` |
| Componentes de shadcn sin usar | `Card` y `Badge` (0 usos) |
| Consistencia general | **buena en color y forma; floja en botones, títulos y espacios** |

### Hallazgos, por prioridad

#### Alta
1. **Los botones principales se arman a mano en cada pantalla.** `ui/button` define alturas de 32 y
   36 px, y la app las pisa con `h-12 w-full text-base` (6 veces), `h-11 w-full text-base` (2) y
   variantes con margen. No hay un tamaño "principal de pantalla". Es la raíz de lo que ves
   "diferente" en los accesos y botones. *Se arregla definiendo un tamaño (`xl`) y una variante
   en `button.tsx`.*
2. **Progreso y Estadísticas no hablan en discos.** Todo el resto muestra estados con discos
   (rojo, verde, punteado). Progreso usa dos cuadros con fondo translúcido (verde y amarillo) y flechas
   de texto ("↑ Subiste en…", "↓ Te costó…"); el gráfico usa bandas translúcidas rojo, azul, verde
   y amarillo por rutina. Hay dos problemas puntuales:
   - **El rojo de las bandas del gráfico** (`fill-disco-rojo/15`) contradice la regla "rojo =
     hecho", y es el mismo rojo de los puntos de datos.
   - **"Llegaste" y "no llegaste" no tienen un dibujo propio:** hoy es color + texto, no el disco.
3. **Los accesos de Inicio son tarjetas genéricas.** Cuatro tarjetas blancas con un ícono de línea
   (lucide) y texto, sin ningún elemento de los discos. "Nueva rutina" además es un `<button>` con
   las clases copiadas a mano de `Acceso` (un `<Link>`): dos implementaciones del mismo diseño.

#### Media
4. **Tres alturas de arriba en las pantallas:** `pt-8` (Entrenar, Perfil, Progreso, Rutinas), `pt-6`
   (Rutina, Semana, Día) y `pt-4` (modo entrenar). Entre pantallas contiguas el contenido salta.
5. **Tamaños de título sin escala:** los `h1` usan `text-4xl`, `5xl`, `6xl` y `7xl`, y algunos no
   tienen ninguno (2.5 rem global). Los nombres en tarjeta usan `text-[1.35rem]` (5 veces) y a la
   vez `text-2xl` en otras. Falta una escala nombrada (display, título, tarjeta, número).
6. **Dos radios para lo mismo:** tarjetas con `rounded-2xl` (37) y datos o campos con `rounded-xl`
   (19), sin criterio visible. Y una tercera, el tilde de `Checkbox` (`rounded-[4px]`).
7. **El recuadro "importante" se repite 7 veces** (`border-2 border-disco-tinta bg-card p-5`) sin ser
   un componente: Hoy te toca, Cerrar semana, Cambiar ejercicio, el ejercicio en curso, etc.
8. **Dos componentes de shadcn sin usar** (`Card`, `Badge`) con sus estilos; y `Card` trae `ring-1`
   y `rounded-xl` propios, ajenos a Disco. Conviene sacarlos o adaptarlos para que nadie los use por error.

#### Baja
9. **Colores sin token:** `#172033` y `#9aa3ae` en el degradé de la regla (`Asistente.tsx`); el gris
   de las marcas cortas no existe como token. `#172033` ya es `--disco-tinta`: está repetido.
10. **Texto de 10 y 11 px** en el gráfico (`text-[10px]` y `text-[11px]`, 3 veces en `EvolucionEjercicio.tsx`); 12 px es el piso habitual.
11. **Foco con dos estilos:** anillo azul de 3 px en componentes y un `outline` de 2 px en enlaces
    sueltos (`globals.css`). Se ven distintos.
12. **El modo oscuro está definido y no se usa** (decisión del usuario). Hoy es un bloque de 30
    líneas que nadie prueba; riesgo de quedar desfasado.

### Contrastes (WCAG, calculados con los valores del código)

| Combinación | Relación | Lectura |
|---|---|---|
| Texto tinta sobre fondo | 13,7 | muy bien |
| Gris secundario sobre fondo | 6,3 | bien |
| Gris secundario sobre blanco | 7,5 | bien |
| Rojo de error sobre fondo | 4,9 | bien (mínimo 4,5) |
| Azul sobre blanco | 6,1 | bien |
| Verde para texto sobre blanco | 6,1 | bien |
| Amarillo para texto sobre blanco | 7,6 | bien |
| **Blanco sobre verde disco** | **3,4** | **justo para el tilde/número de un día completado: bajo el 4,5 de texto chico** |
| **Gris del disco "pendiente"** | **3,1** | **bajo el mínimo para texto de 12 px** |
| **Amarillo disco sobre fondo gris** | **1,4** | **no sirve para nada que se tenga que leer** (logo y líneas: decorativo) |
| Borde de tarjeta sobre fondo | 1,3 | solo decorativo; las tarjetas se distinguen por el blanco |

Lo que sale de esta tabla: el **amarillo y el verde del disco** son para rellenos y bordes, como ya
dice el CSS. La excepción real es el número dentro del disco verde (blanco, 3,4).

### Tamaños táctiles
`Button` default mide **32 px** y los de ícono (`icon-lg`) **36 px**; hay 15 botones de ícono. Lo
habitual para tocar con el dedo es 44 px. Los botones grandes ya llegan; los de ícono no.

## 3. Qué haría, en orden

**Hecho el 2026-10-15 (hallazgos 1 y 3):** nuevo tamaño `xl` en `ui/button.tsx` (48 px, texto
`base`) en lugar de las 19 combinaciones `h-11`/`h-12` + `text-base` armadas a mano; los
botones "Generar la semana siguiente" y "Empezar una rutina nueva" de Inicio, que medían 32 px,
ahora usan `xl`; y un solo componente de tarjeta de acceso (`TarjetaAcceso.tsx`, enlace o botón) en
lugar de dos copias.

**Hecho el 2026-10-15 (hallazgo 2):** Progreso y Estadísticas con discos. En "Cómo te fue" cada
ejercicio lleva su disco (verde superaste, rojo cumpliste, borde amarillo no llegaste, punteado sin
registrar) con su leyenda; en el gráfico, las rutinas se separan con fondos grises (sin rojo) y los
puntos son discos con borde de tinta, con el récord en **azul**. `Disco.tsx` suma el estado `aviso`.
El perfil lleva franja oscura arriba, como Inicio, y los datos siguen en tarjetas (sin discos, por decisión del usuario). Queda pendiente mostrar cuánto subió cada ejercicio ("subiste 2,5 kg"): el servidor hoy solo manda la
señal, no la diferencia. Lo que sigue es lo que falta:

1. ~~**Fijar los botones** (hallazgos 1 y 3)~~ — hecho (arriba). Falta decidir si los accesos de Inicio
   llevan algún detalle de disco (hoy son tarjetas blancas con ícono de línea).
2. ~~**Rediseñar Progreso y Estadísticas con discos**~~ — hecho (arriba).
3. **Escala de títulos y de espacios** (4 y 5): tres alturas de arriba y cuatro tamaños de título
   con nombre, y reemplazar los valores sueltos.
4. **Un componente de recuadro importante** (7) y retirar `Card` y `Badge` (8).
5. **Accesibilidad** (contrastes y táctiles): cuando se haga el pase de accesibilidad antes del
   despliegue.

## 4. Lo que no pude comprobar
- Cómo se ve en tu celular real: solo en el navegador del panel y en el emulador.
- Si los lectores de pantalla anuncian bien las ruedas y la regla del asistente.
- Si el amarillo sobre fondo claro cumple lo que querés; es decisión tuya. El logo es definitivo desde el 2026-10-16 (decisión 76): SPOTTER con la O hecha un disco rojo, sin amarillo ni azul.
