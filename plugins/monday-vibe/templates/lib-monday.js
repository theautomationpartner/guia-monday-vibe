// src/lib/monday.js
// Wrapper ÚNICO de acceso a monday. 3 modos, decididos en runtime:
//  1) MOCK        → dev rápido sin red (VITE_MONDAY_MOCK=1)
//  2) PROXY       → fuera de monday (local real / Vercel): pega a /api/monday
//                   (función serverless que tiene el token; el token NUNCA llega al browser)
//  3) NATIVO      → dentro de monday/vibe: monday.api() con la sesión (sin token estático)
// Regla del CLAUDE.md: NUNCA llamar a monday-sdk-js ni fetch directo desde componentes; pasar por acá.

import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

// ---- IDs REALES de los boards del cliente (completar en /iniciar) ----
// ⚠️ REGLA: para las queries usá SIEMPRE estos IDs, NUNCA context.boardId.
// Fuera de monday (Vercel/local) el context es un mock con un boardId falso:
// si consultás con ese, la query va a un board inexistente y la app "parece rota".
// context solo sirve DENTRO de monday (tema, viewMode, itemId en item views).
export const BOARDS = {
  // ejemplo: clientes: "1234567890",
};

const IS_MOCK = import.meta.env?.VITE_MONDAY_MOCK === "1";

// Dentro de monday, la app corre embebida en un iframe (self !== top).
// Fuera (Vercel standalone / local), corre como top → usamos el proxy serverless.
const INSIDE_MONDAY =
  typeof window !== "undefined" && window.self !== window.top;

// ---- Datos de ejemplo para el mock (editá según tu app) ----
// Incluye theme y viewMode porque la app corre EMBEBIDA en monday y su tamaño/tema cambian.
// theme: "light" | "dark" | "black".
// viewMode: board view → "fullscreen" | "split" | "mobile"; widget → "widget" | "fullscreen".
const MOCK_CONTEXT = {
  boardId: 1234567890,
  user: { id: 1, name: "Demo" },
  theme: "light",
  viewMode: "fullscreen",
  instanceType: "board_view",
};
const MOCK_ITEMS = [{ id: "1", name: "Ítem demo A" }, { id: "2", name: "Ítem demo B" }];

function mockApi(query) {
  if (query.includes("items")) return { data: { boards: [{ items_page: { items: MOCK_ITEMS } }] } };
  return { data: {} };
}

// ---- API pública ----
export async function getContext() {
  if (IS_MOCK || !INSIDE_MONDAY) return MOCK_CONTEXT; // fuera de monday no hay context real
  return (await monday.get("context")).data;
}

export async function api(query, variables = {}) {
  if (IS_MOCK) return mockApi(query);

  if (INSIDE_MONDAY) {
    // Dentro de monday/vibe: auth nativa por sesión, sin token.
    return monday.api(query, { variables });
  }

  // Fuera de monday (Vercel/local real): proxy serverless. El token vive en el server.
  const res = await fetch("/api/monday", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Proxy monday respondió ${res.status}`);
  return res.json();
}

// Escuchar cambios de contexto: el usuario cambia el tema (light/dark/black),
// redimensiona el widget o cambia de ítem. Usalo si la UI depende del tema o del viewMode.
export function onContextChange(cb) {
  if (IS_MOCK || !INSIDE_MONDAY) return () => {};
  return monday.listen("context", (res) => cb(res.data));
}

export { IS_MOCK, INSIDE_MONDAY };
export default { getContext, api, onContextChange, IS_MOCK, INSIDE_MONDAY };
