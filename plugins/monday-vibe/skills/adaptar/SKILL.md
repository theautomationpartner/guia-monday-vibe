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

## Cómo trabajar (incremental, sin romper)

1. **Inventario**: listá qué hay que cambiar y mostráselo al usuario antes de tocar nada.
2. **Base primero**: agregá `@vibe/core`, importá `@vibe/core/tokens` en el entry, y creá
   `src/lib/monday.js` + `api/monday.js` (templates en `${CLAUDE_PLUGIN_ROOT}/templates/`).
3. **Pantalla por pantalla**: convertí una, verificá que sigue andando, y recién pasá a la siguiente.
   No conviertas todo de una.
4. **Centralizá el acceso a datos**: que ningún componente llame a `fetch` o al SDK directo.
5. **Copiá el `CLAUDE.md`** del plugin a la raíz para que las reglas queden puestas de acá en más.
6. **Sacá lo prohibido** (Next.js, Tailwind para UI estándar, otras librerías de UI).

## Preservá el diseño
Antes de convertir, **sacá screenshots** de la app original. Sirven para dos cosas:
- Comparar que la versión adaptada se vea igual.
- Adjuntarlos después a monday vibe como referencia visual.

Si el diseño tiene colores propios del cliente, mantenelos; para todo lo demás, usá los tokens de Vibe.

## Al terminar
1. Corré `/monday-vibe:revisar` para confirmar que quedó todo en regla.
2. Probá la app localmente.
3. Seguí con `/monday-vibe:publicar` (Vercel) o `/monday-vibe:exportar` (a vibe).

## Si algo no se puede convertir
Decilo claramente en vez de improvisar: qué feature es, por qué no entra en vibe, y qué alternativas
hay (dejarla fuera, resolverla distinto, o mantener esa parte fuera de monday).
