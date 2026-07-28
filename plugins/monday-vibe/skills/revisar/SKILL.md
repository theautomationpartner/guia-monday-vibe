---
name: revisar
description: Revisa que el entorno y el proyecto estén listos para trabajar con apps de monday (Node, git, cuentas, token bien guardado, IDs reales, stack correcto). Usar cuando el usuario diga "revisá si está todo bien", "qué me falta", "no me anda", "chequeá el entorno" o antes de publicar/exportar.
---

# /revisar — el "doctor" del entorno y del proyecto

Diagnóstico rápido para que nadie se quede trabado. Reportá con ✅ / ⚠️ / ❌ y, para cada ❌, **decí
exactamente cómo arreglarlo**. No dejes al usuario adivinando.

## A. Herramientas de la máquina
| Chequeo | Comando | Si falla |
|---|---|---|
| Node 18, 20 o 22+ | `node --version` | Instalar Node LTS desde nodejs.org. ⚠️ Las versiones impares (19, 21) NO sirven: Vite las rechaza |
| npm | `npm --version` | Viene con Node |
| git | `git --version` | Instalar desde git-scm.com |

**Windows:** si algún comando falla con *"la ejecución de scripts está deshabilitada"*, indicale al
**USUARIO** que corra en su PowerShell: `Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force`.
⛔ No lo ejecutes vos: sin `-Force` pide confirmación y cuelga la sesión, y además cambia una política
de la máquina.

Si el usuario va a usar `/monday-vibe:publicar`, chequeá también (todos terminan):
`gh --version` · `vercel --version` · `gh auth status` · `vercel whoami`.
Y que el proyecto compile: que exista `node_modules` y que `npm run build` pase.
⛔ Nunca corras `npm run dev`: no termina.

## B. Seguridad del token (BLOQUEANTE — lo más importante)
1. ¿Existe `.gitignore` y contiene `.env.local` y `.env`? → si no, agregalo YA.
2. Primero confirmá que hay repo: `git rev-parse --is-inside-work-tree`. Si no lo hay, saltá este
   punto (no es un error: el proyecto todavía no se versionó).
   Si lo hay: `git ls-files -- "*.env*"` (evitá `| grep`: no existe en PowerShell). Solo puede
   aparecer `.env.example`. Si hay otro, **sacalo** del control de versiones y **rotá el token**.
3. Buscá tokens filtrados con el patrón `eyJ`, **acotado a `src/` y `api/`** (nunca sobre todo el
   repo: barre `node_modules`). En el historial: `git log -S eyJ --oneline -- src api`.
   ⛔ Reportá **solo archivo y línea, nunca el valor**. No leas ni imprimas `.env.local`.
   Si aparece uno commiteado: **hay que rotar el token en monday** (borrarlo del archivo no alcanza,
   queda en el historial).
4. ¿Alguna variable de token tiene prefijo `VITE_`? → ❌ **grave**. Buscá específicamente
   `import.meta.env.VITE_*TOKEN*` en `src/`. Aunque esté pensado "solo para dev", **Vite inlinea ese
   valor en el bundle al compilar**: si la variable existe en el entorno de build (o alguien la carga
   por error en Vercel), el token queda dentro del JS público. Renombrala a `MONDAY_TOKEN` (sin
   `VITE_`) y que el acceso vaya siempre por el proxy.
5. ¿El token se usa SOLO dentro de `api/monday.js`? Si algún componente del frontend lo lee → ❌.

## C. Proyecto
- ¿Existe `CLAUDE.md` en la raíz? Si no → sugerí `/monday-vibe:iniciar` (o copiarlo del plugin).
- ¿Existe `src/lib/monday.js` y los componentes lo usan (nadie llama a `fetch`/`monday-sdk-js` directo)?
- ¿Existe `api/monday.js` (el proxy)?
- **Stack**: revisá `package.json`. Si hay `next`, `@mui/*`, `shadcn`, `tailwindcss`, `@chakra-ui/*`
  → ⚠️ está fuera del stack vibe-compatible; sugerí `/monday-vibe:adaptar`.
- ¿Está `@vibe/core` (no el legacy `monday-ui-react-core`)?

## D. Layout y tema (la app va embebida en monday)
- 🔴 **¿La app reconstruye el chrome de monday?** Buscá componentes tipo `AppShell`, `Sidebar`,
  `Topbar`, `WorkspacePanel`, rails de iconos, árboles de tableros o headers de cuenta. Si están →
  **sobran**: monday ya los dibuja alrededor del iframe. Es trabajo que se tira y hace que la app
  quede diseñada para pantalla completa en vez del espacio real.

> ⚠️ **Verificá en el CÓDIGO, no en el README.** Los READMEs se desactualizan: pueden describir
> componentes que ya se borraron (o no mencionar los que se agregaron). Todo hallazgo de este
> reporte tiene que salir de archivos reales, no de documentación.

Revisá el CSS/JSX **acotando la búsqueda a `src/`** (si no, barrés `node_modules` y `dist`):
- ⚠️ **Anchos o altos fijos en px** para el layout (`width: 1200px`, `height: 800px`) → tiene que ser fluido.
- ⚠️ **Colores hardcodeados** (`#fff`, `#323338`) en fondos/textos → se rompe en tema oscuro.
  Deberían salir de los tokens de Vibe.
- ⚠️ **Tablas anchas sin `overflow-x: auto`** en su contenedor → generan scroll horizontal de página.
- ⚠️ Grillas de varias columnas **sin colapso** en anchos chicos.
- Recordale al usuario probar en **DevTools modo responsive** (~400px / ~800px / ancho grande) y en
  **tema claro y oscuro** antes de dar la app por buena.

## E. Datos
- ¿El `CLAUDE.md` tiene la tabla de boards/columnas con **IDs reales**? Si hay `TODO` o IDs de ejemplo
  → ⚠️ conseguilos antes de exportar (ver `${CLAUDE_PLUGIN_ROOT}/docs/REQUISITOS.md`).
- ¿Cuántos boards usa la app? **El máximo por app de vibe es 5** (límite fijo). Si usa más, marcalo
  como bloqueante: hay que partir la app antes de exportar.

## F. Cuentas (preguntale, no lo podés verificar solo)
- GitHub y Vercel: ¿tiene cuenta?
- **monday destino**: ¿es cuenta **paga**, con **IA habilitada** por un admin, y con **créditos**?
  (Las cuentas free no pueden crear apps vibe; las de trial no pueden publicar.)

## Formato del reporte
Terminá con un resumen así:

```
RESUMEN
✅ Listo: <lista corta>
⚠️ Atender: <lista con el arreglo de cada uno>
❌ Bloqueante: <lista con el arreglo de cada uno>

Siguiente paso sugerido: <un solo paso concreto>
```

Si todo está ✅, decí explícitamente que puede seguir con `/monday-vibe:publicar` o
`/monday-vibe:exportar` según en qué etapa esté.
