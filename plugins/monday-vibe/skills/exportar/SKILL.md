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
- **A) Código verbatim (RECOMENDADA siempre que exista código probado):** pegá el código exacto con la
  orden *"construí EXACTO con este código, NO reescribas la lógica"*. Vibe **transcribe** en vez de
  razonar → builds baratos y cortos. Funciona **aunque el código NO esté en el stack Vibe**
  (TypeScript, componentes propios, etc.): lo que se transcribe es la lógica, no la UI.
- **B) Spec de comportamiento** (solo si NO hay código): describí qué debe existir y cómo se comporta.

### ⭐ Qué código pegar (medido con pruebas ciegas)
Describir con palabras lo que ya está en código **siempre pierde información**. Pegá los archivos
en este orden de prioridad — son los que más huecos eliminan:

| Prioridad | Qué pegar | Qué resuelve |
|---|---|---|
| 1️⃣ | **El mapa de columnas** (el archivo con los IDs de boards/columnas, índices de status, etiquetas) | Elimina de un saque casi todos los bloqueantes de "falta el ID de X" |
| 2️⃣ | **La capa de ESCRITURA** (los servicios que crean/actualizan ítems) | Qué columna recibe qué valor, en qué orden, cómo se renombra, cómo no duplicar. **Es lo que corrompe datos si falta.** |
| 3️⃣ | **La lógica de negocio pura** (cálculos, validaciones, reglas) | Fórmulas exactas, redondeos, umbrales |
| 4️⃣ | **Los tipos / modelo de dominio** | Nombres de campo y valores posibles |

⚠️ **El error clásico:** pegar solo los cálculos y describir las escrituras con palabras. Medido en
una prueba ciega real: eso deja documentado *"cómo calcular la plata pero no cómo asentarla"* — y
los huecos que sobreviven son justo los que escriben mal en la base.

**Lo que NO hace falta pegar:** los componentes de UI (vibe los reescribe con su propio design
system) — para eso van los screenshots.

⚠️ **No te olvides del wrapper del SDK.** Si pegás servicios que importan un helper
(`mondayApi`, `apiCall`…), pegá también ese archivo o al menos su **contrato**: qué devuelve
(`res.data` vs `res`) y si **lanza** ante `errors`. Medido: sin eso, toda la lógica de reintentos
de los servicios queda rota, porque monday resuelve OK aunque la respuesta traiga errores.

### 🔴 CERO PROSA SOBRE APIs — pegá el JSON real, nunca lo describas de memoria

**Esta es la regla más cara de todas y se aprendió del peor modo.** En un export real, el prompt
tenía 445 líneas de código pegado textual y **falló en la ÚNICA línea escrita a mano**:

```
El itemId sale del contexto: monday.get("context") devuelve { itemId, theme, user: { email } }.
```

Es falso. Devuelve `{ data: { itemId, ... } }`. El código correcto —con su `.data`— estaba en el
repo, a la vista, mientras se escribía esa línea de memoria. Vibe transcribió el error con total
fidelidad y **la app no funcionó**: `itemId` siempre `undefined`, pantalla de "sin ítem" para
siempre, sin un solo error en consola. Costó 3 hipótesis equivocadas, un build de diagnóstico y
varias vueltas antes de encontrarlo.

**La regla:** si el prompt tiene que explicar qué devuelve una llamada, va **el JSON de una
respuesta real**, copiado de la API o de un `console.log`. Nunca una descripción, ni siquiera
cuando estás seguro — **sobre todo cuando estás seguro**.

```
Lo que llega, tal cual, verificado en producción:

  { "method": "listen", "type": "context",
    "data": { "itemId": "3081412888", "user": { "email": "..." } } }

O sea: `res.itemId` es undefined; el bueno es `res.data.itemId`.
```

Vale para: la forma del contexto, la forma de las respuestas GraphQL, los valores de un enum, el
formato de una fecha. **Todo lo que sea "la API devuelve X" se verifica antes de escribirlo.**

### Al pegar código de una app más grande: acotá el alcance explícitamente
Si el código trae features que NO van a esta app (otros flujos, tipos de más, funciones
duplicadas), agregá arriba una sección **"DECISIONES YA TOMADAS"** que:
- diga qué construir y **qué ignorar** del código ("vas a ver X en el código: ignoralo");
- resuelva las **contradicciones internas** del código (dos funciones que hacen lo mismo distinto,
  constantes viejas que el board ya no acepta) diciendo **cuál gana**;
- aclare que esas decisiones **tienen prioridad sobre el código**.
Sin esto, vibe intenta construir la app grande o elige la función equivocada.

**⚠️ La cláusula de prioridad NO alcanza: BORRÁ el texto contradictorio.**
Medido en una prueba ciega: cuando una decisión decía "no incluyas X" pero 1.400 líneas después
el texto seguía listando X como opción, el auditor lo marcó igual como ambiguo —
**lo más reciente le gana a la cláusula de prioridad**. Después de escribir las decisiones,
recorré el resto del prompt y **eliminá o corregí cada frase que las contradiga**.

**⚠️ Cuidado con el bucle de precedencia** (error real, detectado en una auditoría):
si el mensaje 1 dice *"las decisiones mandan sobre el código"* pero los mensajes 2 y 3 dicen
*"manda el código"*, **ganan estos últimos** (están después). Solución:
- Escribí la precedencia como una **cadena de 3 niveles** explícita:
  `1º decisiones > 2º código fuente > 3º prosa`.
- **Repetí el recordatorio en CADA mensaje posterior**: *"'manda el código' vale frente a las
  descripciones, nunca frente a las decisiones del mensaje 1"*.

**⚠️ Ojo con las cláusulas absolutas que se te escapan.** En esa misma auditoría, un paréntesis
inocente —*"(esta es la única modificación permitida al código)"*— **canceló 8 de las 13 decisiones**.
Después de escribir, buscá tus propios "único", "nunca", "siempre", "tal cual" y verificá que no
estén anulando algo que vos mismo pediste más arriba.

**⚠️ Y el pulido final puede repintar lo que decidiste.** Un prompt de ajustes visuales que decía
*"la rentabilidad va en verde o rojo"* anulaba una decisión previa de mostrar un guion en cierto
caso — porque **se aplica último**. Revisá que el prompt de pulido no contradiga ninguna excepción.

**Tres trampas del código heredado que hay que neutralizar explícitamente:**
1. **Ramas de mock / feature flags**: código tipo `if (!apiHabilitada()) return datosFalsos`.
   Decí que en vibe siempre está habilitado y que **borre esas ramas** y no cree el módulo de mock.
   Si no, vibe puede shipear una app que muestra datos falsos sin avisar.
2. **Archivos con nombre engañoso**: si un archivo se llama `presupuestar.ts` pero también contiene
   funciones esenciales para otra cosa, **decilo**, o vibe lo descarta entero por el nombre.
3. **Funciones que no devuelven lo necesario**: si pedís algo que el código actual no puede hacer
   (ej. "reintentá solo lo que falló" cuando la función devuelve un conteo, no la lista), o bajás
   el pedido, o **autorizás explícitamente esa modificación puntual** ("esta es la única
   modificación permitida al código").

### Etiquetas de status/dropdown: instruí leerlas EN VIVO
Los índices hardcodeados sobreviven a un renombre pero se rompen si alguien **reordena** las
etiquetas; leerlas en vivo sobrevive al reorden. Pedí las dos cosas: leer `settings_str` al iniciar
para armar el mapa etiqueta→índice, y **caer al índice documentado** si no hay coincidencia.
Además, listá las columnas cuyas etiquetas **deciden reglas de negocio** (condición fiscal, condición
de pago, estados que bloquean) y pedí que **avise en pantalla** si no coinciden con lo esperado,
en vez de asumir.

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

⚠️ **PEDILE LAS CAPTURAS AL USUARIO ANTES DE ESCRIBIR LOS PROMPTS**, no después. Si las dejás para
el final, ya escribiste todo describiendo pantallas que podrías haber mostrado.

**Tres reglas que ya costaron una vuelta cada una:**

1. **Al menos una tiene que ser ANGOSTA** (ventana a la mitad de la pantalla). Adentro de monday la
   app vive en un panel angosto; si vibe solo ve capturas a pantalla completa, copia proporciones
   que después no entran. Es la captura más valiosa del set.
2. **Se sacan AL FINAL, con la app terminada.** Cada vez que se toca la UI, las capturas viejas
   caducan. Pasó: unas capturas mostraban un rótulo cambiado media hora antes, y **contradecían el
   texto del prompt**. Cuando la imagen y el texto se pelean, no sabés cuál gana.
3. **Antes de adjuntarlas, abrí cada una y verificá** que muestre el estado actual de la app. Es
   más rápido que descubrirlo después de un build.

### 0f. ⚠️ Vibe NO hereda el design system de monday: usa el suyo

Medido en un export real: se le mandaron capturas de una app hecha con `@vibe/core` y vibe la
reconstruyó con **su propio sistema**: `lucide-react` para los íconos, variables CSS propias en
formato HSL (`--card`, `--border`, `--foreground`, `--muted-foreground`) y su propia tipografía.

Copió **el aspecto** de las capturas, no la implementación. Y después escribió CSS mezclando las
dos convenciones: reglas que apuntaban a `var(--primary-background-hover-color)` y a
`var(--ui-border-color)` —tokens de monday que **en su proyecto no existen**—. Cuando una variable
CSS no existe, **la declaración entera se descarta**: las tarjetas quedaron sin fondo y **sin borde**,
como texto suelto. Costó un build entero arreglarlo.

**Entonces, en el prompt:**
- ❌ NO digas solo *"usá los tokens de Vibe"* y te quedes tranquilo: puede no tenerlos.
- ✅ Decí: *"usá ÚNICAMENTE variables CSS que vos mismo definas en el proyecto. NO asumas que
  existen los tokens de monday (`--primary-text-color`, `--ui-border-color`, etc.): si no existen,
  las reglas se descartan en silencio y los fondos y bordes desaparecen."*
- ✅ Para el tema, dale las clases **y** los colores concretos, no solo el nombre del token.
- ✅ Y después del build, **mirá la pantalla**: los bordes que faltan es el síntoma típico.

### 0d. Técnicas y límites oficiales de monday
- **Datos por planilla**: un CSV/XLSX de ejemplo → vibe arma la estructura (fila = ítem, columna = campo).
  Límite: **5.000 filas** por archivo (lo que sobra se trunca).
- **Boards por app: MÁXIMO 5.** Es un límite fijo del producto, no depende del plan
  (fuente: base de conocimiento oficial de monday, *"vibe apps que usen datos de hasta 5 boards"*).
  ⚠️ **No lo confundas** con los límites de la columna *Connect Boards* (Basic 1 / Standard 5 /
  Pro 20 / Enterprise 200): esos son otra cosa. Y aunque la API acepte hasta 20 `board_ids`,
  el límite del producto es 5.
  👉 Si la app necesita más de 5 boards, hay que **partirla en varias apps** o reducir el modelo,
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

**El techo real es el límite de pegado del chat de vibe: ~166.000 caracteres por mensaje.**
Medilo (`wc -c`) y armá los prompts lo más grandes posible **sin pasar el 70%** de ese límite
(deja margen). Menos mensajes = menos builds = menos créditos.

**Para una app típica: 2 a 4 prompts.** Estructura recomendada, fusionando hasta llenar:
1. **Datos + esqueleto + pantallas** (mapa de columnas, layout, navegación, UI) — Sonnet
2. **Lógica de negocio / cálculos** (aislado, es donde vibe más se equivoca) — Opus
3. **Escrituras + pulido** (capa que escribe en monday, más ajustes finales) — Sonnet

Si te salen 8+, estás fragmentando de más y pagando builds al pedo.
Si un bloque supera el 70% del límite, partilo por ahí — no por criterio estético.

> ⚠️ **Contrapeso:** fusionar abarata pero **dificulta verificar**. Si un build sale mal y metiste
> 3 cosas en un prompt, no sabés cuál falló. Regla práctica: fusioná lo que se **verifica junto**
> (datos+pantallas se ven de una), y dejá aparte lo que querés poder revertir solo (los cálculos).

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
| **Gemini Flash** | 10–20 | GENERAR de cero: scaffold, dashboards, pantallas sin lógica |
| **Claude Sonnet** | 30–50 | pantallas con lógica/estado, **y TODAS las correcciones** |
| **Claude Opus** | 50–500 | 🚨 SOLO el prompt de lógica pesada aislada |

⚠️ **Opus es la trampa #1**: un dashboard en Opus cuesta 10–25× lo mismo en Flash. Anotá el modelo
sugerido al lado de cada prompt.

⚠️ **Y Flash NO sirve para corregir.** Parece la opción obvia para un cambio de una línea, pero
medido: falló 3 veces seguidas en cambios triviales sobre código existente; las mismas correcciones
con Sonnet pasaron todas a la primera. **Editar es más difícil que generar** — hay que ubicar el
punto exacto, cambiar solo eso y devolver el resto intacto. Ver "El ciclo de corrección".

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
- ❌ **Describir una API de memoria** en vez de pegar una respuesta real. El error más caro medido.
- ❌ **Corregir con el modelo barato** → falla en cambios de una línea y hace perder vueltas.
- ❌ **Escribir la corrección como diagnóstico** ("está mal porque…") en vez de como orden ("de X a Y").
- ❌ **Razonar en vez de diagnosticar** cuando algo no anda. Un `JSON.stringify` en pantalla cuesta
  menos que dos hipótesis equivocadas.
- ❌ **Ofrecer un prompt cosmético "por las dudas"** después de decir que no vale la pena. O vale y
  se manda, o no vale y no se escribe.
- ❌ **Validar una item view en el preview de vibe** → ahí nunca hay contexto de ítem. Hay que publicar.

## 🔴 EL CICLO DE CORRECCIÓN — acá se va la plata de verdad

**Dato medido en un export real, con un prompt que había pasado 3 rondas de prueba ciega:**

```
 33 créditos   el build inicial — la app completa, funcionando
180 créditos   las 8 correcciones que vinieron después
────
213 total      el 85% se fue en corregir, no en construir
```

La buena noticia: **la lógica de datos salió perfecta a la primera y no se tocó ni una vez.**
Paginación, husos horarios, permisos, orden. Todo lo caro de arreglar, bien.
Los 180 se fueron en **envoltura**: un estado inicial, unas clases de CSS, un `.data` faltante,
y —lo peor— **57 créditos en borrar UNA línea de CSS cosmética**.

Estas reglas salen de ahí. Se aplican DESPUÉS del primer build.

### 1. Construir y corregir son dos modos distintos

| | Para CONSTRUIR | Para CORREGIR |
|---|---|---|
| **Largo** | Lo más detallado posible | Lo más corto posible |
| **Estilo** | Explicativo: el porqué evita que "mejore" la lógica | **Imperativo: de qué a qué. Sin diagnóstico** |
| **Modelo** | Sonnet | **Sonnet también** (ver punto 2) |

Medido: un prompt de corrección escrito como informe —*"el estado inicial tiene X, y el `if` corta
antes de que Y resuelva, resultado Z"*— **falló**. Vibe respondió *"probá dividirlo en pasos más
chicos"*. El mismo cambio, escrito así, salió a la primera:

```
CAMBIO 1 — App.jsx, estado inicial del useState
De:   noItem: true,
A:    noItem: false,
```

Para corregir, vibe no necesita entender por qué está mal. Necesita saber **qué reemplazar por qué**.

### 2. El modelo barato sirve para generar, NO para editar

⚠️ **Esto corrige lo que dice la tabla de modelos más abajo.** Medido:

```
Build inicial     · Claude Sonnet · ✅
Corrección 1      · Gemini flash  · ❌ "I ran into a problem"
Corrección 2      · Gemini flash  · ❌ falló
Corrección 3 (1 línea) · Gemini flash · ❌ falló
Las mismas, con Sonnet · ✅ todas de una
```

**Editar es más difícil que generar:** hay que ubicar exactamente dónde tocar, cambiar solo eso, no
romper las otras 300 líneas y devolver todo consistente. Usá **Sonnet para las correcciones**, aunque
sean de una línea. Flash solo para generar de cero.

### 3. Ante un síntoma raro: DIAGNOSTICAR, no razonar

Un build de diagnóstico cuesta ~25 créditos y **da la respuesta**. Tres hipótesis razonadas costaron
más tiempo y dieron tres respuestas falsas seguidas (*"es el preview"*, *"es porque no está
publicada"*, *"debe ser un board view"* — las tres equivocadas).

El diagnóstico es siempre el mismo: **mostrar en pantalla el dato crudo.**

```
Cambio temporal de diagnóstico. En la pantalla de <el estado que falla>, agregá debajo el
contenido completo de <el objeto sospechoso>, en letra chica y monoespaciada:

  <pre style={{ fontSize: 11, whiteSpace: 'pre-wrap' }}>
    {JSON.stringify(elObjeto, null, 2)}
  </pre>

Es temporal, se saca después.
```

**Regla:** si te encontrás con la segunda hipótesis sin haber medido, pará y mandá el diagnóstico.

### 4. Lo cosmético se RECHAZA, no se ofrece "por las dudas"

**57 créditos —el 27% del total— se fueron en borrar `max-width: 300px` de una regla CSS.** Tres
intentos. Y lo peor: quien lo pidió había dicho explícitamente *"yo no lo mandaría, es cosmético y
la información está duplicada justo arriba"*… y acto seguido pasó el prompt igual.

**Decir "yo no lo haría, pero acá tenés el prompt" es no decidir.** Si no vale el crédito, no va el
prompt. Cerrá con: *"esto es cosmético y no lo vamos a corregir; si el cliente lo pide, lo vemos"*.

### 5. En vibe NO hay salida manual

La pestaña **Code** es de **solo lectura**. Si la IA no puede hacer un cambio, **no podés meter mano
vos**. No hay plan B.

Eso cambia el cálculo de riesgo: desarrollar local no es solo más barato, es **el único lugar donde
tenés el control**. Cuanto más terminada llegue la app al export, menos dependés de acertar.

### 6. El preview de vibe NO sirve para validar una item view

**No le pasa el contexto del ítem a la app.** El tablero que muestra es inventado por vibe (nombres
tipo *"My board"*, gente que no existe en la cuenta). Una item view ahí adentro va a mostrar
**siempre** el estado de "sin ítem", esté bien o mal programada.

👉 Para validar una item view hay que **publicar** (publicar no gasta créditos) y abrirla desde un
ítem real. Sin saber esto, se gastan builds "arreglando" algo que no está roto.

## Verificar cada build (no confiar en el "✅")
Después de CADA prompt: abrí la app real y probá esa pantalla. Para features con datos, confirmá que
lea del **board real**, no de datos por defecto. Si falta algo, corregí con un prompt **puntual**
(modelo barato), no regeneres todo.

**Truco oficial de monday:** en modo **Discuss** (barato, no ejecuta código) **pedile a vibe que te
explique qué construyó**. Es la forma más rápida de detectar que "dijo que sí" pero dejó algo
hardcodeado o sin conectar — sin gastar un build para descubrirlo.

## ⛔ NO SE ENTREGA UN EXPORT SIN VALIDAR — es una condición, no una sugerencia

**El dev que reciba este paquete va a hacer el export UNA sola vez y tiene que funcionar.** No va a
saber qué revisar ni por qué. La validación es tu trabajo, no el suyo.

Un export está terminado cuando:

- [ ] La **prueba ciega** (paso 4, abajo) devuelve **cero bloqueantes** y **ninguna ambigüedad que
      cambie datos**. Se repite con un agente NUEVO después de cada corrección, hasta que quede
      limpio. Suelen hacer falta 2 o 3 vueltas.
- [ ] Cada afirmación del prompt sobre **qué devuelve una API** está copiada de una respuesta real,
      no escrita de memoria.
- [ ] Las **capturas están al día** con la versión final de la app.

Si no se cumplen las tres, el paquete no se entrega: se corrige y se vuelve a validar.

> **Por qué es tan tajante:** en una medición real la checklist manual encontró 12 huecos y la
> prueba ciega encontró **59** sobre el mismo material. Y las tres rondas de prueba ciega
> encontraron, además, **7 bugs reales en la app original** — entre ellos uno que estaba perdiendo
> 9 de 209 entradas en producción, en silencio.
>
> La prueba ciega no valida el prompt. **Valida la app.**

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

### Paso 4 — PRUEBA CIEGA (obligatoria, es la única que sirve de verdad)

⚠️ **Los pasos 1-3 NO alcanzan.** Medido: la checklist encontró 12 huecos en un export real; la
prueba ciega encontró **59** en el mismo material. Quien leyó el código **no puede** auditar su
propio prompt: da por obvio todo lo que ya sabe.

**Lanzá un subagente que SOLO pueda leer los archivos de prompt** (prohibido abrir el código
fuente) y pedile que actúe como si fuera vibe. El prompt para ese agente:

```
Sos monday vibe. Te van a pegar estos prompts y tenés que construir la app.
SOLO podés leer estos archivos: <lista de los .txt>. Está PROHIBIDO leer el código
fuente de la app (si lo leés, la prueba no sirve).

Decime, siendo duro y exhaustivo:
1. BLOQUEANTES: qué NO podrías implementar por falta de información (citá la línea).
2. AMBIGÜEDADES: dónde tendrías que elegir entre 2+ interpretaciones razonables, y
   qué elegirías.
3. CONTRADICCIONES entre los archivos o dentro de uno.
4. SUPUESTOS que tendrías que inventar (qué pasa al cargar, listas vacías, navegar
   para atrás, errores, si los datos persisten).
5. VEREDICTO: ¿podrías construir algo equivalente al original? ¿Cuántas rondas de
   corrección haría falta?
Priorizá lo que causaría COMPORTAMIENTO DE NEGOCIO EQUIVOCADO (números mal, registros
mal escritos) por sobre lo cosmético.
```

**Criterio de aceptación:** el export está listo cuando la prueba ciega devuelve **cero
bloqueantes** y **ninguna ambigüedad que cambie números o registros**. Las ambigüedades cosméticas
se pueden aceptar.

**Repetí:** corregís el prompt con lo que salió → volvés a correr la prueba ciega (con un agente
nuevo) → hasta que quede limpio. Suelen hacer falta 2 o 3 vueltas.

> Cada bloqueante que caza la prueba ciega son ~1-2 builds de vibe que te ahorrás.
> Es la parte más barata del proceso y la que más créditos salva.

> Si el prompt te lleva más tiempo de verificar que de escribir, vas bien.
