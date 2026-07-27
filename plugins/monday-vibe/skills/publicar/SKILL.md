---
name: publicar
description: Sube la app a GitHub y la despliega en Vercel con deploy automático y el token de monday guardado de forma segura, para que el cliente pueda probarla. Usar cuando el usuario diga "subir a Vercel", "desplegar", "publicar la app", "pasársela al cliente para que la pruebe" o similar.
---

# /publicar — GitHub + Vercel, con el token seguro

Objetivo: dejar la app **online y funcionando con datos reales**, para que el cliente la use y dé el
OK **antes** de gastar créditos en monday vibe.

⚠️ **Regla de oro:** el token de monday **nunca** se sube al repo. Va como variable de entorno en
Vercel y lo usa solo la función `api/monday.js`.

---

## Paso 0 — Chequeo previo (BLOQUEANTE)
Antes de tocar nada:
1. ¿Existe `.gitignore` con `.env` y `.env.local`? Si no → **crealo/completalo ahora**.
2. ¿Hay algún `.env*` a punto de subirse? (`git status`) → sacalo del staging.
3. Buscá tokens en el código (patrón `eyJ`) → si hay uno hardcodeado, moverlo a variable de entorno
   **antes** de continuar.
4. ¿Existe `api/monday.js`? Si no, la app no va a poder leer monday desde Vercel (copiá el template).

Si algo de esto falla, **parar y arreglar**. No publiques con un token expuesto.

## Paso 1 — Herramientas
Verificá y, si falta, guiá la instalación:
| Herramienta | Chequeo | Si falta |
|---|---|---|
| git | `git --version` | git-scm.com |
| GitHub CLI | `gh --version` | `winget install GitHub.cli` (o cli.github.com) |
| Vercel CLI | `vercel --version` | `npm install -g vercel` |

> En Windows: usá `npm install -g`, **no** `npx` cada vez (npx re-descarga y da timeouts/EPERM).

**Logins (una sola vez por máquina, abren el navegador):**
- `gh auth login`
- `vercel login`

Avisale al usuario que estos dos pasos son interactivos y que los tiene que completar él.

## Paso 2 — Repo en GitHub (privado)
```
git init
git add .
git commit -m "Primera versión de la app"
gh repo create <nombre-app> --private --source=. --push
```
Después del commit, **verificá** que no se haya subido ningún `.env`:
```
git ls-files | grep -i env
```
Solo debería aparecer `.env.example` (que no tiene secretos).

## Paso 3 — Conectar Vercel
```
vercel link
```
Seguí el asistente (crear proyecto nuevo). Vercel detecta Vite solo.

## Paso 4 — Cargar el token (el paso clave)
```
vercel env add MONDAY_TOKEN production
```
La CLI le pide el token al usuario y lo guarda **encriptado en Vercel**. Repetir para `preview` si
quiere que las ramas también funcionen.

⚠️ **Nunca** pidas el token en el chat ni lo escribas en un archivo del repo. Que lo pegue en la CLI.

Si además quiere datos reales en `preview`/producción, recordá que el flag `VITE_MONDAY_MOCK` **no**
debe estar en 1 en Vercel (si está, la app muestra datos de ejemplo).

## Paso 5 — Desplegar y conectar el auto-deploy
```
vercel --prod
```
Después, en el dashboard de Vercel, confirmá que el proyecto quedó conectado al repo de GitHub: a
partir de ahí **cada `git push` despliega solo**.

## Paso 6 — Probar de verdad
Abrí la URL que devolvió Vercel y verificá:
- [ ] Carga sin errores.
- [ ] Trae **datos reales** de monday (no el mock).
- [ ] Los flujos principales funcionan (crear/editar/filtrar lo que corresponda).
- [ ] Estados vacío / error se ven bien.

## Paso 7 — Entregar al cliente
Pasale la URL y pedile que la use. **Recién con su OK** se pasa a monday vibe
(`/monday-vibe:exportar`). Todo lo que se descubra acá es gratis; descubrirlo dentro de vibe cuesta
créditos.

---

## Si algo falla
| Error | Causa típica | Arreglo |
|---|---|---|
| La app carga pero sin datos | Falta `MONDAY_TOKEN` en Vercel, o `VITE_MONDAY_MOCK=1` | Cargar la env var / sacar el flag y redeploy |
| `500` en `/api/monday` | Token inválido o sin permisos sobre esos boards | Revisar el token y sus permisos |
| Datos vacíos pero sin error | Board o column IDs equivocados | Verificar los IDs reales |
| `gh`/`vercel` no reconocidos | No instalados o falta reabrir la terminal | Instalar y abrir una terminal nueva |

## Al terminar, recordá
- 🔒 Cuando la app pase a monday vibe (auth nativa, sin token), **rotá/revocá** el token de Vercel.
- El proxy y el token son **solo** de esta etapa: no deben aparecer en el prompt de vibe.
