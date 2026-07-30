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

**5. Todo comando que le pases al usuario va con el formato completo de 4.1. NO lo resumas.**
Tres cosas, siempre, aunque te parezca obvio:
- el `cd` con la **ruta absoluta**, en el mismo bloque;
- qué partes se escriben **literal** y cuáles se reemplazan;
- **la pantalla que va a ver** y qué contestar en cada pregunta.

⚠️ Esto ya falló **tres veces**, y la tercera fue con la regla escrita en esta misma skill: se
entregó `vercel env add MONDAY_TOKEN production` sin explicar nada, y el usuario preguntó si tenía
que reemplazar `MONDAY_TOKEN` por el token. Las dos veces anteriores no preguntó: **lo reemplazó**,
y el token quedó en el historial de PowerShell en texto plano.

`MONDAY_TOKEN`, `production`, `preview` **se escriben tal cual**. Lo único que cambia es la ruta.
Si dudás de si hace falta aclararlo: hace falta.

**5. Todo comando que le pases al usuario tiene que ser copiar-y-pegar, sin pensar.** Esto ya falló
en producción dos veces seguidas, con un dev con experiencia. Cada bloque que le des:

- **Empieza con el `cd` a la ruta absoluta del proyecto.** Nunca asumas dónde está parado. El error
  que aparece cuando no lo está (`Your codebase isn't linked to a project on Vercel`) apunta a otro
  lado y hace perder tiempo.
- **Marca qué es literal y qué es un hueco.** `MONDAY_TOKEN` es el nombre de una variable, se copia
  tal cual; un usuario lo reemplazó por el token y lo mandó por la línea de comandos.
- **Escribe lo que va a aparecer en pantalla y qué contestar en cada prompt.** "Te va a pedir el
  valor" no alcanza.
- **Ofrece la alternativa por interfaz web** cuando exista. No todo el mundo se lleva bien con una
  CLI interactiva, y el resultado es el mismo.

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

### 0.4 ¿Existe el proxy, y está acotado? (BLOQUEANTE)
Confirmá que existe `api/monday.js`. Sin eso la app no puede leer monday desde Vercel.

🔴 **Y confirmá que tenga sus filtros.** Ese endpoint queda público en internet y el token es
personal: arrastra todos los permisos de su dueño, incluida la escritura. Sin filtros es un relay
hacia la cuenta entera del cliente. Tienen que estar los tres (ver el template del kit):

| Filtro | Sin él, cualquiera con la URL puede |
|---|---|
| Bloqueo de `mutation` | **borrar o modificar** datos del cliente |
| Lista de campos raíz | listar usuarios, equipos y documentos de la empresa |
| Lista de tableros + exigir `ids` | leer **cualquier** tablero de la cuenta |

Si la app escribe en monday, el primero no va — pero entonces **la URL tiene que quedar protegida**,
y decíselo explícitamente al usuario.

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

⚠️ **`vercel git connect` falla con repos privados de una organización si la cuenta es Hobby:**
`The repository is private and owned by an organization, which is not supported on the Hobby plan (409)`.
**No es un bloqueante:** `vercel --prod` despliega igual desde la carpeta local; lo único que se
pierde es el deploy automático en cada push. Decíselo así al usuario, sin dramatizar, y ofrecé las
salidas (pasar el repo a la cuenta personal, o plan Pro). Nunca sugieras hacer público un repo de
cliente.

⚠️ Vercel **modifica dos archivos del usuario** al vincular: le agrega `.vercel` al `.gitignore` y
mete un `VERCEL_OIDC_TOKEN` en `.env.local`. Commiteá el `.gitignore` y **confirmá que el
`MONDAY_TOKEN` del usuario sigue estando** (sin imprimir su valor: mostrá solo los nombres de las
claves).

### 4.1 Cargar el token — ⛔ ESTE PASO LO HACE EL USUARIO

**Vos no ejecutes este comando ni le pidas el token por chat.**

🔴 **Cómo dar la instrucción (esto ya falló en la vida real, dos veces seguidas):**

**a) SIEMPRE incluí el `cd` con la ruta completa, en el mismo bloque.** El usuario puede estar
parado en cualquier carpeta. Si no está en la del proyecto, Vercel tira
`Your codebase isn't linked to a project on Vercel` — un error que no dice nada sobre la causa real.
Nunca des un comando suelto asumiendo dónde está parado.

**b) Aclará que `MONDAY_TOKEN` es el NOMBRE de la variable, no un hueco para rellenar.** Un usuario
reemplazó `MONDAY_TOKEN` por el token entero y lo mandó **en la línea de comandos** — quedó en el
historial de PowerShell en texto plano. Usá una imagen concreta: *"`MONDAY_TOKEN` es la etiqueta del
cajón; el token va adentro, cuando pregunte `Value?`"*.

**c) Escribí literalmente lo que va a aparecer en pantalla y qué contestar.** No alcanza con "te va
a pedir el valor".

Formato a usar:

````
Copiá y pegá estas DOS líneas juntas:

cd "<RUTA ABSOLUTA DEL PROYECTO>"
vercel env add MONDAY_TOKEN production

Después te va a preguntar:

  ? Store as sensitive? (y/N)   →  escribí  y  y Enter
  ? Value?                      →  pegá el token acá y Enter
                                   (no vas a ver lo que pegás, salen asteriscos: es normal)

Y repetí lo mismo para preview:
vercel env add MONDAY_TOKEN preview
````

**Alternativa sin terminal** (ofrecela siempre, para quien se traba): vercel.com → el proyecto →
Settings → Environment Variables → Key `MONDAY_TOKEN`, Value el token, marcar Production y Preview.

Si el token llegó a viajar en la línea de comandos, indicá limpiar el historial
(`Remove-Item (Get-PSReadlineOption).HistorySavePath` en PowerShell) **y rotarlo en monday**.

Recordale además que **`VITE_MONDAY_MOCK` no debe estar en 1 en Vercel** (si está, la app muestra
datos de ejemplo).

---

### 4.2 Si el usuario quiere hacer PÚBLICO el repo (para el deploy automático en Hobby)

Es una salida legítima al límite del plan Hobby, pero **antes de abrirlo hay que limpiar**, y no
alcanza con borrar archivos: **hacer público el repo publica también todo el historial de git.**

⚠️ Primero explicale que el historial de versiones **ya funciona** con el repo privado. Suele haber
confusión entre "guardar versiones en GitHub" (ya anda) y "que Vercel despliegue solo en cada push"
(eso es lo que el plan Hobby bloquea). Son cosas distintas.

Si aun así quiere abrirlo, hacé esto en orden:

1. **Buscá y sacá los datos del cliente.** Mostrale la lista antes de tocar nada:
   - Mails y nombres de personas → a variable de entorno (`VITE_...`)
   - `PLAN.md`, `CLAUDE.md` y cualquier doc con datos del cliente → al `.gitignore` (se quedan en el
     disco, salen del repo)
   - Scripts de migración de una sola vez → al `.gitignore`
   - **Datos de ejemplo con contenido real** (comentarios, nombres de proyecto) → reemplazar por
     texto inventado
   - Nombres de columna con nombre de persona (`"Yael's Comments"`) → a variable de entorno
   - Los **IDs de board/columna** pueden quedarse: sin token no dan acceso a nada. Decíselo, y que
     decida el usuario.
2. **Reescribí el historial**, o todo lo anterior sigue visible en los commits viejos:
   ```
   git checkout --orphan limpio
   git add -A
   git commit -m "..."
   git branch -D master && git branch -m master
   git push --force origin master
   ```
   ⚠️ Avisale que **se pierden los commits anteriores**. De ahí en adelante el historial se acumula
   normal. Y ojo: el branch nuevo pierde el tracking → el próximo push necesita `-u origin master`.
3. **Volvé a barrer** sobre `git ls-files` para confirmar que no quedó nada.
4. Recién ahí: `gh repo edit <owner>/<repo> --visibility public --accept-visibility-change-consequences`
5. **Escribí un README**: el repo ahora lo ve cualquiera.

## Paso 5 — Desplegar

⚠️ `vercel --prod` despliega **lo que hay en la carpeta local**, no lo que está en GitHub.
Asegurate de haber commiteado y pusheado todo antes, o el cliente prueba código que no está en el repo.

```
git status --porcelain      # tiene que estar vacío
vercel --prod
```

⛔ **No cortes un deploy a la mitad.** Si `vercel --prod` tarda, esperalo: matarlo deja un
deployment zombi y **los siguientes quedan en `Blocked`**, un estado que la CLI no explica
(`vercel ls` dice solo `UNKNOWN` y `vercel inspect --logs` viene vacío). Para salir: borralos con
`vercel remove <url> --yes` y volvé a desplegar limpio.

💡 Si el repo **sí** quedó conectado a GitHub, no uses `vercel --prod`: hacé `git push` y listo. Los
deploys que vienen del conector no se traban, y además queda registrado qué commit se desplegó.

📋 **El panel web dice más que la terminal.** Cuando algo raro pase con Vercel, mandá al usuario a
la pestaña *Deployments*: los estados reales (`Blocked`, `Queued`, `Error`) y su motivo aparecen ahí
y no en la CLI.

### 5.1 Proteger la URL (staging con datos reales de un cliente)

⚠️ **Antes de sugerir apagar la protección**, confirmá que `api/monday.js` tenga sus filtros (ver el
paso 0.4). Con los filtros puestos, el peor caso de una URL filtrada es que **lean** los datos que
la app muestra. Sin filtros, el peor caso es que **borren** el monday del cliente.

Y sé honesto con el usuario sobre el techo: en plan **Hobby** los links para compartir que saltean
la protección **no existen**. Solo hay prendida (solo su equipo de Vercel) o apagada (cualquiera con
la URL). Si no quiere ninguna de las dos, la alternativa es mostrarle la app al cliente por
videollamada — y no pierde casi nada, porque **la privacidad por usuario igual no se puede probar
fuera de monday**.
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
