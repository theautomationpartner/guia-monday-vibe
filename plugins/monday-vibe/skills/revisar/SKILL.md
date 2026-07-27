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
| Node 18+ | `node --version` | Instalar Node LTS desde nodejs.org |
| npm | `npm --version` | Viene con Node |
| git | `git --version` | Instalar desde git-scm.com |

**Windows:** si algún comando falla con *"la ejecución de scripts está deshabilitada"*, la solución es
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned` (una vez, responder S).

## B. Seguridad del token (BLOQUEANTE — lo más importante)
1. ¿Existe `.gitignore` y contiene `.env.local` y `.env`? → si no, agregalo YA.
2. ¿Hay algún `.env*` trackeado por git? (`git status`, `git ls-files | grep env`) → si sí, **sacalo**
   del control de versiones y **rotá el token**.
3. Buscá tokens filtrados en el código y en el historial: patrón `eyJ` (los tokens de monday son JWT).
   Si aparece uno commiteado: avisá que **hay que rotar el token en monday** (borrarlo del archivo no
   alcanza, queda en el historial).
4. ¿Alguna variable de token tiene prefijo `VITE_`? → ❌ **grave**: se expone al navegador. Renombrala
   a `MONDAY_TOKEN` (sin `VITE_`).
5. ¿El token se usa SOLO dentro de `api/monday.js`? Si algún componente del frontend lo lee → ❌.

## C. Proyecto
- ¿Existe `CLAUDE.md` en la raíz? Si no → sugerí `/monday-vibe:iniciar` (o copiarlo del plugin).
- ¿Existe `src/lib/monday.js` y los componentes lo usan (nadie llama a `fetch`/`monday-sdk-js` directo)?
- ¿Existe `api/monday.js` (el proxy)?
- **Stack**: revisá `package.json`. Si hay `next`, `@mui/*`, `shadcn`, `tailwindcss`, `@chakra-ui/*`
  → ⚠️ está fuera del stack vibe-compatible; sugerí `/monday-vibe:adaptar`.
- ¿Está `@vibe/core` (no el legacy `monday-ui-react-core`)?

## D. Datos
- ¿El `CLAUDE.md` tiene la tabla de boards/columnas con **IDs reales**? Si hay `TODO` o IDs de ejemplo
  → ⚠️ conseguilos antes de exportar (ver `${CLAUDE_PLUGIN_ROOT}/docs/REQUISITOS.md`).
- ¿La app usa **5 boards o menos**? (límite de monday vibe).

## E. Cuentas (preguntale, no lo podés verificar solo)
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
