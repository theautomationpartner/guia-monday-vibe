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

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.MONDAY_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Falta MONDAY_TOKEN en variables de entorno" });
  }

  const { query, variables } = req.body || {};
  if (!query) {
    return res.status(400).json({ error: "Falta 'query'" });
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
