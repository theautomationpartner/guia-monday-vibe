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
2. Delegá el análisis al subagente **`monday-vibe:vibe-planner`** (ese es el `subagent_type` exacto:
   lleva el prefijo del plugin, sin él la delegación falla). Corre en su propio contexto y devuelve
   el blueprint limpio. Pasale: la descripción, el tipo de app, **el idioma de la UI** y —si existe—
   la tabla de boards/columnas con IDs reales del `CLAUDE.md`.
   Si todavía no hay `CLAUDE.md` (planear antes de `/iniciar`), decíselo y pedile que marque el
   modelo de datos como BLOQUEANTE hasta conseguir los IDs.
3. Presentá el blueprint al usuario y **pedile confirmación** antes de construir.

## El blueprint tiene que incluir
1. **Tipo de app** (variant) y por qué.
2. **Modelo de datos**: tabla de boards + columnas (nombre | column ID | tipo). ⚠️ **Máximo 5 boards por app**
   (límite fijo de vibe). Si el modelo necesita más, proponé cómo partir la app en varias.
3. **Mapa de pantallas**: nombre de negocio + una frase de propósito cada una.
4. **Por pantalla**: qué muestra, qué acciones tiene, y sus estados (vacío / cargando / error).
5. **Lecturas y escrituras a monday**: qué se lee, qué se escribe y con qué mutation.
6. **Riesgos**: cosas que Vibe podría no cubrir, o decisiones que hay que tomar con el cliente.
7. **Plan incremental**: en qué orden construir (siempre arrancando por algo que corra end-to-end).
8. **Bloqueantes de configuración** (ver abajo): lo que hay que hacer EN monday, a mano, antes de
   poder programar. Este punto es el que más veces frena una app a mitad de camino.

## 🔴 Bloqueantes que hay que detectar ACÁ, no cuando ya estás codeando

Todos estos aparecieron en proyectos reales **después** de empezar a construir, y cada uno costó
horas. Repasalos contra el diseño que estás proponiendo:

**¿El diseño necesita una columna "Connect boards"?**
No se pueden crear por API (`InvalidColumnTypeException`): hay que agregarlas **a mano desde la
interfaz**. Marcalo como bloqueante desde el día uno. Y salvo que de verdad haga falta navegar al
revés, que sea **de una sola vía**: la doble vía le mete una columna al tablero del cliente sin
aportar nada.

**¿Hay historial o registros vinculados a un ítem?**
Si el ítem se borra, monday **borra el vínculo** y los registros quedan huérfanos para siempre.
Proponé desde el plan una **columna de texto con el nombre del ítem de origen**.

**¿La app promete privacidad?**
⚠️ **No se puede probar fuera de monday.** En local y en Vercel la app pasa por el proxy, que usa un
único token: **todos los usuarios entran como el dueño del token**. La privacidad por usuario recién
funciona dentro de monday (`monday.api()` con la sesión). Decilo en el plan y dejá la verificación
como paso posterior al deploy en vibe — si no, alguien va a "probar" en Vercel, ver los datos de
otro, y pensar que la app está rota (o peor: darla por buena sin haberla probado).

Y aclarale al cliente **quién más va a ver los datos**: el dueño del board privado los ve todos.
Eso es una decisión de negocio, no un detalle técnico.

**¿Hace falta capturar cambios de una columna?**
La app **solo corre cuando alguien la tiene abierta**. Para capturar cambios hace falta una
**automatización de monday**, que corre siempre. Definí en el plan qué automatización, con qué
mapeo, y **quién la va a configurar**.

**¿Los datos que la app va a mostrar existen?**
Antes de prometer un historial, **contá lo que hay**. En un caso real el cliente esperaba meses de
comentarios y existían tres. Mejor saberlo en el plan que en la demo.

**¿Se va a probar sobre tableros del cliente?**
Las columnas de texto **se reemplazan**: escribir una prueba encima **destruye el dato real**.
Dejá dicho en el plan que hace falta un ítem de prueba propio, o uno con la columna vacía.

## Reglas
- Stack fijo: React + Vite + `@vibe/core` + `monday-sdk-js` (charts con Recharts si hace falta).
- Preferí lo **simple y describible**: el destino final es un prompt para monday vibe.
- Si faltan los **IDs reales**, marcalo como bloqueante — no inventes IDs ni nombres de columna.
- No escribas código en este paso. Solo el plan.

## Al terminar
Guardá el blueprint en `PLAN.md`.
- Si `PLAN.md` **ya existe**, preguntá antes de pisarlo (o guardá como `PLAN-2.md`): puede tener
  ediciones a mano del usuario.
- Si todavía **no hay carpeta de proyecto** (estás planeando antes de `/iniciar`), preguntá dónde
  guardarlo. No lo escribas a ciegas en el directorio actual.

Después ofrecé empezar por el primer paso del plan.
