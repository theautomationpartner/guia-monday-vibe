// src/App.jsx — punto de arranque de la app.
// Reemplazá este contenido por tus pantallas reales, pero mantené:
//   - los componentes de @vibe/core para la UI (no otras librerías)
//   - el acceso a monday SIEMPRE por src/lib/monday.js (nunca fetch directo)
//
// NOTA sobre la API de @vibe/core: los nombres exactos de props/componentes pueden variar
// entre versiones. Antes de usar un componente, verificá su API real (el MCP opcional
// @vibe/mcp la da exacta, o la doc en vibe.monday.com). Este arranque usa a propósito
// solo lo mínimo para no depender de props que puedan cambiar.

import { useEffect, useState } from "react";
import { Button } from "@vibe/core";
import mondayLib from "./lib/monday";

export default function App() {
  const [context, setContext] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    mondayLib
      .getContext()
      .then(setContext)
      .catch((e) => setError(String(e)));
  }, []);

  if (error) {
    return <div style={{ padding: 24 }}>Error: {error}</div>;
  }

  if (!context) {
    return <div style={{ padding: 24 }}>Cargando…</div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <h1>APP_NAME</h1>
      <p>
        Conectado{mondayLib.IS_MOCK ? " (modo mock)" : ""}. Tema: {String(context.theme ?? "—")}
      </p>
      <Button onClick={() => console.log("context:", context)}>Probar Vibe</Button>
    </div>
  );
}
