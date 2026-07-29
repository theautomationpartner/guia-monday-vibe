---
name: iniciar
description: Crea y configura un proyecto nuevo de app de monday, listo para desarrollar local, desplegar en Vercel y después pasar a monday vibe. Usar SIEMPRE al empezar una app de monday nueva, o cuando el usuario diga "quiero hacer una app de monday", "empezar una app para monday", "crear app de monday vibe" o similar.
---

# /iniciar — arrancar una app de monday bien configurada

Tu trabajo: dejar al usuario con un proyecto **ya configurado** con las reglas del equipo, para que
todo lo que construya después traduzca bien a monday vibe con el mínimo de créditos.

## 1. Preguntá SOLO estas 4 cosas (una por una, cortito)

No abrumes. Si el usuario ya dio alguna en su mensaje, no la vuelvas a preguntar.

1. **Nombre de la app** (ej: "Panel de Cotizaciones").
2. **Tipo de app** en monday — explicá en criollo y pedí que elija:
   - `board_view` → una vista dentro de un tablero.
   - `item_view` → un panel dentro de un ítem.
   - `dashboard_widget` → un widget de dashboard.
   - `object` → app independiente (aparece en el panel izquierdo).
3. **Idioma de la interfaz** (lo que ve el cliente): español o inglés.
4. **¿Ya tenés los board/column IDs reales del cliente?**
   - Si **sí** → pedile que los pegue.
   - Si **no** → explicale cómo sacarlos (board ID en la URL; column IDs en la config de cada columna;
     ver `docs/REQUISITOS.md`) y avisá que **son imprescindibles**: sin IDs reales la app no sirve y
     después vibe adivina mal (= créditos quemados). Se puede arrancar el scaffold igual, pero dejá
     un `TODO` bien visible.

## 2. Chequeo mínimo del entorno
Verificá que exista Node (`node --version`). Si falla, indicá instalar Node LTS y parar.
Si el usuario reporta el error de PowerShell "la ejecución de scripts está deshabilitada", indicale
al **USUARIO** que corra en su PowerShell:
`Set-ExecutionPolicy -Scope CurrentUser RemoteSigned -Force`
⛔ No lo ejecutes vos: sin `-Force` pide confirmación y cuelga la sesión.

## 3. Decidí DÓNDE crear el proyecto (⚠️ nunca pises archivos)
1. Mirá la carpeta actual. **Si ya tiene un `package.json`, un `src/` o cualquier proyecto**, NO
   escribas nada ahí: preguntá si querés crear una subcarpeta nueva (sugerí el nombre de la app en
   kebab-case) o cambiar de directorio.
2. Si la carpeta está vacía, usala.
3. **Antes de escribir cada archivo, verificá que no exista.** Si alguno existe, pará y preguntá
   qué hacer. Nunca sobrescribas trabajo del usuario en silencio.

Confirmá la ruta elegida con el usuario antes de seguir.

## 4. Creá el proyecto
Copiá los archivos de `${CLAUDE_PLUGIN_ROOT}/templates/` a la carpeta del proyecto:

| Template | Destino | Notas |
|---|---|---|
| `CLAUDE.md` | `CLAUDE.md` | Las reglas. **Siempre.** |
| `package.json` | `package.json` | Reemplazá `APP_NAME` por el nombre real (en kebab-case) |
| `vite.config.js` | `vite.config.js` | |
| `index.html` | `index.html` | Reemplazá `APP_NAME` y `LANG_CODE` (`es`/`en`) |
| `main.jsx` | `src/main.jsx` | Importa los tokens de Vibe |
| `App.jsx` | `src/App.jsx` | Reemplazá `APP_NAME` |
| `App.css` | `src/App.css` | Fondo/texto por tokens: sin esto, en oscuro queda un marco blanco |
| `lib-monday.js` | `src/lib/monday.js` | Acceso a monday (3 modos) + tema + simulación de context |
| `api-monday.js` | `api/monday.js` | Proxy serverless (acá vive el token) |
| `verificar-render.mjs` | `verificar-render.mjs` | Chequea que la app **dibuje**, no solo que compile |
| `gitignore.txt` | `.gitignore` | **Crítico**: evita subir el token |
| `env.example` | `.env.example` | Y copialo también como `.env.local` |

Además, en el `CLAUDE.md` del proyecto agregá al final una sección **"## Datos de esta app"** con:
- Nombre, tipo de app (variant) e **idioma de la UI** elegidos.
- La tabla de boards/columnas con IDs reales (o el `TODO` si aún no los tiene).

## 5. Instalá dependencias y VERIFICÁ que compila Y que dibuja
1. Corré `npm install` en la carpeta del proyecto. Si falla, mostrá el error y sugerí el arreglo
   (normalmente: Node desactualizado o la execution policy de Windows).
2. **Verificá con `npm run build`** (NO con `npm run dev`).
   ⚠️ `npm run dev` levanta un servidor que **no termina nunca** y te deja colgado. Para comprobar
   que el proyecto compila usá siempre `npm run build`.
   - Si falla el import de `@vibe/core/tokens` o de algún componente: la API de Vibe pudo haber
     cambiado de versión. Verificá los nombres reales (con el MCP opcional `@vibe/mcp` o la doc en
     vibe.monday.com) y ajustá `main.jsx`/`App.jsx`. **No dejes el proyecto sin verificar.**
3. **Corré también `npm run verificar`.** ⚠️ **`build` en verde NO significa que la app funcione.**
   Es JavaScript: una prop que no existe (el clásico `Box.paddings.MEDIUM`, que es API de Vibe 2)
   compila perfecto y explota recién en runtime → React no monta nada → **pantalla en blanco**.
   `npm run verificar` monta la app de verdad y falla si no dibuja.
   - Si falla con "Cannot read properties of undefined": es una prop de Vibe inventada. En
     `@vibe/core` 4 las props son **strings** (`padding="medium"`, `type="text2"`, `gap="medium"`).
     Los valores válidos están en `node_modules/@vibe/{layout,typography}/dist/**/*.types.d.ts` —
     esa es la única fuente de verdad de la versión instalada. **No adivines ni tires de memoria.**
   - **Repetí este chequeo cada vez que toques la UI**, no solo al crear el proyecto.
4. Completá `BOARDS` en `src/lib/monday.js` con los board IDs reales del paso 1, **y los mismos IDs
   en `TABLEROS_PERMITIDOS` de `api/monday.js`**. Ese filtro es lo que impide que el proxy —que
   queda público en internet— sirva de relay hacia el resto de la cuenta del cliente.
   Si la app **escribe** en monday, sacá además el filtro de `mutation` del mismo archivo, y avisá
   que entonces la URL de Vercel hay que protegerla sí o sí.
5. Creá `.env.local` copiando `.env.example`, con `VITE_MONDAY_MOCK=1` y `MONDAY_TOKEN=` **vacío**
   (el token lo carga el usuario cuando quiera datos reales; nunca se lo pidas por chat).

## 6. Cerrá contando los próximos pasos (breve y claro)

```
✅ Proyecto listo: <nombre>  (tipo: <variant>, idioma: <es/en>)

Próximos pasos:
1. Corré VOS en tu terminal: npm run dev   → ver la app (arranca en modo mock)
2. Contame qué tiene que hacer la app y la construimos
3. /monday-vibe:publicar  → subirla a GitHub + Vercel para que el cliente la pruebe
4. /monday-vibe:exportar  → generar lo que se pega en monday vibe

⚠️ El token de monday va en .env.local (nunca en el repo). Ver docs/SEGURIDAD-TOKEN.md
```

Si la app es mediana o compleja, sugerí `/monday-vibe:planear` antes de codear.

## Reglas que NO se negocian (recordáselas si se desvía)
- UI con **`@vibe/core`** (nunca Next.js, shadcn, MUI, Tailwind). Charts: Recharts está OK.
- Todo acceso a monday pasa por `src/lib/monday.js`.
- El token **jamás** en el repo ni con prefijo `VITE_`.
- Los boards del cliente **ya existen**: usar IDs reales, no inventar.
