# SEGURIDAD DEL TOKEN — una carilla

El token de monday es **la llave de la cuenta del cliente**. Tratalo como una contraseña.
Esta hoja dice exactamente dónde vive y dónde **nunca** debe aparecer.

---

## El viaje del token

```
            TOKEN (secreto del cliente)
                      │
        ┌─────────────┴─────────────┐
        ▼                           ▼
   [TU MÁQUINA]                 [VERCEL]
   .env.local                   Environment Variable
   (gitignoreado)               (encriptada)
        │                           │
        └────────► lo lee SOLO ◄────┘
                api/monday.js  (función serverless)
                      │
                      ▼
         agrega el Authorization y llama a monday
                      │
     el navegador le pega a /api/monday y NUNCA ve el token
```

---

## ✅ Los 2 lugares donde SÍ vive

| Dónde | Cómo | Protección |
|---|---|---|
| **Tu máquina** | `MONDAY_TOKEN=...` en `.env.local` | `.gitignore` lo bloquea |
| **Vercel** | *Settings → Environment Variables → `MONDAY_TOKEN`* | Encriptado; solo lo ve el server |

## ❌ Los 4 lugares donde NUNCA aparece

| Dónde | Por qué está protegido |
|---|---|
| **El repo / GitHub** | `.gitignore` incluye `.env` y `.env.local` |
| **El frontend / navegador** | El token **no** tiene prefijo `VITE_` → Vite no lo mete en el bundle |
| **El chat con Claude / la IA** | Lo pegás vos en tu archivo o en Vercel, nunca en una conversación |
| **El prompt de monday vibe** | En vibe la app usa auth **nativa** (sesión), no necesita token |

---

## Por qué existe el proxy `/api/monday`

Si el token estuviera en el código de React, **cualquiera que abra el navegador lo puede leer**
(está en el bundle). Por eso:

1. El frontend le pega a **`/api/monday`** (una función serverless, del lado del servidor).
2. Esa función lee `process.env.MONDAY_TOKEN` y le agrega el header `Authorization`.
3. Llama a la API de monday y devuelve el resultado.

👉 **El token nunca sale del servidor.** El cliente puede abrir DevTools y solo verá llamadas a
`/api/monday`, jamás el token.

---

## La regla del prefijo `VITE_` (la más fácil de arruinar)

| Variable | ¿La ve el browser? | Uso |
|---|---|---|
| `MONDAY_TOKEN` | ❌ No | ✅ **Correcto** para el token |
| `VITE_MONDAY_TOKEN` | ✅ **SÍ** | 🚨 **NUNCA** — expone el secreto |
| `VITE_MONDAY_MOCK` | ✅ Sí | ✅ OK (es solo un flag, no es secreto) |

**Regla:** si es secreto, **jamás** le pongas `VITE_`.

---

## Cargar el token en Vercel

**Opción A — dashboard:** proyecto → *Settings → Environment Variables* → nombre `MONDAY_TOKEN`,
pegás el valor, elegís los entornos, guardás.

**Opción B — CLI:**
```
vercel env add MONDAY_TOKEN production
```
Te lo pide, lo pegás, y va **encriptado** a Vercel. No queda en el repo ni en un log.

---

## Menor privilegio y rotación

- **Menor privilegio:** si la app **solo lee**, usá un token de un usuario con permisos de lectura.
  No uses un token de admin "por las dudas".
- **Rotación:** cuando la app pasa a **monday vibe** (que usa auth nativa), el token de Vercel ya no
  hace falta → **revocalo/rotalo**. No dejes llaves activas sin uso.
- **Ante la duda, rotá:** regenerar el token en monday es gratis e instantáneo (*perfil → Developers →
  API token*). Si sospechás que se filtró, rotalo y listo.

---

## Si el token se filtró (qué hacer)

1. **Regeneralo YA** en monday (*perfil → Developers → API token*) — eso invalida el viejo al instante.
2. Actualizá el nuevo en `.env.local` y en Vercel.
3. Si quedó commiteado, no alcanza con borrar el archivo: **queda en el historial de git**. Rotá el
   token igual (es la solución real) y revisá el historial.

---

## Verificación rápida (antes de cada push)

```bash
git status            # ¿aparece .env o .env.local? → NO debería
git grep -i "eyJ"     # ¿hay algo que parezca un token? → debería dar vacío
```

- [ ] `.gitignore` incluye `.env` y `.env.local`
- [ ] El token no tiene prefijo `VITE_`
- [ ] El token solo se usa dentro de `api/monday.js`
- [ ] En Vercel está cargado como Environment Variable
