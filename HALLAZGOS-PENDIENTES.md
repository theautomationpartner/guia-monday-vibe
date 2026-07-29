# Hallazgos pendientes de revisar

Cosas que fallaron **usando la skill de verdad**, ya parcheadas en el código pero **sin publicar**.
Revisar todo esto junto antes de sacar la próxima versión y avisarle al equipo.

> **Estado: cambios hechos localmente, NO publicados.** Los compañeros siguen con la 0.2.0.

---

## 1. Claude escribe los componentes de Vibe con la API vieja

**Dónde apareció:** app *Private Comments History*, 28/07/2026. Primera pantalla: **en blanco**.

**Qué pasó:** escribí `Box.paddings.MEDIUM`, `Text.types.TEXT2`, `Flex.gaps.MEDIUM`. Esa es la API
de **Vibe 2** (`monday-ui-react-core`). En `@vibe/core` 4 **no existe**: las props son strings
(`padding="medium"`). `Box.paddings` es `undefined` → `.MEDIUM` tira TypeError → React no monta
nada → pantalla en blanco.

**Por qué lo hizo Claude:** hay muchísimo código y muchísima documentación de Vibe 2 dando vueltas.
Sale de memoria sin querer. **Le va a pasar a cualquiera.**

**Parche aplicado:** tabla de equivalencias Vibe 2 → Vibe 4 en `templates/CLAUDE.md`, apuntando a
`node_modules/@vibe/{layout,typography}/dist/**/*.types.d.ts` como única fuente de verdad.

**A revisar más adelante:**
- [ ] ¿Alcanza con la tabla o Claude igual la ignora? Probar con un dev nuevo de verdad.
- [ ] ¿Conviene que `/iniciar` lea los `.d.ts` de la versión instalada y escriba las props válidas
      en el `CLAUDE.md` del proyecto? Así no depende de una tabla que puede quedar vieja.

---

## 2. 🔴 El más importante: `npm run build` en verde NO significa que la app funcione

**Esto es lo que más me preocupa del kit tal como estaba.** El paso de verificación de `/iniciar`
era `npm run build`, y **el build pasó perfecto con la app completamente rota.**

Es JavaScript: nadie comprueba que una propiedad exista hasta que el código corre.

**Por qué duele en plata:** si esto llega a monday vibe, publicás una app que no dibuja, le pedís a
la IA que la arregle, y son **créditos quemados por un error que se detectaba gratis en local**.

**Parche aplicado:** `templates/verificar-render.mjs` + script `npm run verificar`. Monta la app de
verdad (sin navegador, sin token, sin internet) y falla si no dibuja. Enganchado en `/iniciar`
(paso 5) y `/revisar` (sección C-bis). Probado en los dos sentidos: pasa cuando debe pasar y falla
cuando debe fallar, con el diagnóstico exacto.

**A revisar más adelante:**
- [ ] Corre en Node, así que no hay `window`. Si una app lo toca en el primer render, falla acá
      aunque en el navegador ande. Está avisado en los comentarios del script, pero **hay que ver
      cuántos falsos positivos genera en apps reales.**
- [ ] Solo prueba el estado inicial. No prueba los estados de error/vacío/sin-acceso ni los clicks.
      ¿Vale la pena crecerlo o con esto alcanza?
- [ ] ¿Debería `/exportar` negarse a generar el prompt si `npm run verificar` no pasa?

---

## 3. monday devuelve una lista vacía en vez de "no tenés permiso"

**Dónde apareció:** al correr la migración con el token equivocado (uno de TAP contra boards de
Sonivie).

**Qué pasó:** la query pidió dos boards. monday respondió **HTTP 200 con `boards: []`**. Sin error,
sin aviso. El script reventó después con un `Cannot read properties of undefined` que no dice nada.

**Por qué es peligroso:** en una app el síntoma es **una pantalla vacía que parece "no hay datos"**.
Podés pasarte horas buscando un bug en el código cuando el problema es de permisos o de cuenta.

Pasa cuando: el token es de otra cuenta, o el board es privado y el dueño del token no está
suscripto.

**Parche aplicado:** gotcha nuevo en `templates/CLAUDE.md` — validar siempre que el board vino antes
de usarlo, y diagnosticar con `{ me { name account { id name } } }` para saber contra qué cuenta
estás pegando en realidad.

**A revisar más adelante:**
- [ ] ¿Vale que `src/lib/monday.js` traiga de fábrica un helper tipo `exigirBoard()` para que esto
      no dependa de que alguien se acuerde?

---

## 4. Las columnas "Connect boards" no se pueden crear por API

**Qué pasó:** `create_column` con `board_relation` → `InvalidColumnTypeException`. Hay que agregarla
a mano desde la interfaz. **Bloqueó el desarrollo** hasta que el usuario la creó.

**Parche aplicado:** anotado en los gotchas, junto con la recomendación de dejarla **de una sola
vía** (la doble vía agrega una columna al board del cliente sin aportar nada).

**A revisar más adelante:**
- [ ] `/planear` debería detectar que el diseño necesita una columna conectada y **avisarlo como
      bloqueante desde el día uno**, no cuando ya estás codeando.

---

## 5. `process.loadEnvFile()` NO pisa las variables de entorno del sistema

**Dónde apareció:** al correr la migración. Pegué el token correcto de Sonivie en `.env.local` y el
script **seguía usando el de TAP**.

**Qué pasó:** había un `MONDAY_TOKEN` viejo cargado en las variables de entorno de Windows.
`process.loadEnvFile(".env.local")` lee el archivo pero **no sobrescribe lo que ya existe en
`process.env`**. Resultado: editás el archivo, no cambia nada, y no hay ningún mensaje que lo
explique.

**Por qué es traicionero:** es exactamente el tipo de cosa que te hace dudar de todo lo demás. Yo
mismo empecé a sospechar de los permisos del token antes de darme cuenta.

**Parche aplicado:** en el script de migración, leer el `.env.local` a mano y darle prioridad al
archivo. Además, **imprimir siempre contra qué cuenta se está pegando** al arrancar
(`{ me { name account { id name } } }`) — ese log fue lo que destapó el problema en 2 segundos.

**A revisar más adelante:**
- [ ] ¿El template `api/monday.js` tiene el mismo problema? En Vercel las env vars vienen del
      panel, así que probablemente no, pero **hay que confirmarlo**.
- [ ] ¿Conviene que todo script del kit arranque diciendo "estás pegando contra la cuenta X"?
      Cuesta una query y evita horas.

---

## 6. 🔴 Las fechas de monday vienen convertidas de huso en `text`, y en UTC en `value`

**Dónde apareció:** al verificar la migración. Para el mismo ítem:

```
value = {"date":"2026-07-27","time":"08:05:08"}   ← UTC real
text  = "2026-07-27 05:05"                        ← ya pasado a hora argentina, SIN decirlo
```

**Por qué es grave:** `text` no trae indicador de zona, así que `new Date(text)` lo interpreta como
hora local del navegador y **el desfasaje se aplica dos veces**. En esta app —desarrollada en
Argentina, usada por Yael en Israel— eran **6 horas de error**, en una app cuyo único propósito son
las fechas. Y no se nota mirando la pantalla: los números parecen razonables.

Los campos `... on DateValue { date time }` tienen exactamente el mismo problema que `text`.

**Parche aplicado:** gotcha nuevo en `templates/CLAUDE.md` — para fechas usar siempre `value` y
armar el ISO a mano (`${date}T${time}Z`).

**A revisar más adelante:**
- [ ] ¿Vale un helper `fechaDeColumna(cv)` de fábrica en `src/lib/monday.js`? Esto es demasiado
      fácil de hacer mal y demasiado difícil de notar.
- [ ] **¿Le pasa lo mismo a otros tipos de columna?** (`creation_log`, `last_updated`, `timeline`)
      Habría que verificarlo con datos reales antes de confiar.

---

## 7. 🔴 Los comandos que le pasamos al usuario no eran a prueba de nada

**Dónde apareció:** en `/publicar`, cargando el token en Vercel. **Falló dos veces seguidas**, con un
dev con experiencia — o sea que con alguien nuevo falla seguro.

**Falla 1 — `MONDAY_TOKEN` se leyó como un hueco para rellenar.** La instrucción decía
`vercel env add MONDAY_TOKEN production` + "te va a pedir el valor". El usuario reemplazó
`MONDAY_TOKEN` por el token entero. Consecuencia: **el token viajó en la línea de comandos y quedó
en el historial de PowerShell en texto plano.** Justo lo que la regla 2 de la skill prohíbe... para
Claude, pero no había nada que evitara que lo hiciera el usuario.

**Falla 2 — el comando asumía la carpeta.** Se lo di suelto, sin `cd`. El usuario estaba parado en
otra carpeta y Vercel respondió `Your codebase isn't linked to a project on Vercel`, un error que
apunta a un problema que no era.

**Pedido textual del usuario:** *"da las instrucciones correctamente como para inútiles, tenelo en
cuenta en la skill"*.

**Parche aplicado:** regla dura nueva (nº 5) en `/publicar` + reescritura del paso 4.1. Todo bloque
que se le pase al usuario ahora tiene que: arrancar con el `cd` a la ruta absoluta, marcar qué es
literal y qué es un hueco, transcribir los prompts que va a ver y qué contestar en cada uno, y
ofrecer la alternativa por interfaz web.

**A revisar más adelante:**
- [ ] **La misma regla vale para TODAS las skills**, no solo `/publicar`. Hay que repasar
      `/iniciar`, `/revisar`, `/exportar` y `/adaptar` con el mismo criterio.
- [ ] ¿Conviene que las skills ofrezcan siempre el camino por interfaz web además del de la CLI?
- [ ] Falta un paso de "limpiar el historial del shell" para cuando un secreto ya viajó por ahí.

---

## 8. `vercel git connect` falla con repos privados de una organización (plan Hobby)

**Qué pasó:** `The repository is private and owned by an organization, which is not supported on the
Hobby plan (409)`. La skill lo daba por hecho.

**No es bloqueante:** `vercel --prod` despliega igual desde la carpeta local. Solo se pierde el
deploy automático en cada push, que para staging da lo mismo.

**Parche aplicado:** avisado en el paso 4 de `/publicar`, con las salidas posibles y la aclaración
de **no** sugerir hacer público un repo de cliente.

**A revisar más adelante:**
- [ ] Anotado también: Vercel **edita dos archivos del usuario** al vincular (agrega `.vercel` al
      `.gitignore` y mete `VERCEL_OIDC_TOKEN` en `.env.local`). Conviene chequear siempre que el
      `MONDAY_TOKEN` siga estando después de `vercel link`.

---

## 9. Mensajes de desarrollo en español filtrándose a una app en inglés

**Dónde apareció:** al abrir la URL de Vercel sin parámetros, el cliente veía:

> **Something went wrong**
> *Estás corriendo fuera de monday, así que no hay ítem abierto. Agregá ?itemId=&lt;id&gt; a la URL…*

Tres problemas en un solo cartel:
1. **Está en español**, en una app cuya UI se definió en inglés.
2. **Le explica un truco de desarrollo** a alguien que no es desarrollador.
3. **Lo trata como un error** (*"Something went wrong"*) cuando el usuario no hizo nada mal:
   simplemente abrió la app fuera de un ítem.

**Por qué se coló:** el mensaje nació como ayuda para probar en local y nadie pensó que iba a
terminar en el build desplegado. Es el mismo idioma en el que están los comentarios del código, así
que "se ve natural" mientras programás.

**Parche aplicado en la app:** el texto visible pasó a inglés, la pista técnica queda detrás de
`import.meta.env.DEV` (o sea, solo con `npm run dev`, nunca en producción), y el caso "sin ítem"
dejó de ser un estado de error para tener el suyo propio.

**A revisar más adelante:**
- [ ] **Regla para el `CLAUDE.md` del kit:** los comentarios del código van en español, pero
      **todo string que puede ver el usuario va en el idioma de la app**. Hoy no está escrito en
      ningún lado.
- [ ] **Chequeo para `/revisar` y `/publicar`:** buscar en `src/` strings con acentos o signos de
      apertura (`¿` `¡`) cuando la UI es en inglés. Es un grep de una línea y lo detecta al toque.
- [ ] **Que las pistas de desarrollo estén siempre detrás de `import.meta.env.DEV`.** Vale también
      para `console.log` con datos del cliente.
- [ ] Repasar los estados: "no hay ítem", "no tenés acceso" y "no hay datos" **no son errores**.
      Mostrar "Something went wrong" en esos casos asusta al cliente al pedo.

---

## 10. La app no aplicaba el tema de monday: siempre se veía clara

**Dónde apareció:** revisando la app antes de mostrársela al cliente. Nunca se había abierto en modo
oscuro — nadie programa con el navegador en oscuro.

**Qué pasa:** los colores de Vibe son variables CSS definidas bajo `.light-app-theme`,
`.dark-app-theme` y `.black-app-theme`. Si la app no pone ninguna clase, **queda siempre en claro**.
Usar componentes de Vibe **no alcanza**. Adentro de monday en modo oscuro, la app es un bloque
blanco en el medio de la pantalla.

Y hay un segundo nivel: aunque apliques la clase, el `<body>` sigue blanco, porque la página no es
de Vibe. Queda un marco blanco alrededor.

**Parche aplicado:** `useMondayTheme()` de fábrica en `lib-monday.js` (aplica la clase y escucha los
cambios de tema en vivo), `App.css` nuevo con `body { background: var(--primary-background-color) }`,
regla en `CLAUDE.md`, chequeo D-0 en `/revisar`, y `?theme=dark` para probarlo en un segundo.

**A revisar más adelante:**
- [ ] ¿Se puede detectar automáticamente en `npm run verificar`? Hoy solo prueba el tema por defecto.

---

## 11. El proxy era un relay de lectura a TODA la cuenta del cliente

**El hallazgo de seguridad más grande de la sesión.** El template aceptaba cualquier consulta
GraphQL. Como el token de monday es **personal** —arrastra todos los permisos de su dueño, incluida
la escritura, porque monday no permite emitir tokens de solo lectura— cualquiera que descubriera la
URL de Vercel podía leer todos los tableros del cliente, listar a su gente, y **borrar datos**.

**Se descubrió al querer apagar la protección de Vercel** para que el cliente probara la app.

**Parche aplicado:** tres filtros en `templates/api-monday.js`, probados en un proyecto recién
creado (9 casos). Cada uno tapa lo que los otros dejan pasar:

| Filtro | Sin él |
|---|---|
| Bloqueo de `mutation` | `delete_item` borra datos del cliente |
| Lista blanca de campos raíz | `{ users { email } }` lista la gente de la empresa |
| Lista blanca de tableros | `boards(ids:[OTRO])` lee cualquier tablero |
| Exigir `ids` en `boards` | `{ boards { name } }` lista todos, sin ningún número que validar |

Sub-hallazgo: la primera versión validaba **todos** los números largos de la consulta, y eso rompía
cualquier query que llevara el ID de un ítem. Hubo que acotarlo a los IDs de adentro de `boards(...)`,
resolviendo también las `$variables`.

**A revisar más adelante:**
- [ ] Los filtros son por regex, no por parseo real de GraphQL. Alcanza para una lista blanca, pero
      **habría que buscarle agujeros a propósito** (alias, fragments, `query` con nombre raro).
- [ ] ¿Conviene que `/iniciar` complete `TABLEROS_PERMITIDOS` solo, a partir de `BOARDS`?
- [ ] Falta un chequeo automático: hoy `/revisar` lo mira, pero no lo prueba.

---

## 12. `npm run dev` no servía para probar con datos reales

El template mandaba a usar `vercel dev`, o sea instalar la CLI y crearse una cuenta **solo para ver
la app con datos del cliente**. Mucha fricción para algo tan básico.

**Parche aplicado:** un plugin de Vite en `vite.config.js` que sirve `/api/monday` en desarrollo,
**reusando el mismo `api/monday.js`** que se despliega (no hay dos implementaciones que se
desincronicen, y los filtros de seguridad también se prueban en local).

Y de paso arregla la variante #10 del problema de las variables de entorno: `loadEnv` de Vite, igual
que `process.loadEnvFile()`, **deja ganar a las variables del sistema** sobre el archivo. Es la
tercera vez que el mismo error muerde. Ahora el archivo manda, explícitamente.

---

## 13. La privacidad no se puede probar fuera de monday

Fuera de monday la app pasa por el proxy, que usa **un solo token**: da igual quién abra el link,
**todos entran como el dueño del token**. La privacidad por usuario recién existe adentro de monday,
donde `monday.api()` usa la sesión de cada persona.

**Por qué importa tanto:** es fácil abrir el link de Vercel, ver datos de otro, y concluir que la
app está rota. O peor: mostrársela al cliente, que vea sus datos, y **darla por aprobada** sin haber
probado nunca lo único que la app promete.

En este proyecto quedó como la última verificación pendiente, después del deploy en vibe.

**Parche aplicado:** bloqueante explícito en `/planear` y en el agente `vibe-planner`, y aviso en
`/publicar` antes de sugerir apagar la protección de Vercel.

---

## 14. `hasAccess: isOwner || entries.length > 0`

Una línea de lógica de permisos, al revés. Decía, en criollo: *"si hay algo para mostrar, entonces
esta persona tiene derecho a verlo"*. Con eso, el estado "esto es privado" **no se mostraba nunca**,
y el cartel "Only visible to you" le mentía a cualquiera que no fuera la dueña.

**Parche aplicado (en la app):** se pregunta lo correcto —¿tiene acceso al board privado?— usando el
gotcha de que monday devuelve `boards: []` sin acceso. Y el cartel cambia según quién mira.

**A revisar más adelante:**
- [ ] **Regla general para el kit:** "tener datos" nunca es prueba de "tener permiso". Habría que
      escribirla en `CLAUDE.md` como principio, no solo como gotcha de monday.

---

## 15. Cosas chicas que igual hicieron perder tiempo

- **Vercel edita archivos del usuario** al vincular: agrega `.vercel` al `.gitignore` y mete un
  `VERCEL_OIDC_TOKEN` en `.env.local`. Hay que commitear lo primero y verificar que el `MONDAY_TOKEN`
  siga estando.
- **Cortar un deploy a la mitad deja zombis** y los siguientes quedan en `Blocked` — un estado que la
  CLI no explica (`vercel ls` dice `UNKNOWN`, `vercel inspect --logs` viene vacío). **El panel web
  dice más que la terminal.**
- **Probar en dos proyectos a la vez confunde los puertos.** Con el 5173 ocupado, Vite arranca en el
  5174 y terminás probando la app equivocada — y sacando conclusiones falsas. Pasó.
- **Escribir una prueba en una columna de texto del cliente destruye el dato real** (se reemplaza, no
  se acumula). Hay que buscar un ítem con la columna vacía, o crear uno de prueba.
- **Un `git checkout --orphan` pierde el tracking del branch**: el próximo push necesita
  `-u origin master`.

---

# JORNADA 2 — construir la app en monday vibe de punta a punta

La app se construyó y publicó. **213 créditos en total: 33 el build inicial, 180 las correcciones.**
La lógica de datos salió perfecta a la primera y nunca se tocó; los 180 se fueron en envoltura.

Todo esto ya está parcheado en `/exportar` (v0.4.0). Queda para revisar si alcanza.

---

## 10. 🔴 El error más caro: describir una API de memoria

El prompt tenía **445 líneas de código pegado textual** y falló en la **única línea escrita a mano**:

    "monday.get('context') devuelve { itemId, theme, user: { email } }"

Es falso: devuelve `{ data: { itemId, ... } }`. El código correcto, con su `.data`, estaba en el
repo mientras se escribía esa línea. Vibe lo transcribió con fidelidad total y **la app no
funcionó** — `itemId` siempre undefined, sin un solo error visible.

Costó 3 hipótesis equivocadas, un build de diagnóstico y varias vueltas.

**Parche:** regla dura "CERO PROSA SOBRE APIs" en `/exportar`. Si hay que explicar qué devuelve una
llamada, va el JSON de una respuesta real.

**A revisar:**
- [ ] ¿Debería `/exportar` **negarse** a generar el prompt si detecta frases tipo "devuelve {" sin
      un bloque JSON al lado?

---

## 11. Construir y corregir son dos modos distintos

Un prompt de corrección escrito como informe (*"el estado inicial tiene X, y el if corta antes…"*)
**falló dos veces**. El mismo cambio escrito como orden (`De: noItem: true / A: noItem: false`)
salió a la primera.

Y el modelo importa al revés de lo que decía el kit: **Flash falló 3 veces seguidas en cambios de
una línea**; las mismas correcciones con Sonnet pasaron todas. **Editar es más difícil que generar.**

**Parche:** sección "El ciclo de corrección" + corregida la tabla de modelos.

---

## 12. 57 créditos (27% del total) en borrar una línea de CSS cosmética

Tres intentos para sacar un `max-width: 300px`. Y lo peor: se había dicho explícitamente *"yo no lo
mandaría, es cosmético"*… y se pasó el prompt igual.

**Decir "yo no lo haría, pero acá tenés el prompt" es no decidir.**

**Parche:** regla — lo cosmético se rechaza, no se ofrece "por las dudas".

---

## 13. Diagnosticar cuesta menos que razonar

Ante el síntoma, se plantearon tres hipótesis (*el preview*, *falta publicar*, *debe ser board
view*). **Las tres falsas.** Un build de diagnóstico —mostrar el JSON crudo en pantalla— dio la
respuesta exacta.

**Parche:** regla + el prompt de diagnóstico listo para copiar.

**A revisar:**
- [ ] Que sea el PRIMER paso ante cualquier síntoma, no el último.

---

## 14. Vibe no hereda el design system de monday

Se le mandaron capturas de una app hecha con `@vibe/core` y reconstruyó con **su propio sistema**:
`lucide-react`, variables HSL propias, otra tipografía. Copió el aspecto, no la implementación.

Después escribió CSS apuntando a tokens de monday que en su proyecto **no existen**. Cuando una
variable CSS no existe la declaración se descarta entera: **las tarjetas quedaron sin fondo y sin
borde**. Un build para arreglarlo.

**Parche:** sección 0f — no alcanza con decir "usá los tokens de Vibe".

---

## 15. El preview de vibe no sirve para validar una item view

No pasa el contexto del ítem: el tablero que muestra es inventado. Una item view ahí adentro
muestra **siempre** "sin ítem", esté bien o mal. Hay que publicar (publicar no gasta créditos).

---

## 16. En vibe no hay salida manual

La pestaña **Code** es de **solo lectura**. Si la IA no puede hacer un cambio, no lo podés hacer
vos. Cambia el cálculo de riesgo: desarrollar local no es solo más barato, es el único lugar
donde tenés el control.

---

## 17. Las capturas caducan, y hay que pedirlas antes

Unas capturas mostraban un rótulo cambiado media hora antes y **contradecían el texto del prompt**.
Y se pidieron después de escribir todo, cuando tendrían que haber sido lo primero.

Además: **al menos una tiene que ser angosta.** Es la más valiosa del set y la que nadie saca.

---

## 18. Automatizaciones de monday: lo aprendido configurándolas

- `Current value` vs `Previous value`: confundirlos guarda siempre el comentario viejo.
- El vínculo NO sale del formulario: es una ventana aparte (*Choose where to add a connection* →
  **Target board**).
- **Al duplicar hay que cambiar TRES cosas**, no dos: disparador, texto identificador Y **la
  condición**. Olvidar la condición hace que la automatización dependa de otra columna, sin error.
- `Now` en una columna de fecha guarda en UTC (verificado: 0 minutos de diferencia).

**Parche:** todo en los gotchas de `templates/CLAUDE.md`.

---

## 19. Lo que SÍ funcionó, y hay que proteger

**La lógica de datos salió perfecta en el primer build y sobrevivió 8 correcciones sin tocarse.**
Paginación con cursor, husos horarios, `boards` vacío como falta de permiso, desempate del orden,
nombre de respaldo.

Eso es mérito directo de:
1. Las **3 rondas de prueba ciega** antes de exportar.
2. Los **7 bugs reales** que esas rondas encontraron **en la app original** — incluido uno que
   perdía 9 de 209 entradas en producción, en silencio.

**La prueba ciega no valida el prompt: valida la app.** Es la parte más barata del proceso y la
que más plata salva. Ahora es una condición de entrega, no una sugerencia.

---

# JORNADA 3 — revisar las dos apps que el equipo ya habia hecho en vibe

Se leyeron las transcripciones completas de **Workload** (dashboard) y **Dedication** (item view),
las dos de la cuenta Sonivie, hechas ANTES de que existiera el kit.
Con eso pasamos de 1 caso medido a **3**, hechos por dos personas distintas.

## 20. 🔴 El 82% del gasto es corregir — y ahora está medido tres veces

| App | Tipo | Build | Correcciones | Total | % |
|---|---|---|---|---|---|
| Workload | dashboard, solo lectura | 46 | 191 | 237 | 81% |
| Dedication | item view, lee y escribe | 41 | 187 | 228 | 82% |
| Private Comments History | item view, solo lectura | 33 | 180 | 213 | 85% |
| | | **120** | **558** | **678** | **82%** |

No era mala suerte de un caso. **Construir cuesta el 18%.**
Y en las tres, la lógica de negocio salió bien de entrada: lo que se pagó fue envoltura.

## 21. 🔴 LA PALANCA MÁS GRANDE: un prompt cuesta igual arregle 1 cosa o 9

Medido en Dedication:

| Prompt | Cambios | Costó | Por cambio |
|---|---|---|---|
| "el dropdown está vacío" | 1 | 31 | **31** |
| "usá monday.api" | 1 | 31 | **31** |
| "borrá los 0% al guardar" | 1 | 30 | **30** |
| 6 arreglos de UX juntos | 6 | 53 | **8,8** |
| 9 mejoras juntas | 9 | 42 | **4,7** |

En Private Comments History mandamos **8 correcciones sueltas = 180 créditos**.
Agrupadas habrían costado ~90. **Media app se pagó por mandar de a uno.**

**Parche:** regla 7 en `/exportar` — anotá los problemas y mandá UNA tanda numerada.
Lo visual se agrupa tranquilo; la lógica va aparte para poder revertirla sola.

## 22. "CERO PROSA SOBRE APIs" confirmado en un caso independiente

Workload pegó la consulta GraphQL entera, perfecta… **pero nunca la respuesta**. Vibe asumió que
`column_values(ids:["una"])` devuelve un objeto. Devuelve un **array, siempre**. App vacía, 14 créditos.

Es el mismo error que el `.data` del contexto, en otra app y otra persona.
👉 **Pegar la consulta no alcanza: hay que pegar una respuesta real de esa consulta.**

## 23. Lo que decís en un prompt NO se hereda al siguiente

Workload tenía al pie una sección **"COMMON PITFALLS"** con `window.mondaySdk.api()` como trampa nº1.
**Esa app no cometió el error.** Dedication se escribió sin esa sección → lo cometió: 31 créditos,
más otros 31 antes persiguiendo el síntoma equivocado ("el dropdown está vacío", cuando en realidad
no cargaba nada).

**Parche:** el bloque de trampas se vuelve a pegar en CADA prompt de CADA app. Es texto, es gratis.

## 24. "Diagnosticar, no razonar" confirmado — 31 créditos en una hipótesis equivocada

El síntoma era "el dropdown de personas está vacío". Se mandó un prompt para poblar el dropdown:
31 créditos, no lo arregló. La causa real era que **ninguna** llamada funcionaba
(`window.mondaySdk` undefined). Un build de diagnóstico cuesta ~25 y lo mostraba de una.

## 25. La paginación en prosa se ignora

El prompt de Workload decía textual *"items_page returns at most 500; keep fetching until cursor is
null"*. Vibe escribió `limit:500` sin bucle igual. Hubo que corregirlo después.
Tercera aparición del mismo bug (en otra app un `limit:200` dejó 9 de 209 entradas invisibles).

**Parche:** la paginación no se pide, **se pega la función entera**; y se busca cada `limit:` a mano
antes de entregar.

## 26. Gotchas de la API que faltaban en el kit

- `column_values` devuelve **array** aunque pidas una sola columna.
- En una conexión de doble vía solo se escribe **el lado primario**; escribir el espejo
  **no da error, no hace nada**.
- La conexión **no se puede setear dentro de `create_item`** de forma confiable: creá y después conectá.
- Las columnas **mirror/lookup** son de solo lectura y su `text` no es confiable — leé el ítem original.

## 27. El layout en grillas se arregla estructuralmente, no con retoques

Workload gastó ~156 créditos en densidad y alineación del Gantt. Las barras no coincidían con las
columnas porque **el header y las filas usaban anchos distintos**. Los retoques de ancho no lo
arreglaron; lo arregló pasar header y filas a **una sola grilla CSS compartida**.

**A revisar:**
- [ ] ¿Debería `/exportar` exigir que toda tabla/timeline se pida con `grid-template-columns`
      compartido entre header y filas, desde el primer prompt?
