---
name: publicar
description: Sube la app a GitHub y la despliega en Vercel con deploy automático y el token de monday guardado de forma segura, para que el cliente pueda probarla. Usar cuando el usuario diga "subir a Vercel", "desplegar", "publicar la app", "pasársela al cliente para que la pruebe" o similar.
---

# /publicar — GitHub + Vercel, con el token seguro

Objetivo: dejar la app **online y funcionando con datos reales**, para que el cliente la use y dé el
OK **antes** de gastar créditos en monday vibe.

---

## ⛔ REGLAS DURAS (leer antes de ejecutar nada)

**1. NUNCA ejecutes vos estos comandos — bloquean esperando que alguien escriba y cuelgan la sesión:**
`gh auth login` · `vercel login` · `vercel link` (sin `--yes`) · `vercel env add` · `npm run dev`
👉 Cuando haga falta uno, **mostráselo al usuario para que lo corra en SU terminal** y esperá su
confirmación antes de seguir.

**2. NUNCA pongas un secreto en la línea de comandos.** Está prohibido resolver un `vercel env add`
que se cuelga con algo tipo `echo $TOKEN | vercel env add ...`: eso escribe el token en el historial
del shell y en la transcripción del chat. El token lo carga **el usuario**, siempre.

**3. Nunca leas ni imprimas `.env.local`.** Al buscar secretos, reportá **solo archivo y línea**,
jamás el valor.

**4. Verificá ANTES de publicar, no después.** Una vez que algo se subió a GitHub, ya está afuera.

---

## Paso 0 — Chequeo previo (BLOQUEANTE)

### 0.1 ¿El proyecto compila?
```
npm install
npm run build
```
Ambos terminan (a diferencia de `npm run dev`). **No despliegues algo que no compila.**

### 0.2 ¿Está el `.gitignore` bien?
Tiene que incluir, como mínimo: `.env*` (con el asterisco, no solo `.env`), `node_modules/`,
`dist/` y `.vercel/`. Si falta alguno, agregalo ahora.

### 0.3 ¿Hay secretos en el código?
Buscá el patrón `eyJ` **acotado a `src/` y `api/`** (nunca sobre todo el repo: barre `node_modules`
y escupe basura). Reportá archivo y línea, sin el valor.

⚠️ Si encontrás un token hardcodeado, o una variable con prefijo `VITE_*TOKEN*`: moverlo **no
alcanza**. Ese token ya viajó en un bundle o en el historial → **hay que rotarlo en monday**
(perfil → Developers → API token → regenerar). Decíselo explícitamente al usuario.

### 0.4 ¿Existe el proxy?
Confirmá que existe `api/monday.js`. Sin eso la app no puede leer monday desde Vercel.

---

## Paso 1 — Herramientas y sesiones (chequear, no loguear)

Corré **solo estos** (todos terminan y no piden nada):
```
git --version
gh --version
vercel --version
gh auth status
vercel whoami
```

Según lo que falte, **pedile al usuario que corra en SU terminal**:
| Falta | Que corra el usuario |
|---|---|
| git | instalar de git-scm.com |
| gh | `winget install GitHub.cli` |
| vercel | `npm install -g vercel` |
| sesión de GitHub | `gh auth login` (elegir **HTTPS**) |
| sesión de Vercel | `vercel login` |

> En Windows, después de instalar algo hay que **cerrar y abrir VS Code** para que la terminal lo vea.

También verificá la identidad de git (si falta, `git commit` falla con un error confuso):
```
git config user.name
git config user.email
```
Si están vacías, pedile al usuario los valores y configuralos **solo para este repo** (sin `--global`).

---

## Paso 2 — Repo local y verificación de secretos (el orden importa)

### 2.1 ¿Ya está publicado?
```
git rev-parse --is-inside-work-tree
git remote get-url origin
```
Si **ya hay un remoto**, saltá al Paso 5 (solo commit + push): el proyecto ya está publicado.

### 2.2 Inicializar y preparar el commit
```
git init
git add .
```

### 2.3 🔒 VERIFICAR ANTES DE CREAR NADA REMOTO
```
git status --porcelain
git ls-files -- "*.env*"
```
De `git ls-files` **solo puede aparecer `.env.example`**.

⛔ Si aparece cualquier otro `.env`: **PARÁ**. Sacalo del control de versiones
(`git rm --cached <archivo>`), verificá el `.gitignore`, y avisale al usuario que **rote el token
en monday** por las dudas. No sigas hasta que la lista quede limpia.

### 2.4 Commit
```
git commit -m "Primera versión de la app"
```

---

## Paso 3 — Crear el repo en GitHub (privado, sin push automático)

```
gh repo create <nombre-del-proyecto> --private --source=.
```
`<nombre-del-proyecto>` = el nombre de la carpeta o el de `package.json`. **Confirmalo con el
usuario** antes de crearlo.

> ⚠️ **No uses `--push` acá.** Primero se verifica, después se sube.

### 3.1 Última verificación y recién ahí, push
Repetí `git ls-files -- "*.env*"`. Si sigue limpio:
```
git push -u origin HEAD
```

---

## Paso 4 — Conectar Vercel

```
vercel link --yes
vercel git connect --yes
```
`vercel git connect` vincula el repo: a partir de ahí **cada push despliega solo**.
Si alguno falla o pide algo interactivo, **pasáselo al usuario** o indicá hacerlo desde el dashboard
(Project → Settings → Git).

### 4.1 Cargar el token — ⛔ ESTE PASO LO HACE EL USUARIO
Pedile que corra en SU terminal:
```
vercel env add MONDAY_TOKEN production
```
La CLI le va a pedir el token; lo pega ahí. **Vos no ejecutes este comando ni le pidas el token por
chat.** Repetir para `preview` si quiere que las ramas también funcionen.

Recordale además que **`VITE_MONDAY_MOCK` no debe estar en 1 en Vercel** (si está, la app muestra
datos de ejemplo).

---

## Paso 5 — Desplegar

⚠️ `vercel --prod` despliega **lo que hay en la carpeta local**, no lo que está en GitHub.
Asegurate de haber commiteado y pusheado todo antes, o el cliente prueba código que no está en el repo.

```
git status --porcelain      # tiene que estar vacío
vercel --prod
```

### 5.1 Proteger la URL (staging con datos reales de un cliente)
El endpoint `/api/monday` queda accesible en internet. Recomendá **una** de estas:
- **Deployment Protection** de Vercel (Settings → Deployment Protection) — la más simple y la
  recomendada.
- O la guardia por clave, que necesita **DOS variables** en Vercel y un redeploy:
  `APP_PROXY_KEY` (servidor) **y** `VITE_APP_PROXY_KEY` con el mismo valor (se inlinea en el bundle
  al compilar). ⚠️ Si cargás solo la primera, **todas las llamadas devuelven 401 y la app deja de
  funcionar**. Y ojo: `VITE_APP_PROXY_KEY` viaja en el bundle público — frena bots, no es control de
  acceso real.

---

## Paso 6 — ⛔ Verificación: ESTO LO HACE EL USUARIO

**Vos no tenés navegador. Nunca marques estos ítems como ✅ por tu cuenta.**
Pasale la URL y esta checklist, y **esperá su respuesta**:

```
Probá la app en la URL de Vercel y confirmame:
[ ] Carga sin errores
[ ] Trae datos REALES de monday (no los de ejemplo)
[ ] Los flujos principales andan (crear/editar/filtrar)
[ ] Los estados de vacío y error se ven bien

Y con las DevTools en modo responsive (achicá la ventana a ~400px y ~800px):
[ ] No aparece scroll horizontal de la página
[ ] Nada se corta ni se superpone
[ ] Las tablas anchas scrollean dentro de su caja
[ ] Se ve bien en tema claro y en tema oscuro
```

---

## Paso 7 — Entregar al cliente
Pasale la URL (por canal privado, no la publiques). **Recién con su OK** se pasa a monday vibe con
`/monday-vibe:exportar`. Todo lo que se descubra acá es gratis; descubrirlo dentro de vibe cuesta
créditos.

---

## Si algo falla
| Error | Causa | Solución |
|---|---|---|
| La app carga pero sin datos | Falta `MONDAY_TOKEN` en Vercel, o `VITE_MONDAY_MOCK=1` | Cargar la env var / sacar el flag y redesplegar |
| **401 en `/api/monday`** | Se cargó `APP_PROXY_KEY` pero no `VITE_APP_PROXY_KEY` | Cargar las dos con el mismo valor y redesplegar |
| `500` en `/api/monday` | Token inválido o sin permisos | Revisar el token y sus permisos |
| Datos vacíos sin error | Board o column IDs equivocados | Verificar los IDs reales |
| `gh`/`vercel` "no se reconoce" | Recién instalados | Cerrar y abrir VS Code |
| `Please tell me who you are` | Falta identidad de git | `git config user.name` / `user.email` |

## Al terminar, recordá
- 🔒 Cuando la app pase a monday vibe (auth nativa, sin token), **rotá/revocá** el token de Vercel.
- El proxy y el token son **solo** de esta etapa: no deben aparecer en el prompt de vibe.
