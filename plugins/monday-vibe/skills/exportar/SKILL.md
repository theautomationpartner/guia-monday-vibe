---
name: exportar
description: Convierte una app de monday ya desarrollada y probada en el/los prompt(s) óptimos para reconstruirla en monday vibe gastando el mínimo de créditos. Usar cuando el usuario diga "exportar a vibe", "pasar la app a monday vibe", "generar el prompt para vibe", "ya está lista la app" o similar.
---

# /exportar — de la app local al prompt de monday vibe

## Objetivo
monday vibe acepta **prompts de texto + adjuntos** (imágenes PNG/JPG/WEBP/PDF/texto para diseño;
CSV/XLSX para datos). NO importa archivos de código. Cada build adentro de vibe cuesta créditos.
Esta skill lee la app terminada y produce un paquete tan preciso que vibe la reconstruye en **la
menor cantidad de builds posible**.

Regla mental: el prompt no describe *cómo escribiste el código*, describe **qué debe existir y cómo
debe comportarse**, en vocabulario de monday (variant, boards, columnas, componentes Vibe).

---

## 0. Antes de escribir nada

### 0a. Elegí la estrategia
- **A) Código verbatim** (recomendada si el código ya está probado y en el stack Vibe): pegá el código
  exacto con la orden *"construí EXACTO con este código, NO reescribas la lógica"*. Vibe **transcribe**
  en vez de razonar → builds baratos y cortos. (Caso real: app compleja, builds de 17-88 créditos.)
- **B) Spec de comportamiento** (si no hay código propio, o está fuera del stack Vibe): describí qué
  debe existir y cómo se comporta, sin código. Es lo que monday recomienda oficialmente.

⚠️ **Lo caro no es pegar código — es hacer que vibe razone, explore o itere.** Pegar código como
"referencia" y después iterar 20 veces (peor en Opus) es el anti-patrón que quemó miles de créditos.

### 0b. Elementos del "paquete ganador"
Incluí SIEMPRE, arriba de todo:
- **Header de instrucción dura**: *"LEER PRIMERO: construí exacto con esto, no reescribas la lógica,
  no agregues pantallas, no inventes IDs ni columnas, respetá el tema y el idioma."*
- **Lista de NO explícita**: qué NO incluir (paneles, selectores, features de otra fase). Así vibe no
  construye lo que después vas a borrar.
- **Partir la app en PARTES**: una cosa acotada por sesión ("esto es la PARTE 2; el selector es la 3").
- **Reemplazo completo de archivos** entre iteraciones, no "tweakeá esto".

### 0c. Screenshots = contrato visual
Como la app ya se probó, capturá un screenshot de **cada pantalla funcionando** y adjuntalo con
*"reproducí EXACTO el look de estas imágenes"*. Vibe copia la UX/UI/colores en vez de adivinar →
mucha menos iteración visual. En el entregable indicá **qué screenshot va con qué prompt**.

### 0d. Técnicas y límites oficiales de monday
- **Datos por planilla**: un CSV/XLSX de ejemplo → vibe arma la estructura (fila = ítem, columna = campo).
  Límite: **5.000 filas** por archivo (lo que sobra se trunca).
- **Boards por app: el límite DEPENDE DEL PLAN.** El techo técnico de la API es **20 boards**
  (`board_ids` acepta hasta 20) y la cantidad real permitida varía según el tier de la cuenta
  (la doc de monday menciona tanto "5" como "hasta 20" en artículos distintos).
  👉 **No asumas un número: verificalo en la cuenta del cliente** antes de diseñar el modelo de datos.
  Si la app necesita más boards de los que permite ese plan, hay que partirla o reducir el modelo —
  y eso se decide ANTES de gastar créditos.
- **Modo Discuss/Chat** para dudas (no ejecuta código = más barato). Build solo para cambios reales.
- **Si un build sale mal, revertí a la versión anterior** en vez de encadenar prompts de arreglo.
- **Element selection**: apuntar a una parte de la app y promptear sobre eso (edición dirigida y barata).

### 0e. Si la app NO usó nuestras convenciones
Esta skill funciona igual sobre una app hecha "a su manera" (sin `/monday-vibe:iniciar`), porque
**traduce**, no copia. Pero:
1. Evaluá el stack. Si es Next.js / shadcn / MUI / TypeScript / backend exótico → **no** se puede usar
   la estrategia A; usá la B.
2. **Avisá explícitamente qué NO traduce a vibe** (features imposibles, libs sin equivalente).
3. Si es compleja y muy custom, recomendá **`/monday-vibe:adaptar`** primero.

---

## 1. Recolectar (leé el repo, no adivines)
- **Variant** de la app (board view / item view / dashboard widget / object).
- **Modelo de datos**: boards y columnas con **IDs reales** y tipo (mirá `CLAUDE.md` y `src/lib/monday.js`).
- **Pantallas**: nombre de negocio, qué muestra, qué componentes Vibe usa.
- **Interacciones**: qué hace cada acción, qué valida, qué actualiza.
- **Reglas de negocio y edge cases**: vacío, error, cargando, permisos.
- **Idioma de la UI** y detalles visuales propios.

## 2. Estructurar en capas (datos → esqueleto → detalle → pulido)

### ⚖️ Cuántos prompts: POCOS y MUY DETALLADOS

**Dato duro, medido sobre casos reales que salieron baratos:**

| Prompt | Largo | Costó |
|---|---|---|
| Etoile #4 | **907 líneas** | 88 créditos |
| Etoile #2 | **849 líneas** | 84 créditos |
| Dashboard #4 | **66 líneas** | **79 créditos** |
| Etoile #6 | **24 líneas** | 30 créditos |

👉 **El largo del prompt NO mueve el costo.** Un prompt de 900 líneas cuesta casi lo mismo que uno
de 66. Lo que se paga es **cuánto trabaja vibe** (cuánto código genera y razona), no cuánto texto
le mandás.

**Regla que se desprende:**
> **El detalle es gratis. Los builds son caros.**
> Meté TODO el detalle posible en cada prompt y **minimizá la CANTIDAD de prompts.**

**Criterio para partir:** un prompt = todo lo que vibe puede construir y vos podés **verificar de
una sola vez**. Partí solo cuando:
- la verificación se vuelve imposible de una (no sabrías qué falló), o
- una parte necesita un modelo distinto (la lógica pesada en Opus, el resto en Flash).

**Para una app típica: 3 a 5 prompts.** Estructura recomendada:
1. **Datos + esqueleto** (boards, stack, layout, navegación) — Flash
2. **Todas las pantallas** con su comportamiento completo — Sonnet
3. **Motor de cálculo / lógica pesada** (si la hay, aislado) — Opus
4. **Pulido** — Flash

Si te salen 8+, estás fragmentando de más y pagando builds al pedo.

**Prompt 0 — Prerequisito de datos (SIEMPRE primero):**
```
Esta app usa estos boards de monday (conectalos ANTES de construir la UI):
- Board "<Nombre>" (id <ID>) — columnas: <nombre | column_id | tipo>, ...
Conectá estos boards como fuente de datos de la app.
```
> Sin esto, vibe no encuentra los boards, cae a "datos por defecto" y **enmascara el problema**:
> parece que anda y no. Es el error que dejó una app rota tras ~800 créditos.

**Prompt 1 — Scaffold, con las reglas de API y de layout embebidas:**
```
Crear una app de monday tipo <VARIANT>.
Stack: React + Vibe (@vibe/core) + monday-sdk-js.
Acceso a datos SIEMPRE con monday.api() del SDK — NO fetch directo, NO BoardSDK.executeGraphQL().
Toda la UI en <idioma>.

Layout: la app corre EMBEBIDA en un iframe de monday, con espacio acotado.
- Diseño fluido (%, fr, minmax, flex/grid). NADA de anchos fijos en px.
- Sin scroll horizontal de página: las tablas anchas scrollean dentro de su contenedor.
- Las grillas colapsan a una columna en anchos chicos.
- Usar los tokens de Vibe para colores: debe verse bien en tema claro Y oscuro. No hardcodear hex.
- Densidad tipo monday (compacta), no una landing page.

Propósito: <1-2 frases>.
Pantallas: <lista de nombres>.
```

**Prompts 2..N — Una pantalla por prompt:**
```
Pantalla <Nombre>:
- Layout: <componentes Vibe y disposición>.
- Datos que muestra: <campos y de dónde salen>.
- Acciones: <cada botón → qué hace, qué valida, qué actualiza>.
- Estados: vacío / cargando / error.
```

**Lógica pesada (cálculos, reglas condicionales):** en su **propio prompt**, con las reglas exactas
**en tabla** (entrada → fórmula → salida), y el modelo más fuerte SOLO ahí. Es donde vibe más se
equivoca si le dejás lugar a inventar.

**Prompt final — Pulido:** textos literales, validaciones, detalles visuales.

## 3. Cómo redactar
- **Lo más importante va al PRINCIPIO o al FINAL del prompt** (recomendación oficial de monday: es
  donde el modelo presta más atención). No entierres una regla clave en el medio.
- **Vocabulario monday**: "columna de tipo status", "board", "ítem", "grupo".
- **Componentes Vibe por nombre**: "un `Dropdown` de Vibe", "un `Dialog` de confirmación".
- **Concreto y verificable**: no "validar el formulario", sino "el CUIT debe tener 11 dígitos; si no,
  mostrar error debajo del input". monday lo dice explícito: **instrucciones granulares consumen menos
  créditos** que dejar que la IA decida (decidir = más razonamiento = más créditos).
- **Textos literales entre comillas**, tal como deben aparecer.
- **Sin jerga local**: nada de nombres de archivo, hooks internos ni "como en el repo".
- **No pidas búsquedas web** salvo que sean imprescindibles: disparan pasos extra y gastan créditos.

## 4. Asigná el modelo a cada prompt (la mayor palanca de ahorro)
| Modelo | Costo | Para |
|---|---|---|
| **Gemini Flash** | 10–20 | scaffold, UI, dashboards, ajustes visuales, pulido |
| **Claude Sonnet** | 30–50 | pantallas con lógica/estado |
| **Claude Opus** | 50–500 | 🚨 SOLO el prompt de lógica pesada aislada |

⚠️ **Opus es la trampa #1**: un dashboard en Opus cuesta 10–25× lo mismo en Flash. Anotá el modelo
sugerido al lado de cada prompt.

## 5. Entregar — UN ARCHIVO POR PROMPT (no un md con todo mezclado)

⚠️ **Problema real a evitar:** si entregás un solo `.md` que mezcla prompts con explicaciones,
tablas y checklists, alguien apurado **copia el archivo entero y lo pega en vibe** — incluyendo tus
comentarios y las instrucciones para el humano. Vibe se confunde y se gastan créditos al pedo.

**Solución: cada prompt es su propio archivo de texto plano.** Así "copiar todo el archivo" ES la
acción correcta y no hay ambigüedad posible.

Creá esta estructura en la raíz del proyecto:

```
vibe/
├── LEEME.md              ← para el HUMANO: orden, modelos, capturas, verificación
├── 1-datos-y-esqueleto.txt   ← para VIBE: copiar TODO y pegar
├── 2-pantallas.txt           ← para VIBE
├── 3-calculos.txt            ← para VIBE (si hay lógica pesada)
└── 4-pulido.txt              ← para VIBE
```

**Reglas de los archivos `.txt`:**
- Contienen **SOLO** el prompt. Nada de encabezados markdown, tablas de créditos, ni comentarios
  tuyos. Si está en el archivo, va a vibe.
- Empiezan con el header de instrucción dura (Sección 0b).
- Se copian **completos** (Ctrl+A, Ctrl+C).

**El `LEEME.md`** es lo único para el humano. Tiene que decir, por cada archivo:
| Archivo | Modelo a elegir en vibe | Qué adjuntar |
|---|---|---|
| `1-datos-y-esqueleto.txt` | Gemini Flash | — |
| `2-pantallas.txt` | Claude Sonnet | las capturas de cada pantalla |
| ... | | |

### Cómo indicar las capturas (sé específico o no sirve)
No pongas "adjuntar captura.png" y listo. Para CADA imagen decí **qué tiene que mostrar**:

```
Capturas a sacar antes de empezar (de la app corriendo en Vercel):
  1. pantalla-clientes.png  → el paso 1 con un cliente YA cargado, mostrando la ficha completa
                              y la barra de crédito
  2. pantalla-productos.png → el paso 2 con 2 o 3 productos ya agregados a la tabla y los totales
                              visibles
  3. pantalla-cobro.png     → el paso 3 con un movimiento de cobro cargado
Sacalas con la ventana ANGOSTA (no maximizada), para que vibe copie una UI compacta.
```

Regla: el dev tiene que poder sacar cada captura **sin preguntarte nada**.

**Camino alternativo (si hay conector de monday disponible):** se puede orquestar desde acá con
`vibe_create` (con `variant`, `board_ids` y `model`) y `vibe_update`, poleando `vibe_get` hasta
`ready`. ⚠️ Consume créditos igual que en la web → **confirmá con el usuario antes de disparar**.

---

## Anti-patrones (lecciones de casos reales que quemaron cientos de créditos)
- ❌ **Mega-dump**: volcar toda la spec de una. → Capas.
- ❌ **Sin Prompt 0 de datos** → vibe cae a defaults y disimula el error.
- ❌ **Describir el código** en vez del comportamiento.
- ❌ **Omitir el variant o los tipos de columna** → vibe adivina mal.
- ❌ **Dejar que vibe invente la API** (`BoardSDK.executeGraphQL`, `fetch` con token).
- ❌ **Creerle el "✅ listo"** → suele declarar éxito con features hardcodeadas o deshabilitadas.
- ❌ **Todo en Opus** o iterar la UX dentro de vibe.
- ❌ **Mencionar el proxy `/api/monday` o el token** → eso es solo de Vercel; en vibe la auth es nativa.

## Verificar cada build (no confiar en el "✅")
Después de CADA prompt: abrí la app real y probá esa pantalla. Para features con datos, confirmá que
lea del **board real**, no de datos por defecto. Si falta algo, corregí con un prompt **puntual**
(modelo barato), no regeneres todo.

**Truco oficial de monday:** en modo **Discuss** (barato, no ejecuta código) **pedile a vibe que te
explique qué construyó**. Es la forma más rápida de detectar que "dijo que sí" pero dejó algo
hardcodeado o sin conectar — sin gastar un build para descubrirlo.

## Antes de entregar: AUTO-VERIFICACIÓN obligatoria

Releer "a ver si está completo" **no alcanza** — el sesgo de quien leyó el código hace que todo
parezca obvio. Hacé esto en su lugar:

### Paso 1 — Leelo como si fueras vibe
Releé cada prompt **fingiendo que nunca viste el código** y marcá cada frase donde tendrías que
**adivinar** algo. Cada adivinanza es un build desperdiciado.

### Paso 2 — Checklist de lo que SIEMPRE se olvida
Estas categorías se escapan en el 90% de los exports. Verificá **una por una** contra el código:

- [ ] **Índices y etiquetas EXACTOS de cada columna status** que se escribe (`{index: 2}` o
      `{label: "..."}`). Sin esto vibe escribe cualquier cosa. Ojo con etiquetas con espacios dobles.
- [ ] **Valores permitidos de cada dropdown** (ej: la alícuota solo acepta 0/2.5/5/10.5/21/27) y qué
      hacer si el dato no es uno de ellos (¿engancharlo al más cercano? ¿rechazar?).
- [ ] **Formato exacto de cada campo al escribir** (números sin guiones, fechas `yyyy-MM-dd`,
      texto en minúscula, etc.).
- [ ] **Reglas de agrupación/división**: si un documento se parte en varios (comprobantes, remitos),
      ¿cuál es el criterio EXACTO y en qué orden quedan?
- [ ] **Qué NO se escribe**: columnas fórmula, espejo, o campos que llena una automatización.
- [ ] **Nombres de los ítems y subítems**: ¿se renombran después de crearlos? ¿con qué patrón?
- [ ] **Idempotencia**: qué pasa si el usuario reintenta. ¿Se duplica? ¿Qué guarda para no repetir?
- [ ] **Cómo busca**: ¿match exacto, "contiene", o difuso? ¿cuántos resultados trae? ¿filtra en el
      cliente o en la query?
- [ ] **Qué hace que un registro sea "elegible"** (vigente, pendiente, activo): la condición completa,
      no "los vigentes".
- [ ] **Condicionales de negocio**: reglas que cambian según el tipo de cliente/operación
      (ej: "el vencimiento es +30 días SOLO si es cuenta corriente").
- [ ] **Datos que están hardcodeados** en el código y no vienen de ningún board (listas fijas,
      valores por defecto). Vibe va a buscar un board que no existe.
- [ ] **Umbrales numéricos** de los semáforos y validaciones (50%, 90%, mínimos, máximos).

### Paso 3 — Verificá las reglas contra el código, no contra tu memoria
Cada fórmula y cada condición del prompt tiene que salir de **leer la función real**. Es muy fácil
escribir de memoria una regla "razonable" que no es la que está implementada (ej: asumir que
Monotributo factura letra B cuando el código dice A). Un error acá **factura mal en producción**.

> Si el prompt te lleva más tiempo de verificar que de escribir, vas bien.
