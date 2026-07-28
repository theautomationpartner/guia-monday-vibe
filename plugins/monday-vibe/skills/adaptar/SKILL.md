---
name: adaptar
description: Convierte una app ya construida con otro stack (Next.js, shadcn, MUI, Tailwind, TypeScript) al stack vibe-compatible, para que después se pueda pasar a monday vibe con fidelidad. Usar cuando el usuario tenga una app hecha "a su manera" y quiera llevarla a monday, o cuando /revisar detecte un stack fuera de las reglas.
---

# /adaptar — rescatar una app hecha fuera del stack

Sirve para el caso: *"ya tenía la app hecha con otra cosa y ahora la quiero pasar a monday"*.

## Primero: decidí si conviene adaptar o no

| Situación | Recomendación |
|---|---|
| App **simple** (1-2 pantallas, poca lógica) | **No adaptes.** Andá directo a `/monday-vibe:exportar` describiendo comportamiento. Adaptar es más trabajo que el beneficio. |
| App **mediana/compleja** o con diseño muy propio | **Adaptá.** El resultado en vibe va a ser mucho más fiel y con menos iteraciones. |
| App con **backend pesado o features que vibe no soporta** | Avisá primero qué se pierde. Quizás convenga dejar parte fuera de vibe. |

Decí tu recomendación en una línea y **confirmá con el usuario** antes de empezar a cambiar código.

## Qué hay que convertir

| Lo que hay | A qué se convierte |
|---|---|
| Next.js (App/Pages Router, SSR) | **React + Vite** "a secas" |
| shadcn / MUI / Chakra / Ant / Bootstrap | **`@vibe/core`** |
| Tailwind (para UI estándar) | Componentes Vibe + `@vibe/core/tokens` |
| TypeScript | JS (opcional; convertir solo si es rápido) |
| `fetch` directo a la API de monday, tokens en el front | `src/lib/monday.js` + proxy `api/monday.js` |
| Íconos (lucide, react-icons) | `@vibe/icons` (dejá el otro solo si falta alguno) |
| Gráficos (Recharts, Chart.js) | **Se pueden quedar** — Vibe no cubre charts |
| Estado global exótico (Redux, Zustand) | `useState` / `useReducer` / Context |
| **Chrome de monday replicado** (AppShell, sidebar, rail, árbol de tableros) | **Se elimina entero** — monday ya lo dibuja |
| Componentes UI hechos a mano (Modal, Dropdown, Stepper, Avatar, ProgressBar) | Sus equivalentes de `@vibe/core` |
| `VITE_*_TOKEN` leído con `import.meta.env` | `MONDAY_TOKEN` server-side + proxy |

## ⛔ Paso 0 — RED DE SEGURIDAD (bloqueante, antes de tocar un solo archivo)

Esta skill **reescribe pantallas, borra dependencias y elimina componentes enteros**. Sin esto, un
error no tiene vuelta atrás.

```
git rev-parse --is-inside-work-tree
git status --porcelain
```
- **Si NO es un repo de git** → PARÁ. Pedile al usuario que haga `git init` + commit, o una copia de
  la carpeta. No sigas sin respaldo.
- **Si hay cambios sin commitear** → PARÁ. Que commitee primero.
- Con el árbol limpio, **creá una rama**: `git checkout -b adaptacion-vibe`.

Recién ahí empezá.

## Cómo trabajar (incremental, sin romper)

1. **Reglas primero**: dejá el `CLAUDE.md` en la raíz.
   ⚠️ **Si YA existe, NO lo sobrescribas.** Puede tener la sección `## Datos de esta app` con los
   board/column IDs reales del cliente — es lo más valioso del proyecto. En ese caso, **agregale**
   las secciones de reglas que le falten y **conservá intacto** todo lo que ya tenía.
   Solo si no existe, copiá `${CLAUDE_PLUGIN_ROOT}/templates/CLAUDE.md`.
2. **Inventario**: listá qué hay que cambiar y mostráselo al usuario antes de tocar nada.
3. **Base**: instalá las dependencias de verdad (`npm install @vibe/core @vibe/icons monday-sdk-js`,
   no alcanza con editar el `package.json`), importá `@vibe/core/tokens` en el entry, y creá
   `src/lib/monday.js` + `api/monday.js` (templates en `${CLAUDE_PLUGIN_ROOT}/templates/`).
4. **Pantalla por pantalla**: convertí una, verificá con **`npm run build`** que sigue compilando, y
   recién pasá a la siguiente. No conviertas todo de una.
   ⚠️ Para verificar usá `npm run build` (termina). **Nunca `npm run dev`**: levanta un servidor que
   no termina y cuelga la sesión.
5. **Centralizá el acceso a datos**: que ningún componente llame a `fetch` o al SDK directo.
6. **Sacá lo prohibido** (Next.js, otras librerías de UI).
   **Tailwind**: sacá la dependencia y su config **solo cuando no quede ninguna clase de Tailwind en
   `src/`**. Verificalo con una búsqueda antes de borrar `tailwind.config.*` / `postcss.config.*`, o
   vas a romper el estilo de lo que quedó sin convertir.
   **TypeScript**: por defecto **se queda**. Convertir a JS solo si el usuario lo pide explícitamente,
   y nunca a mitad de la conversión.

## Preservá el diseño
⛔ **Los screenshots los saca el USUARIO** (vos no podés capturar pantalla). Antes de empezar,
pedíselos: capturas de cada pantalla de la app original, andando. Sirven para dos cosas:
- Comparar que la versión adaptada se vea igual.
- Adjuntarlos después a monday vibe como referencia visual (`/monday-vibe:exportar` los pide).

Si no los manda, **decíselo explícitamente**: la comparación visual no se va a poder hacer y el
export a vibe va a quedar sin contrato visual.

Si el diseño tiene colores propios del cliente, mantenelos; para todo lo demás, usá los tokens de Vibe.

## Si encontrás un token con prefijo `VITE_`
Renombrarlo **no alcanza**: ese token ya se inlineó en cada build que se haya hecho, y probablemente
esté publicado. **Hay que rotarlo en monday** (perfil → Developers → API token → regenerar).
Decíselo al usuario de forma explícita.

## Al terminar
1. Corré `/monday-vibe:revisar` para confirmar que quedó todo en regla.
2. Verificá con **`npm run build`** que compila.
3. Pedile al usuario que corra `npm run dev` **en su terminal** y confirme que se ve bien
   (vos no lo corras: no termina).
4. Con todo OK, commiteá la rama y seguí con `/monday-vibe:publicar` o `/monday-vibe:exportar`.

## Si algo no se puede convertir
Decilo claramente en vez de improvisar: qué feature es, por qué no entra en vibe, y qué alternativas
hay (dejarla fuera, resolverla distinto, o mantener esa parte fuera de monday).
