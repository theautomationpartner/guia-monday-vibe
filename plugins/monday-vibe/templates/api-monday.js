// api/monday.js — Función serverless de Vercel: PROXY a la API de monday.
// Va en la carpeta `api/` de la raíz del proyecto (Vercel la expone como /api/monday).
//
// SEGURIDAD: el token vive SOLO acá, como variable de entorno (process.env.MONDAY_TOKEN).
// Nunca en el frontend, nunca en el repo. El browser le pega a este endpoint; este endpoint
// le agrega el Authorization y habla con monday. Así el token jamás llega al cliente.
//
// Configurar el token:
//   - Local:  MONDAY_TOKEN=... en .env.local  (gitignoreado)
//   - Vercel: Project Settings → Environment Variables → MONDAY_TOKEN
//
// ═══════════════════════════════════════════════════════════════════════════════════════
// ⚠️ POR QUÉ ESTE ARCHIVO TIENE FILTROS
//
// Este endpoint queda accesible en internet. El token de monday es PERSONAL: arrastra todos
// los permisos de su dueño, incluida la ESCRITURA (monday no permite emitir tokens de solo
// lectura). Sin filtros, cualquiera que descubra la URL tiene un relay completo hacia la
// cuenta del cliente: puede leer todos sus tableros, listar usuarios, y borrar cosas.
//
// Los tres filtros de abajo lo acotan a lo que la app realmente necesita. **Configurá
// CAMPOS_RAIZ_PERMITIDOS y TABLEROS_PERMITIDOS con lo que use tu app.**
//
// Hacen falta los tres, porque cada uno tapa lo que los otros dejan pasar:
//   · sin el de escritura     → `mutation { delete_item(...) }` borra datos del cliente
//   · sin el de campos raíz   → `{ users { email } }` lista la gente de la empresa
//   · sin el de tableros      → `{ boards(ids:[OTRO]) }` lee cualquier tablero de la cuenta
//   · sin exigir `ids`        → `{ boards { name } }` lista TODOS los tableros
//
// Esto NO reemplaza a la protección de Vercel: limita el daño, no evita la lectura de los
// datos que la app sí usa. Ver docs/SEGURIDAD-TOKEN.md.
// ═══════════════════════════════════════════════════════════════════════════════════════

// Campos de primer nivel que la app usa. Casi siempre alcanza con "boards".
// Agregá otros solo si tu app los necesita de verdad (ej: "me" para saber quién mira).
const CAMPOS_RAIZ_PERMITIDOS = ["boards"];

// IDs de los tableros de la app. Los mismos de BOARDS en src/lib/monday.js.
// ⚠️ Dejarlo vacío desactiva el filtro: solo hacelo si sabés por qué.
const TABLEROS_PERMITIDOS = [
  // "1234567890",
];

/**
 * Devuelve los campos de primer nivel de una consulta GraphQL. `{ boards { ... } }` → ["boards"].
 *
 * No parsea GraphQL de verdad: saca la firma de la operación, borra el contenido de los
 * paréntesis (para que los nombres de argumentos no se confundan con campos) y recorre contando
 * llaves, juntando los identificadores que quedan a profundidad 1.
 *
 * Si la consulta no tiene forma reconocible devuelve null y se rechaza — acá la lista es blanca.
 */
function camposRaiz(query) {
  const inicio = query.indexOf("{");
  if (inicio === -1) return null;

  let cuerpo = query.slice(inicio);
  let antes; // los paréntesis pueden anidarse: repetimos hasta que no quede ninguno
  do {
    antes = cuerpo;
    cuerpo = cuerpo.replace(/\([^()]*\)/g, "");
  } while (cuerpo !== antes);

  const campos = [];
  let profundidad = 0;
  let token = "";
  for (const ch of cuerpo) {
    if (ch === "{" || ch === "}") {
      if (profundidad === 1 && token) campos.push(token);
      token = "";
      profundidad += ch === "{" ? 1 : -1;
      continue;
    }
    if (profundidad !== 1) continue;
    if (/[A-Za-z_]/.test(ch)) {
      token += ch;
    } else {
      if (token) campos.push(token);
      token = "";
    }
  }
  if (token && profundidad === 1) campos.push(token);
  return campos;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Guardia opcional: si APP_PROXY_KEY está seteada, exigirla en el header x-app-key.
  // ⚠️ Si la activás en Vercel, cargá TAMBIÉN VITE_APP_PROXY_KEY con el mismo valor, o la app
  // recibe 401 en todas las llamadas.
  const requiredKey = process.env.APP_PROXY_KEY;
  if (requiredKey && req.headers["x-app-key"] !== requiredKey) {
    return res.status(401).json({ error: "No autorizado" });
  }

  const { query, variables } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: "Falta 'query'" });
  }

  // Los filtros van ANTES de leer el token: una consulta que no está permitida se rechaza sin
  // tocar el secreto, y además así se pueden probar en local sin tener un token cargado.

  // ---- Filtro 1: solo lectura ----
  // Si tu app SÍ escribe en monday, borrá este bloque — pero entonces protegé la URL en Vercel,
  // porque estás exponiendo escritura a internet.
  if (/\bmutation\b/i.test(query)) {
    return res.status(403).json({ error: "Este proxy es de solo lectura" });
  }

  // ---- Filtro 2: solo los campos raíz que la app usa ----
  const raiz = camposRaiz(query);
  if (!raiz || !raiz.length || raiz.some((c) => !CAMPOS_RAIZ_PERMITIDOS.includes(c))) {
    return res.status(403).json({ error: "Consulta no permitida por este proxy" });
  }

  // ---- Filtro 3: solo los tableros de la app ----
  if (TABLEROS_PERMITIDOS.length) {
    // `boards` siempre tiene que venir con `ids`: si no, lista todos los de la cuenta y se cuela
    // por el filtro de abajo, que no tendría ningún número que mirar.
    const argsDeBoards = [...query.matchAll(/\bboards\s*\(([^)]*)\)/g)].map((m) => m[1]);
    if (!argsDeBoards.length || argsDeBoards.some((a) => !/\bids\b/.test(a))) {
      return res.status(403).json({ error: "Hay que indicar qué tablero se consulta" });
    }

    // Se validan SOLO los IDs de adentro de `boards(...)`, no cualquier número de la consulta:
    // si validáramos todos, romperíamos cualquier query que lleve el ID de un ítem.
    const pedidos = argsDeBoards.flatMap((args) => {
      const literales = args.match(/\d{6,}/g) || [];
      const porVariable = (args.match(/\$(\w+)/g) || [])
        .map((v) => variables?.[v.slice(1)])
        .flatMap((v) => (Array.isArray(v) ? v : [v]))
        .filter((v) => v != null)
        .map(String);
      return [...literales, ...porVariable];
    });

    if (!pedidos.length || pedidos.some((id) => !TABLEROS_PERMITIDOS.includes(id))) {
      return res.status(403).json({ error: "Este proxy solo consulta los tableros de esta app" });
    }
  }

  const token = process.env.MONDAY_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Falta MONDAY_TOKEN en variables de entorno" });
  }

  try {
    const r = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: token,
        "API-Version": "2024-10",
      },
      body: JSON.stringify({ query, variables: variables || {} }),
    });
    const data = await r.json();
    return res.status(200).json(data);
  } catch (e) {
    return res.status(502).json({ error: "Error llamando a la API de monday", detail: String(e) });
  }
}
