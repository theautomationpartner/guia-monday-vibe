// probar-proxy.mjs — comprueba que el proxy deja pasar SOLO lo que la app necesita.
//
// Correlo con:  npm run probar-proxy
//
// El proxy de Vercel lleva el token del cliente: si tiene un agujero, cualquiera con la URL
// puede leer (o borrar) datos de la cuenta. Estos casos son la red de contencion.
//
// ⚠️ ADAPTALO A TU APP antes de usarlo: reemplaza BOARD_ESCRIBIBLE / BOARD_LECTURA /
// ITEM_DE_EJEMPLO por los ids reales, y sacá los casos de escritura si tu app es de solo
// lectura. Un test que no corresponde a tu app da una falsa sensacion de seguridad.
//
// Caso real que este test cazo: al hacer condicional el filtro de tableros para dejar pasar
// `items(ids:)`, se ato la condicion al texto `boards(` — y `{ boards { id name } }`, SIN
// parentesis, se salteaba el filtro entero y listaba todos los tableros de la cuenta.
// No necesita token ni internet: los filtros corren ANTES de leerlo.

// 🔴 Se borra el token ANTES de cargar el handler.
// Si el sistema tiene un MONDAY_TOKEN seteado (pasa más de lo que parece), una consulta que se
// escape del filtro llegaría a monday DE VERDAD, con la cuenta que tenga ese token. Un test de
// seguridad no puede tocar la cuenta de nadie. Sin token, lo que pasa el filtro muere en 500.
process.env.MONDAY_TOKEN = "";

const { default: handler } = await import("./api/monday.js");

const pedir = async (query, variables) => {
  let estado = 0;
  let cuerpo = null;
  const res = {
    status(c) { estado = c; return this; },
    json(o) { cuerpo = o; return this; },
    setHeader() { return this; },
    end() { return this; },
  };
  await handler({ method: "POST", body: { query, variables }, headers: {} }, res);
  return { estado, cuerpo };
};

let fallos = 0;

// "pasa" = el filtro lo dejó seguir. Sin token cargado termina en 500 (falta MONDAY_TOKEN),
// que es justamente la señal de que superó los filtros.
async function deberiaPasar(etiqueta, query, variables) {
  const { estado, cuerpo } = await pedir(query, variables);
  const ok = estado !== 403;
  if (!ok) fallos++;
  console.log(`${ok ? "✅" : "❌"} DEJA PASAR · ${etiqueta}`);
  if (!ok) console.log(`     lo rechazó: ${cuerpo?.error}`);
}

async function deberiaRechazar(etiqueta, query, variables) {
  const { estado, cuerpo } = await pedir(query, variables);
  const ok = estado === 403;
  if (!ok) fallos++;
  console.log(`${ok ? "✅" : "❌"} BLOQUEA    · ${etiqueta}`);
  if (!ok) console.log(`     ⚠️ NO lo bloqueó (estado ${estado}) ${JSON.stringify(cuerpo)?.slice(0, 90)}`);
}

console.log("— lo que la app SÍ hace —");
await deberiaPasar("leer las asignaciones", `query { boards(ids:[BOARD_ESCRIBIBLE]) { items_page(limit:100) { cursor items { id } } } }`);
await deberiaPasar("leer las personas", `query { boards(ids:[BOARD_LECTURA]) { items_page(limit:100) { cursor items { id name } } } }`);
await deberiaPasar("seguir la paginación", `query { next_items_page(limit:100, cursor:"abc") { cursor items { id } } }`);
await deberiaPasar("resolver proyectos por id", `query { items(ids:[ITEM_DE_EJEMPLO], limit:100) { id name } }`);
await deberiaPasar("crear una asignación", `mutation { create_item(board_id: BOARD_ESCRIBIBLE, item_name: "X") { id } }`);
await deberiaPasar("actualizar una asignación", `mutation { change_multiple_column_values(board_id: BOARD_ESCRIBIBLE, item_id: 123456789, column_values: "{}") { id } }`);

console.log("\n— lo que NO tiene que poder hacer nadie con esta URL —");
await deberiaRechazar("leer un tablero ajeno", `query { boards(ids:[1111111111]) { items_page(limit:1) { items { id } } } }`);
await deberiaRechazar("listar TODOS los tableros", `query { boards { id name } }`);
await deberiaRechazar("listar la gente de la empresa", `query { users { id email } }`);
await deberiaRechazar("preguntar de quién es el token", `query { me { email account { name } } }`);
await deberiaRechazar("leer los docs de la cuenta", `query { docs { id name } }`);
await deberiaRechazar("colar un tablero ajeno junto a uno propio", `query { boards(ids:[BOARD_ESCRIBIBLE, 1111111111]) { id } }`);
await deberiaRechazar("meter el tablero ajeno por variable", `query($b: [ID!]) { boards(ids: $b) { id } }`, { b: ["1111111111"] });
await deberiaRechazar("ESCRIBIR en el Portfolio del cliente", `mutation { create_item(board_id: 5097507296, item_name: "X") { id } }`);
await deberiaRechazar("borrar un tablero entero", `mutation { delete_board(board_id: BOARD_ESCRIBIBLE) { id } }`);
await deberiaRechazar("archivar un tablero", `mutation { archive_board(board_id: BOARD_ESCRIBIBLE) { id } }`);
await deberiaRechazar("usar una mutation no permitida", `mutation { change_column_value(board_id: BOARD_ESCRIBIBLE, item_id: 1, column_id: "x", value: "1") { id } }`);
await deberiaRechazar("crear un tablero nuevo", `mutation { create_board(board_name: "X", board_kind: public) { id } }`);
await deberiaRechazar("borrar sin decir qué ítem", `mutation { delete_item { id } }`);

console.log(fallos === 0 ? "\n✅ El proxy solo deja pasar lo de la app." : `\n❌ ${fallos} caso(s) mal. NO publicar así.`);
process.exitCode = fallos === 0 ? 0 : 1;
