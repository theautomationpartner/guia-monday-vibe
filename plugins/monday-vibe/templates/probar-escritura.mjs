// probar-escritura.mjs — prueba el GUARDADO real contra la cuenta del cliente.
//
// Correlo con:  npm run probar-escritura      (con el servidor de dev levantado)
//
// ⚠️ ADAPTALO A TU APP: los ids de tablero, la columna de vínculo y los casos de prueba.
// Lo que SÍ conviene copiar tal cual es la estructura:
//     armar el escenario  →  probar  →  limpiar en un `finally`  →  verificar que no quedó nada
//
// ⚠️ ESTO ESCRIBE EN MONDAY DE VERDAD. Solo sobre cosas que crea él mismo:
//    · una persona  "TEST TAP - BORRAR"  en Team Capacity
//    · un proyecto  "TEST TAP - BORRAR"  en Portfolio External
//    · las filas de Assignments que genere la app para ese proyecto
//
// La limpieza va en un `finally` y borra en el orden correcto (primero las filas, después el
// proyecto, después la persona). Si se borra el proyecto antes que sus filas, monday corta los
// vínculos y las filas quedan huérfanas: existen pero nadie sabe a qué pertenecían.
//
// Ningún proyecto ni persona real se toca en ningún momento.

import { readFileSync } from "node:fs";
import { createServer } from "vite";

const MARCA = "TEST - BORRAR"; // que sea IMPOSIBLE de confundir con un dato real
const BOARD_PERSONAS = 0; // ⚠️ COMPLETAR
const BOARD_PORTFOLIO = 0; // ⚠️ COMPLETAR
const BOARD_ASIGNACIONES = 0; // ⚠️ COMPLETAR
const COL_TIMELINE = ""; // ⚠️ COMPLETAR

const COL_VINCULO = ""; // ⚠️ COMPLETAR: la columna que vincula la fila con el ítem de prueba

globalThis.__PROXY_BASE__ = process.env.PROXY_BASE || "http://localhost:5173";

const TOKEN = /^\s*MONDAY_TOKEN\s*=\s*(.*)$/m.exec(readFileSync(".env.local", "utf8"))[1].trim();

/** API directa: SOLO para armar y desarmar el escenario de prueba. La app no usa esto. */
async function apiDirecta(query) {
  const r = await fetch("https://api.monday.com/v2", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: TOKEN, "API-Version": "2024-10" },
    body: JSON.stringify({ query }),
  });
  const j = await r.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors).slice(0, 300));
  return j.data;
}

let fallos = 0;
const dice = (etiqueta, real, esperado) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? "✅" : "❌"} ${etiqueta}`);
  if (!ok) console.log(`     esperaba ${JSON.stringify(esperado)} · vino ${JSON.stringify(real)}`);
};

const hoy = new Date().toISOString().slice(0, 10);
const enDias = (n) => new Date(Date.now() + n * 86400000).toISOString().slice(0, 10);

let personaId = null;
let proyectoId = null;
const servidor = await createServer({ root: process.cwd(), server: { middlewareMode: true }, appType: "custom", logLevel: "error" });

try {
  const s = await servidor.ssrLoadModule("/src/services/asignaciones.js");
  if (s.SOLO_LECTURA) throw new Error("La app está en modo solo lectura (VITE_SOLO_LECTURA=1)");

  // ---------- ARMAR EL ESCENARIO ----------
  console.log("— armando el escenario de prueba —");
  const p = await apiDirecta(`mutation { create_item(board_id:${BOARD_PERSONAS}, item_name:${JSON.stringify(MARCA)}) { id } }`);
  personaId = String(p.create_item.id);
  console.log(`   persona de prueba creada: ${personaId}`);

  const cv = JSON.stringify(JSON.stringify({ [COL_TIMELINE]: { from: hoy, to: enDias(10) } }));
  const pr = await apiDirecta(`mutation { create_item(board_id:${BOARD_PORTFOLIO}, item_name:${JSON.stringify(MARCA)}, column_values:${cv}) { id } }`);
  proyectoId = String(pr.create_item.id);
  console.log(`   proyecto de prueba creado: ${proyectoId}\n`);

  // ---------- PROBAR LA APP ----------
  console.log("— probando el guardado real, por el mismo camino que usa la app —");

  const leer = async () => {
    const d = await s.cargarTodo(proyectoId);
    const propias = d.asignaciones
      .filter((a) => !a.esHeredada && String(a.proyectoId) === proyectoId && a.personaId && a.pct > 0)
      .map((a) => ({ id: a.id, personaId: a.personaId, pct: a.pct }));
    return { d, propias };
  };

  let { d, propias } = await leer();
  dice("el proyecto de prueba se lee bien", d.proyectoAbierto?.nombre, MARCA);
  dice("le lee el rango de fechas que le pusimos", d.proyectoAbierto?.rango?.from, hoy);
  dice("arranca sin nadie asignado", propias.length, 0);
  dice("la persona de prueba aparece en la lista", Boolean(d.personas.find((x) => x.id === personaId)), true);

  // CREAR
  await s.guardar({
    proyectoAbiertoId: proyectoId,
    nombreProyecto: MARCA,
    filas: [{ id: "nueva-1", personaId, pct: 40 }],
    filasOriginales: [],
    personas: d.personas,
  });
  ({ d, propias } = await leer());
  dice("después de guardar hay 1 asignación", propias.length, 1);
  dice("con el 40% que le pusimos", propias[0]?.pct, 40);
  dice("y apuntando a la persona correcta", propias[0]?.personaId, personaId);

  // ACTUALIZAR
  await s.guardar({
    proyectoAbiertoId: proyectoId,
    nombreProyecto: MARCA,
    filas: [{ ...propias[0], pct: 75 }],
    filasOriginales: propias,
    personas: d.personas,
  });
  ({ d, propias } = await leer());
  dice("sigue habiendo 1 sola fila (actualizó, no duplicó)", propias.length, 1);
  dice("ahora está al 75%", propias[0]?.pct, 75);

  // BORRAR poniéndolo en 0%
  await s.guardar({
    proyectoAbiertoId: proyectoId,
    nombreProyecto: MARCA,
    filas: [{ ...propias[0], pct: 0 }],
    filasOriginales: propias,
    personas: d.personas,
  });
  ({ propias } = await leer());
  dice("poner 0% borra la asignación", propias.length, 0);

  console.log(fallos === 0 ? "\n✅ El guardado anda bien contra la cuenta real." : `\n❌ ${fallos} chequeo(s) fallaron.`);
} catch (e) {
  fallos++;
  console.error("\n❌ Explotó:\n   " + (e?.message || e));
  console.error((e?.stack || "").split("\n").slice(1, 5).join("\n"));
} finally {
  // ---------- LIMPIEZA: pase lo que pase ----------
  console.log("\n— limpiando —");
  try {
    if (proyectoId) {
      // 1º las filas de Assignments. Si se borra el proyecto primero, monday corta los vínculos
      // y estas filas quedan huérfanas para siempre.
      const d = await apiDirecta(`query { boards(ids:[${BOARD_ASIGNACIONES}]) { items_page(limit:500) { items { id name
        pr: column_values(ids:[COL_VINCULO]) { ... on BoardRelationValue { linked_item_ids } } } } } }`);
      const aBorrar = d.boards[0].items_page.items.filter((i) =>
        (i.pr?.[0]?.linked_item_ids || []).map(String).includes(String(proyectoId))
      );
      for (const i of aBorrar) {
        await apiDirecta(`mutation { delete_item(item_id:${i.id}) { id } }`);
        console.log(`   fila de Assignments borrada: ${i.id}`);
      }
      await apiDirecta(`mutation { delete_item(item_id:${proyectoId}) { id } }`);
      console.log(`   proyecto de prueba borrado: ${proyectoId}`);
    }
    if (personaId) {
      await apiDirecta(`mutation { delete_item(item_id:${personaId}) { id } }`);
      console.log(`   persona de prueba borrada: ${personaId}`);
    }

    // Verificación final: que no haya quedado NADA con la marca de prueba.
    const q = async (b) => (await apiDirecta(`query { boards(ids:[${b}]) { items_page(limit:500) { items { id name } } } }`))
      .boards[0].items_page.items.filter((i) => i.name.includes(MARCA));
    const restos = [...(await q(BOARD_PERSONAS)), ...(await q(BOARD_PORTFOLIO)), ...(await q(BOARD_ASIGNACIONES))];
    if (restos.length) {
      console.log(`\n🔴 QUEDÓ BASURA, hay que borrarla a mano:`);
      for (const r of restos) console.log(`   ${r.id}  ${r.name}`);
      process.exitCode = 1;
    } else {
      console.log("   ✅ no quedó nada de la prueba en la cuenta");
    }
  } catch (e) {
    console.error("🔴 LA LIMPIEZA FALLÓ — revisar a mano: " + (e?.message || e));
    console.error(`   buscar ítems llamados "${MARCA}" en Team Capacity, Portfolio External y Assignments`);
    process.exitCode = 1;
  }
  await servidor.close();
  if (fallos) process.exitCode = 1;
}
