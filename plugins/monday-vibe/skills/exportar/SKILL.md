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
- **Máximo 5 boards** por app vibe. Si necesita más, repensá el modelo o partila.
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

**Prompt 0 — Prerequisito de datos (SIEMPRE primero):**
```
Esta app usa estos boards de monday (conectalos ANTES de construir la UI):
- Board "<Nombre>" (id <ID>) — columnas: <nombre | column_id | tipo>, ...
Conectá estos boards como fuente de datos de la app.
```
> Sin esto, vibe no encuentra los boards, cae a "datos por defecto" y **enmascara el problema**:
> parece que anda y no. Es el error que dejó una app rota tras ~800 créditos.

**Prompt 1 — Scaffold, con las reglas de API embebidas:**
```
Crear una app de monday tipo <VARIANT>.
Stack: React + Vibe (@vibe/core) + monday-sdk-js.
Acceso a datos SIEMPRE con monday.api() del SDK — NO fetch directo, NO BoardSDK.executeGraphQL().
Toda la UI en <idioma>.
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
- **Vocabulario monday**: "columna de tipo status", "board", "ítem", "grupo".
- **Componentes Vibe por nombre**: "un `Dropdown` de Vibe", "un `Dialog` de confirmación".
- **Concreto y verificable**: no "validar el formulario", sino "el CUIT debe tener 11 dígitos; si no,
  mostrar error debajo del input".
- **Textos literales entre comillas**, tal como deben aparecer.
- **Sin jerga local**: nada de nombres de archivo, hooks internos ni "como en el repo".

## 4. Asigná el modelo a cada prompt (la mayor palanca de ahorro)
| Modelo | Costo | Para |
|---|---|---|
| **Gemini Flash** | 10–20 | scaffold, UI, dashboards, ajustes visuales, pulido |
| **Claude Sonnet** | 30–50 | pantallas con lógica/estado |
| **Claude Opus** | 50–500 | 🚨 SOLO el prompt de lógica pesada aislada |

⚠️ **Opus es la trampa #1**: un dashboard en Opus cuesta 10–25× lo mismo en Flash. Anotá el modelo
sugerido al lado de cada prompt.

## 5. Entregar
Producí **`vibe-prompts.md`** en la raíz del proyecto con:
1. Una nota arriba: *"Pegar en orden. Esperar a que vibe termine cada uno antes del siguiente.
   Verificar en la app real después de cada uno."*
2. Cada prompt en **su propio bloque de código**, numerado, con **modelo sugerido** y **qué adjuntar**
   (screenshot / CSV).
3. Al final, un checklist de verificación.

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

## Antes de entregar
Releé cada prompt preguntándote: *"¿alguien que nunca vio el código podría reconstruir esta pantalla
exactamente con esto?"*. Si la respuesta es no, falta detalle.
