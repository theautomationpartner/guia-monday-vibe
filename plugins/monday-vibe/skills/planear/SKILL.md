---
name: planear
description: Planifica una app de monday antes de escribir código (pantallas, modelo de datos con boards y columnas, orden de construcción). Usar en apps medianas o complejas, cuando el usuario diga "planeá la app", "cómo la armamos", "antes de codear pensemos" o al empezar una feature grande.
---

# /planear — pensar la app antes de codear

Improvisar es lo que hace que después haya que rehacer todo dentro de monday vibe (caro). Este paso
deja un **blueprint** claro antes de escribir una línea.

## Cómo trabajar
1. Si el usuario todavía no describió bien la app, hacé **2-3 preguntas puntuales** (qué problema
   resuelve, quién la usa, qué datos toca). No más.
2. Delegá el análisis al subagente **`vibe-planner`** (corre en su propio contexto y devuelve el
   blueprint limpio). Pasale: la descripción, el tipo de app, el idioma de la UI y —si existe— la
   tabla de boards/columnas con IDs reales del `CLAUDE.md`.
3. Presentá el blueprint al usuario y **pedile confirmación** antes de construir.

## El blueprint tiene que incluir
1. **Tipo de app** (variant) y por qué.
2. **Modelo de datos**: tabla de boards + columnas (nombre | column ID | tipo). ⚠️ La cantidad de
   boards permitida **depende del plan** de la cuenta (techo de la API: 20) — verificalo antes de
   cerrar el modelo. Si no entra, proponé cómo partir la app.
3. **Mapa de pantallas**: nombre de negocio + una frase de propósito cada una.
4. **Por pantalla**: qué muestra, qué acciones tiene, y sus estados (vacío / cargando / error).
5. **Lecturas y escrituras a monday**: qué se lee, qué se escribe y con qué mutation.
6. **Riesgos**: cosas que Vibe podría no cubrir, o decisiones que hay que tomar con el cliente.
7. **Plan incremental**: en qué orden construir (siempre arrancando por algo que corra end-to-end).

## Reglas
- Stack fijo: React + Vite + `@vibe/core` + `monday-sdk-js` (charts con Recharts si hace falta).
- Preferí lo **simple y describible**: el destino final es un prompt para monday vibe.
- Si faltan los **IDs reales**, marcalo como bloqueante — no inventes IDs ni nombres de columna.
- No escribas código en este paso. Solo el plan.

## Al terminar
Guardá el blueprint en `PLAN.md` en la raíz del proyecto y ofrecé empezar por el primer paso.
