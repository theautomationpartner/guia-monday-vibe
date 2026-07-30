# CLAUDE.md — App monday "vibe-compatible"

> Reglas de este proyecto (las puso `/monday-vibe:iniciar`). Objetivo: que TODO lo que construyamos
> acá traduzca **1:1 a monday vibe** con el mínimo de iteraciones (= mínimo de créditos de IA).
> Documentación completa: comandos `/monday-vibe:*` y los docs del plugin (REQUISITOS, SEGURIDAD-TOKEN, MODELOS).

## Contexto del flujo
Esta app se desarrolla **localmente** con Claude Code, se testea en **Vercel**, y recién al final se **reconstruye en monday vibe** con un prompt + adjuntos. Por eso cada decisión de código se toma pensando en "¿esto se puede describir y mostrar con lo que vibe acepta?".

### Qué acepta monday vibe como input (doc oficial)
- **Imágenes / referencia visual** (bajo "Theme"): PNG, JPEG, JPG, WEBP, **PDF y archivos de texto**. También podés dar una **URL** de referencia.
- **Datos**: **CSV, XLSX, XLS** → vibe arma la estructura: **cada fila = un ítem, cada columna = un campo**.
- **Prompt de texto** (podés pegar código como texto — funciona, aunque monday recomienda describir comportamiento).
- ❌ NO sube archivos de código como tales.

**Aprovechá los adjuntos (ahorran créditos):**
- **Screenshots del local = contrato visual.** Capturá cada pantalla YA funcionando y adjuntala con "reproducí exacto esto" → vibe copia UX/UI/colores en vez de adivinar.
- **Modelo de datos = CSV/XLSX.** En vez de describir boards/columnas en texto, subí una planilla de ejemplo → vibe crea la estructura.

## Stack obligatorio (no desviarse)
Usar EXACTAMENTE lo que monday vibe genera, para que la traducción sea directa:

- **Frontend:** React 18 + Vite.
- **UI:** componentes **Vibe** = **`@vibe/core`** (Vibe 4, el actual y mantenido). NO usar `monday-ui-react-core` (Vibe 2, legacy sin soporte). Botones, inputs, tablas, modales, layout: Vibe.
  - Importá los design tokens en la raíz: `import "@vibe/core/tokens"` → te da la paleta monday (#0073ea, #f6f7fb, etc.) sin hardcodear hex.
  - Íconos: **`@vibe/icons`** (nativo). Testing: **`@vibe/testkit`** (Playwright).
- **Contexto y datos monday:** `monday-sdk-js` (`monday.get("context")`, `monday.api(...)` con GraphQL).
- **Backend (si hace falta):** Express + `@mondaycom/apps-sdk`. Preferir usar **boards como base de datos** vía GraphQL antes que una DB externa.

### Prohibido (rompe la traducción a vibe)
- ❌ Otras librerías de UI: MUI, shadcn, Chakra, Ant, Bootstrap.
- ❌ Tailwind o CSS "artesanal" pesado para replicar cosas que Vibe ya resuelve.
- ❌ Frameworks full-stack que vibe no usa (Next.js con SSR, Remix, etc.). Vite + React "a secas".
- ❌ Estado global exótico. `useState`/`useReducer`/Context alcanzan para el 95% de las apps monday.

### ⚠️ API de `@vibe/core` 4: las props son STRINGS, no constantes
Este es **el error más fácil de cometer**: Vibe 2 (`monday-ui-react-core`) usaba constantes estáticas
(`Box.paddings.MEDIUM`) y hay muchísimo código viejo así dando vueltas — incluso en la memoria de la
IA. **En Vibe 4 no existen.** Se pasan strings en minúscula:

| ❌ No existe (Vibe 2) | ✅ Vibe 4 |
|---|---|
| `Box.paddings.MEDIUM` | `padding="medium"` |
| `Box.roundeds.MEDIUM` | `rounded="medium"` |
| `Box.borders.DEFAULT` | `border` + `borderColor="uiBorderColor"` |
| `Box.backgroundColors.SECONDARY_BACKGROUND_COLOR` | `backgroundColor="secondaryBackgroundColor"` |
| `Flex.gaps.MEDIUM` · `Flex.directions.COLUMN` · `Flex.align.STRETCH` | `gap="medium"` · `direction="column"` · `align="stretch"` |
| `Text.types.TEXT2` · `Text.weights.MEDIUM` · `Text.colors.SECONDARY` | `type="text2"` · `weight="medium"` · `color="secondary"` |
| `Heading.types.H2` | `type="h2"` |

**Por qué duele tanto:** `Box.paddings` es `undefined`, así que `.MEDIUM` tira un **TypeError en
runtime** → React no monta nada → **pantalla en blanco**. Pero es JavaScript: **`npm run build`
compila igual, sin una sola queja.** Compilar ≠ funcionar.

**Fuente de verdad de la versión instalada** (no confiar en la memoria ni en blogs):
`node_modules/@vibe/layout/dist/**/*.types.d.ts` y `node_modules/@vibe/typography/dist/**/*.types.d.ts`.
Ahí están los valores exactos que acepta cada prop.

Otras trampas de la misma familia:
- **`Box` no tiene `onClick`** (`BoxProps` solo extiende `VibeComponentProps`). `Flex` sí → para algo
  clickeable con fondo/padding, envolvé el `Box` en un `Flex` que lleve el `onClick`.
- **`Skeleton` con medidas propias** necesita `type="rectangle" size="custom"` además de
  `width`/`height`.

Si algo NO se puede hacer con Vibe, pará y avisá antes de meter una dependencia nueva.

**Excepción — visualización de datos:** Vibe NO cubre gráficos. Para dashboards con charts está
OK usar una librería de gráficos (ej. Recharts). Íconos: preferí `@vibe/icons`; Lucide/react-icons
solo si falta alguno. Regla: Vibe para la UI estándar (botones, inputs, tablas, layout); librería de
charts SOLO para los gráficos. No metas Tailwind para replicar lo que Vibe ya resuelve.

## Medidas, embedding y tema (la app vive DENTRO de monday)

La app no corre en una pestaña propia: corre **embebida en un iframe** adentro de monday, con el
espacio que le deja la interfaz. Diseñar como si fuera una web full-screen es el error clásico.

### ❌ NUNCA reconstruyas la interfaz de monday
El error más caro de todos: replicar el "chrome" de monday alrededor de tu app (header superior,
rail de iconos lateral, panel de workspace con el árbol de tableros, breadcrumbs de la cuenta).
**Todo eso ya existe** — monday lo dibuja alrededor de tu iframe.

Construir tu app **es solo el contenido**, como si fuera el interior de un panel:
- ❌ Header global de monday, buscador de la cuenta, avatar/perfil, menú de workspaces.
- ❌ Rail de iconos lateral, árbol de carpetas/tableros, selector de cuenta.
- ✅ Solo tu pantalla: tus filtros, tu tabla, tus formularios, tus acciones.

Por qué importa (más allá del trabajo tirado): si maquetás ese marco, terminás **diseñando para
pantalla completa** y la app queda mal dimensionada para el espacio real del iframe.

> ¿Y si querés ver cómo va a quedar? Simulá el espacio con las DevTools (modo responsive al ancho
> que corresponda), no construyendo un decorado de monday alrededor.

### Diseñá fluido, nunca a medida fija
- ❌ Nada de anchos/altos fijos en px para layout (`width: 1200px`), ni posiciones absolutas para
  estructurar la pantalla.
- ✅ Usá `%`, `fr`, `minmax()`, flex/grid, `max-width`. Que todo se estire y se encoja.
- ✅ Tablas y contenido ancho: **scroll horizontal propio** (`overflow-x: auto`) en su contenedor.
  Nunca dejes que la página entera scrollee de costado.
- ✅ Colapsá columnas en pantallas angostas (ej. una grilla de 3-4 columnas que pase a 1).

### El espacio disponible depende del tipo de app
| Variant | Espacio típico | Cuidados |
|---|---|---|
| `board_view` | Ancho del área del board, alto acotado | Puede estar en modo `split` (mitad de ancho) o `mobile` |
| `item_view` | **Panel angosto** dentro del ítem | Es el más apretado: diseñá de una sola columna |
| `dashboard_widget` | **Chico y redimensionable** por el usuario | Tiene que verse bien en tamaño mini y en `fullscreen` |
| `object` (standalone) | Casi toda la pantalla | El más holgado, pero igual embebido |

`monday.get("context")` te dice dónde estás: `instanceType`, y `viewMode`
(`fullscreen` / `split` / `mobile` para board views; `widget` / `fullscreen` para widgets).
Si la app tiene que comportarse distinto según el espacio, leelo de ahí — no adivines por el ancho.

### Tema: light / dark / black (¡son 3!)
- `context.theme` puede ser **`light`, `dark` o `black`**.
- 🔴 **Hay que APLICAR el tema, no alcanza con usar Vibe.** Los colores de Vibe son variables CSS
  definidas bajo las clases `.light-app-theme`, `.dark-app-theme` y `.black-app-theme`. Si la app
  no pone ninguna, **queda siempre en claro** — y adentro de monday en modo oscuro se ve como un
  bloque blanco. Es un bug que no se nota programando y que el cliente ve el primer día.
  👉 Llamá **`useMondayTheme()`** (ya viene en `src/lib/monday.js`) una vez en el componente raíz.
- 🔴 **El `<body>` también.** Los componentes de Vibe se adaptan, pero la página no es de Vibe: sin
  esto queda un marco blanco alrededor de la app.
  ```css
  body { margin: 0; background: var(--primary-background-color); color: var(--primary-text-color); }
  ```
- ✅ Usá los **tokens de Vibe** (`import "@vibe/core/tokens"`) y los componentes de `@vibe/core`:
  se adaptan al tema solos.
- ❌ **No hardcodees hex** (`#ffffff`, `#323338`) para fondos y textos: en dark queda ilegible.
  Si necesitás un color de marca puntual, que sea la excepción, no la regla — y **dale un valor
  distinto en oscuro**, porque un color pensado para fondo blanco casi siempre queda apagado.

### Densidad
monday es una UI **densa**. Evitá paddings gigantes y tipografías enormes: la app tiene que sentirse
parte de monday, no una landing page.

### 🔴 Idioma: los comentarios en español, lo que ve el usuario NO
El código se comenta en español, pero **todo string que puede llegar a los ojos del cliente va en
el idioma de la app**. Es facilísimo colarse: escribís un mensaje de error mientras probás, está en
el mismo idioma que los comentarios de al lado, "se ve natural"… y termina en producción.

Ya pasó: un cliente angloparlante abrió la app y leyó *"Estás corriendo fuera de monday, agregá
?itemId= a la URL"*.

- Las **pistas para el desarrollador** van detrás de `import.meta.env.DEV`, así no entran al build:
  ```js
  const pista = import.meta.env?.DEV ? " (dev: add ?itemId=<id>)" : "";
  ```
- Lo mismo para los `console.log` con datos del cliente.

### Estados: "vacío", "sin acceso" y "sin ítem" NO son errores
Mostrar *"Something went wrong"* cuando el usuario no hizo nada mal lo asusta y hace que reporte un
bug que no existe. Cada uno tiene su mensaje:

| Situación | Qué decir |
|---|---|
| Cargando | Un skeleton o "Loading…" |
| No hay datos todavía | "No comments yet" + qué tiene que pasar para que aparezcan |
| Sin permiso | "This information is private" — **sin revelar conteos ni fechas** |
| Sin ítem abierto | "Open this app from a monday item" |
| Falla real | "Something went wrong" + reintentar |

Y ojo con **distinguir "no hay datos" de "no tenés permiso"**: monday devuelve la lista de boards
vacía en los dos casos (ver los gotchas). Chequealo explícitamente.

### Los datos de ejemplo no llevan datos reales del cliente
Los mocks se escriben una vez y quedan para siempre — en el repo, en el prompt de vibe, en las
capturas del video. Si copiás comentarios, nombres de proyecto o mails reales, ahí se quedan.
**Inventá el contenido**, y que ejercite la pantalla: un texto largo que haga varias líneas, uno
corto, fechas de días distintos.

### Cómo testear el tamaño de verdad (paso obligatorio)
Probar en Vercel a pantalla completa **no alcanza** — te da una falsa sensación de que está bien.
Antes de dar por buena una pantalla:
1. Abrí las **DevTools → modo responsive** y probá la app en anchos chicos
   (orientativo: ~400px para simular un item view, ~800px para un widget, y un ancho grande).
2. Verificá: que no aparezca **scroll horizontal de página**, que nada se corte, que los textos no se
   desborden y que las tablas scrolleen dentro de su caja.
3. Probá **light y dark** (cambiá el tema del sistema o forzalo) si la app va a usarse en ambos.
4. Cuando esté publicada en monday, **miralá en el lugar real** (el board/ítem/dashboard) antes de
   exportar a vibe.

## Regla de oro: "código describible"
El repo es real (vive en GitHub y se despliega a Vercel), pero **lo que recibe monday vibe es un
prompt**, no el repo. Todo tiene que poder describirse. Entonces:
- Preferí lo **simple y estándar** sobre lo ingenioso. Si un componente es difícil de explicar en prosa, es difícil de reproducir en vibe.
- Nombrá componentes y pantallas con nombres de negocio claros (ej: `PantallaEmisionFactura`, no `View2`).
- Un componente = una responsabilidad clara y nombrable.
- Evitá abstracciones prematuras (HOCs raros, hooks genéricos súper anidados).

## Acceso a monday: 3 modos (mock / proxy-Vercel / nativo-monday)
Envolvé TODO acceso a monday en un módulo único (`src/lib/monday.js`) con 3 caminos:
1. **Mock** (dev rápido): si `VITE_MONDAY_MOCK=1`, devuelve datos de ejemplo. Sin red.
2. **Proxy serverless** (Vercel, la app REAL que testea el cliente): fuera de monday, el frontend
   le pega a `/api/monday` (una función serverless) que agrega el token y llama a la API real.
   El **token vive SOLO en el server** (variable de entorno), nunca en el frontend ni en el repo.
3. **Nativo** (dentro de monday / vibe): usa `monday.api()` del SDK con la **sesión** del usuario.
   No necesita token estático.

## Deploy a Vercel + seguridad del token (CRÍTICO)
La app en Vercel es la **versión real** que el cliente usa/testea antes de aprobar el paso a vibe.
- **Deploy automático:** repo en GitHub → conectar el proyecto en Vercel → cada push despliega solo.
- **Token de monday = server-side ONLY:**
  - 🔒 **NUNCA en el repo.** `.gitignore` incluye `.env.local` y `.env`.
  - 💻 **Local:** `MONDAY_TOKEN` en `.env.local` (gitignoreado).
  - ☁️ **Vercel:** `MONDAY_TOKEN` como Environment Variable en el dashboard del proyecto.
  - 🚫 **Sin prefijo `VITE_`** (VITE_ se expone al browser). El token lo lee SOLO la función `/api/monday`.
  - El frontend nunca ve el token: le pega al proxy, el proxy pone el `Authorization`.
- **Los boards del cliente YA existen:** leé sus board/column IDs reales (no inventar, no crear con CSV).
- **Ojo al exportar a vibe:** el proxy serverless es SOLO para Vercel. En vibe, la app usa `monday.api()`
  nativo (sesión) — el prompt de vibe NO debe mencionar el proxy ni el token.

## Tipo de app / variant (definir al inicio)
monday vibe crea la app con un `variant` específico. Definilo antes de codear porque cambia
el prompt final Y el parámetro `variant` de `vibe_create`. Valores reales de la API:
- **`board_view`** — vista dentro de un board (1 board host).
- **`item_view` / `vibe_item_view`** — panel dentro de un ítem.
- **`vibe_dashboard_widget`** — widget en un dashboard (requiere `view_id` + `board_id`).
- **`object`** — app standalone multi-board (solo frontend).
- **`object_fullstack`** — app standalone con backend.
- **`monday_campaigns`** — apps de campañas.

Los boards existentes se conectan como fuente de datos vía `board_ids` (multi-board en
`object`/`object_fullstack`; un board host en las vistas). Si no pasás boards, vibe crea uno.

## Rendimiento con boards grandes (recomendaciones oficiales de monday)
Si el board tiene muchos ítems, la app se pone lenta. Aplicá desde el inicio:
- **Traer solo lo necesario**: pedí únicamente las columnas que usás (`column_values(ids: [...])`),
  nunca todas. Paginá con `items_page` + `cursor`.
- **Usar la API de agregación** cuando solo necesitás totales/conteos, en vez de traer todos los
  ítems y sumar en el cliente.
- **Cachear** los datos que no cambian seguido (catálogos, configuración) en memoria o en
  `localStorage`, y refrescarlos cada cierto intervalo en vez de en cada render.
- Traer los datos de referencia (tarifarios, configuración) **una sola vez al iniciar la app**, no
  por cada pantalla.

## Modelo de datos = columnas de board
Cuando la data vive en monday, documentá el modelo como **boards + columnas** (nombre, tipo de columna monday: `status`, `text`, `numbers`, `date`, `person`, `dropdown`, etc.). Ese mapeo ES parte del prompt de vibe.

## Checklist antes de exportar a vibe

**Seguridad (bloqueante — revisar SIEMPRE):**
- [ ] El token NO está en el repo (`git log`/`git grep` limpios; `.env.local` gitignoreado).
- [ ] El token NO tiene prefijo `VITE_` (no llega al browser).

**Datos:**
- [ ] Uso los **board/column IDs REALES** del cliente (verificados, no inventados).
- [ ] El modelo de datos está documentado como boards + columnas (nombre + tipo).

**App:**
- [ ] La UI usa Vibe (`@vibe/core`); solo se usó otra librería donde Vibe no tiene equivalente (charts).
- [ ] **`npm run verificar` pasa** (la app dibuja de verdad, no solo compila).
- [ ] No hay props de Vibe 2 (`Box.paddings.MEDIUM`, `Text.types.TEXT2`…): en Vibe 4 son strings.
- [ ] La app llama a **`useMondayTheme()`** y el `<body>` usa los tokens (probado en `?theme=dark`).
- [ ] **Ningún texto visible está en el idioma equivocado**, y las pistas de dev están detrás de
      `import.meta.env.DEV`.
- [ ] "Vacío", "sin acceso" y "sin ítem" tienen su propio mensaje: no dicen "algo salió mal".
- [ ] Los datos de ejemplo son **inventados** (sin comentarios, nombres ni mails reales del cliente).
- [ ] `api/monday.js` tiene **`TABLEROS_PERMITIDOS` cargado** y el filtro de `mutation` puesto (o
      sacado a conciencia, si la app escribe).
- [ ] `src/lib/monday.js` centraliza el acceso y cubre los 3 modos (mock / proxy / nativo).
- [ ] Cada pantalla/componente tiene nombre de negocio claro.
- [ ] Está definido el **tipo de app / variant** monday.

**Validación:**
- [ ] Desplegada en Vercel **con datos reales** (vía proxy) y probada end-to-end.
- [ ] Probada en **anchos chicos** (DevTools responsive): sin scroll horizontal de página, nada cortado.
- [ ] Se ve bien en **tema claro y oscuro**.
- [ ] **El cliente la usó y dio el OK.**
- [ ] Tengo **screenshots** de cada pantalla funcionando (para adjuntar a vibe).

Cuando esto esté ✔, corré **`/monday-vibe:exportar`** para generar los prompts.

## Gotchas reales de la API de monday (verificados en producción)

Errores que ya costaron créditos/tiempo. Aplicarlos de entrada evita que Vibe (o vos) los redescubra:

- **Acceso a datos:** dentro de una app monday/Vibe, para GraphQL crudo va SIEMPRE `monday.api(query)`
  de `monday-sdk-js`. NO `fetch` directo (no hay token en el browser). Ojo: las apps de vibe traen
  además un `BoardSDK` propio — existe, pero **no** sirve para GraphQL arbitrario
  (`BoardSDK.executeGraphQL()` fue una fuente real de errores). Ante la duda, `monday.api()`.
- **Estructura que genera vibe** (útil para que el traspaso sea 1:1): el código va en
  `src/generated/` con subcarpetas `components/`, `components/steps/`, `services/` y `config/`,
  en **`.jsx`/`.js` (no TypeScript)**.
- **Columnas checkbox (boolean):** se escriben con `change_column_value` + JSON `{"checked":"true"}`. `change_simple_column_value` las **rechaza** con error explícito.
- **Columnas file:** subir = mutation `add_file_to_column` por **multipart/form-data** contra `/v2/file` (no `/v2`). Vaciar = `update_assets_on_item(files: [])`. `change_simple_column_value` no sirve para files.
- **🔴 `items(ids: [...])` devuelve SOLO 25 por defecto**, aunque le pases 200 ids. No da error, no
  avisa: simplemente faltan. Verificado contra producción — 47 ids pedidos, 25 devueltos:
  ```graphql
  items(ids:[...47 ids...])            # ❌ devuelve 25
  items(ids:[...47 ids...], limit:100) # ✅ devuelve 47
  ```
  Es el mismo bug silencioso que el `limit` de `items_page`, pero peor, porque acá **el límite es
  invisible**: nadie escribe `limit:25`, viene solo. **Poné `limit` SIEMPRE en `items(ids:)`**, y si
  pueden ser más de 100, batcheá de a 100.
- **`column_values` SIEMPRE devuelve un array**, aunque pidas una sola columna por id. Costó una app
  entera cargando vacía:
  ```js
  // pedido: p: column_values(ids:["board_relation_xxx"]) { ... on BoardRelationValue { linked_item_ids } }
  item.p.linked_item_ids      // ❌ undefined, sin error
  item.p?.[0]?.linked_item_ids ?? []   // ✅
  ```
- **Columnas board_relation (conectadas):** `text` viene **siempre `null`**. Hay que pedir `... on BoardRelationValue { display_value }` (o `linked_item_ids` si querés filtrar por ítem). Escribir = `change_column_value` con `{"item_ids":[<id>]}`.
  - **No se pueden CREAR por API** (`InvalidColumnTypeException`): hay que agregarlas a mano desde
    la interfaz (*+ Add column → Connect boards*). Planificalo, porque bloquea el desarrollo.
  - Dejala **de una sola vía** salvo que de verdad necesites navegar al revés: la doble vía agrega
    una columna al board del cliente sin aportar nada.
  - Si la conexión es **de doble vía**, solo se escribe **el lado primario**. Escribir el lado espejo
    (el que monday creó solo en el otro board) **no da error: no hace nada**. Documentá cuál de los
    dos es el bueno, con su column_id, antes de codear.
  - **No la setees dentro de `create_item`**: no se aplica de forma confiable. Creá el ítem primero
    y seteá la conexión en una segunda llamada.
- **Columnas mirror / lookup:** son de **solo lectura** y el formato de su `text` no es confiable.
  Nunca las uses para lógica: leé el dato del ítem original. (Una app usó el mirror de un Timeline
  para calcular fechas y las barras quedaron corridas.)
- **Automatizaciones que crean ítems en otro board** (el patrón para capturar cambios de columna).
  Verificado configurándolas en producción:
  - El valor NUEVO de la columna es el token **`Current value`**. Al lado está `Previous value`, que
    es el anterior: confundirlos guarda siempre el comentario viejo y se nota semanas después.
  - **El vínculo NO se configura en el formulario del ítem.** Sale de una ventana aparte,
    *"Choose where to add a connection"*, donde hay que elegir **Target board** (el board donde se
    crea el ítem) y su columna conectada. El desplegable del formulario que lleva el nombre del
    board de origen es otra cosa y conviene **dejarlo vacío**.
  - **Al DUPLICAR una automatización hay que cambiar TRES cosas, no dos:** el disparador, el texto
    que identifica la columna, y **la condición** (`only if <columna> is not empty`). Olvidarse de
    la condición hace que la automatización nueva dependa de que OTRA columna tenga contenido — y
    no da ningún error, simplemente no guarda nada.
  - Poné siempre la condición **"solo si el valor nuevo no está vacío"**: si no, cada vez que se
    borra el contenido de la columna se crea un registro en blanco.
  - `Now` en una columna de fecha **guarda en UTC** (verificado: 0 minutos de diferencia contra
    `created_at`). Se puede usar sin miedo.
- **🔴 Si se borra un ítem, monday BORRA el vínculo de las columnas conectadas que lo apuntaban.**
  Los registros relacionados quedan huérfanos: siguen existiendo, pero **nadie puede saber a qué
  pertenecían**, y una app que filtra por ese vínculo no los encuentra nunca más. Ya pasó en
  producción, con datos reales, a la hora de haberlos cargado.
  👉 Si guardás historial o registros vinculados, sumá **una columna de texto con el nombre (y/o el
  ID) del ítem de origen**, escrita por la misma automatización. El vínculo sirve para filtrar; el
  texto es el que sobrevive.
- **🔴 Un board al que no tenés acceso NO da error: devuelve `boards: []` con HTTP 200.** Pasa si el
  token es de otra cuenta, o si el board es privado y el dueño del token no está suscripto. El
  síntoma es un crash río abajo (`Cannot read properties of undefined`) o, peor, una pantalla vacía
  que parece "no hay datos". **Siempre validá que el board vino** antes de usarlo, y avisá con un
  mensaje que diga *qué* board y *por qué* puede faltar. Para diagnosticar rápido:
  `{ me { name account { id name } } }` → te dice contra qué cuenta estás pegando en realidad.
- **Columnas formula encadenadas:** vía API muchas veces vienen **vacías** aunque sus dependencias tengan valor. No confiar en ellas; recalcular en código a partir de los datos crudos.
- **🔴 Columnas de fecha: `text` viene convertido al huso de quien consulta, `value` viene en UTC.**
  Verificado en producción: para el mismo ítem, `value` = `{"date":"2026-07-27","time":"08:05:08"}`
  (UTC) pero `text` = `"2026-07-27 05:05"` (Argentina) — **sin ningún indicador de zona**. Si usás
  `text`, `new Date()` lo lee como hora local del navegador y **el desfasaje se aplica dos veces**.
  Con la app en Argentina y el usuario en Israel eso son **6 horas de error**. Los campos
  `... on DateValue { date time }` tienen el mismo problema que `text`.
  👉 **Para fechas, siempre `value`**, y armá el ISO a mano: `` `${date}T${time || "00:00:00"}Z` ``.
- **Prerequisito de datos:** los boards/columnas que la app lee tienen que **existir y estar conectados ANTES**. Si Vibe no encuentra un board (ej. un tarifario), cae a datos por defecto y enmascara el problema — parece que anda y no.
- **Colores/labels de status y opciones de dropdown:** leerlos en vivo de `settings_str` de la columna, no hardcodear (así un cambio en monday no requiere tocar código).
- **⚠️ `React.StrictMode` duplica los efectos en desarrollo.** Si escribís en monday desde un
  `useEffect` (crear un ítem, registrar una deuda), **se ejecuta dos veces** y crea el registro
  duplicado. Es un bug real que ya pasó en producción. Protegelo con un `useRef` de "ya lo hice", o
  mejor: **escribí desde acciones del usuario (onClick), nunca desde un efecto de montaje.**
- **Idempotencia de las escrituras:** guardá el id de todo lo que creaste (venta, recibo, deuda) y
  **nunca lo vuelvas a crear**. Ojo: si ese id vive solo en el estado de React, un F5 lo pierde y se
  duplica el registro. Para cosas contables, verificá contra monday antes de crear.

## Cómo trabajar conmigo (Claude Code) en este repo
- **Planificar features grandes:** subagente `monday-vibe:vibe-planner` (no ensucia el contexto principal).
- **Planificar primero:** en apps medianas/complejas, `/monday-vibe:planear`.
- **Conseguir los IDs reales (sin instalar nada):** el **board ID está en la URL** de monday
  (`/boards/<ID>`), y los **column IDs** se copian desde la config de cada columna. Si hay un conector
  de monday disponible en el chat, pedile a Claude que los lea. **No** montes un MCP local de monday:
  es frágil en Windows y no hace falta.
- **Revisar:** `/monday-vibe:revisar` chequea entorno, seguridad del token, stack y datos.
- **Publicar:** `/monday-vibe:publicar` sube a GitHub y despliega en Vercel (token seguro).
- **Exportar:** `/monday-vibe:exportar` produce los prompts para monday vibe.
- **Modelos:** los de Claude Code (acá, no gastan créditos de monday) son DISTINTOS de los de monday
  vibe (allá sí gastan). En vibe: Flash para UI, Opus casi nunca.
