// src/lib/monday.js
// Wrapper ÚNICO de acceso a monday. 3 modos, decididos en runtime:
//  1) MOCK        → dev rápido sin red (VITE_MONDAY_MOCK=1)
//  2) PROXY       → fuera de monday (local real / Vercel): pega a /api/monday
//                   (función serverless que tiene el token; el token NUNCA llega al browser)
//  3) NATIVO      → dentro de monday/vibe: monday.api() con la sesión (sin token estático)
// Regla del CLAUDE.md: NUNCA llamar a monday-sdk-js ni fetch directo desde componentes; pasar por acá.

import mondaySdk from "monday-sdk-js";

const monday = mondaySdk();

const IS_MOCK = import.meta.env?.VITE_MONDAY_MOCK === "1";

// Dentro de monday, la app corre embebida en un iframe (self !== top).
// Fuera (Vercel standalone / local), corre como top → usamos el proxy serverless.
const INSIDE_MONDAY =
  typeof window !== "undefined" && window.self !== window.top;

// ---- Datos de ejemplo para el mock (editá según tu app) ----
const MOCK_CONTEXT = { boardId: 123456789, user: { id: 1, name: "Demo" }, theme: "light" };
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

export { IS_MOCK, INSIDE_MONDAY };
export default { getContext, api, IS_MOCK, INSIDE_MONDAY };
