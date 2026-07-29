// src/lib/monday.js
// Wrapper ÚNICO de acceso a monday. 3 modos, decididos en runtime:
//  1) MOCK        → dev rápido sin red (VITE_MONDAY_MOCK=1)
//  2) PROXY       → fuera de monday (local real / Vercel): pega a /api/monday
//                   (función serverless que tiene el token; el token NUNCA llega al browser)
//  3) NATIVO      → dentro de monday/vibe: monday.api() con la sesión (sin token estático)
// Regla del CLAUDE.md: NUNCA llamar a monday-sdk-js ni fetch directo desde componentes; pasar por acá.

import { useEffect } from "react";
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
/**
 * Contexto de monday: qué ítem está abierto, quién mira, qué tema usa.
 *
 * ⚠️ Fuera de monday NO existe un context real: no hay ítem abierto ni usuario logueado. Eso hace
 * imposible probar en local una item view (`ctx.itemId` viene vacío y la app "no anda"). Para
 * poder probar igual, acá se puede simular por querystring:
 *
 *   ?itemId=123456789            → como si ese ítem estuviera abierto
 *   ?theme=dark                  → para ver el tema oscuro (o `black`)
 *   ?email=otro@empresa.com      → como si mirara otra persona
 *
 * Es SOLO una ayuda de desarrollo. Dentro de monday manda siempre el context de verdad, así que
 * nadie puede usar esto para ver datos ajenos: los permisos los aplica monday del lado del
 * servidor, no la app.
 */
export async function getContext() {
  if (INSIDE_MONDAY && !IS_MOCK) return (await monday.get("context")).data;

  const params = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const simulado = {};
  for (const clave of ["itemId", "boardId", "theme", "viewMode"]) {
    const v = params?.get(clave);
    if (v) simulado[clave] = v;
  }
  const email = params?.get("email");
  return {
    ...MOCK_CONTEXT,
    ...simulado,
    user: { ...MOCK_CONTEXT.user, ...(email ? { email } : {}) },
  };
}

export async function api(query, variables = {}) {
  if (IS_MOCK) return mockApi(query);

  if (INSIDE_MONDAY) {
    // Dentro de monday/vibe: auth nativa por sesión, sin token.
    return monday.api(query, { variables });
  }

  // Fuera de monday (Vercel/local real): proxy serverless. El token vive en el server.
  // Si el proxy tiene la guardia activada (APP_PROXY_KEY en Vercel), mandamos la clave
  // en el header x-app-key (VITE_APP_PROXY_KEY, no-secreto: solo frena bots casuales).
  const headers = { "Content-Type": "application/json" };
  const proxyKey = import.meta.env?.VITE_APP_PROXY_KEY;
  if (proxyKey) headers["x-app-key"] = proxyKey;

  const res = await fetch("/api/monday", {
    method: "POST",
    headers,
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

// ---- Tema de monday ----
// 🔴 ESTO NO ES OPCIONAL. Los colores de Vibe son variables CSS definidas bajo las clases
// `.light-app-theme`, `.dark-app-theme` y `.black-app-theme`. Si la app no pone ninguna, queda
// SIEMPRE en claro — y adentro de monday en modo oscuro se ve como un bloque blanco en medio de
// la pantalla. Es un bug que no se nota programando (nadie tiene el navegador en oscuro) y que
// el cliente ve el primer día.
const CLASES_DE_TEMA = {
  light: "light-app-theme",
  dark: "dark-app-theme",
  black: "black-app-theme",
};

/** Aplica el tema al <body>. Lo llama useMondayTheme(); no hace falta usarlo a mano. */
export function aplicarTema(theme) {
  if (typeof document === "undefined") return;
  const clase = CLASES_DE_TEMA[theme] || CLASES_DE_TEMA.light;
  Object.values(CLASES_DE_TEMA).forEach((c) => document.body.classList.remove(c));
  document.body.classList.add(clase);
}

/**
 * Hook: hace que la app siga el tema de monday, y reaccione si el usuario lo cambia
 * con la app abierta.
 *
 * Usalo UNA vez, en el componente raíz:
 *   import { useMondayTheme } from "./lib/monday";
 *   function App() { useMondayTheme(); ... }
 *
 * Y en tu CSS global poné el fondo y el texto de la página con los tokens, o en modo oscuro
 * queda un marco blanco alrededor de la app:
 *   body { margin: 0; background: var(--primary-background-color); color: var(--primary-text-color); }
 */
export function useMondayTheme() {
  useEffect(() => {
    let vivo = true;
    getContext().then((ctx) => vivo && aplicarTema(ctx?.theme));
    const dejarDeEscuchar = onContextChange((ctx) => vivo && aplicarTema(ctx?.theme));
    return () => {
      vivo = false;
      if (typeof dejarDeEscuchar === "function") dejarDeEscuchar();
    };
  }, []);
}

export { IS_MOCK, INSIDE_MONDAY };
export default { getContext, api, onContextChange, aplicarTema, useMondayTheme, IS_MOCK, INSIDE_MONDAY };
