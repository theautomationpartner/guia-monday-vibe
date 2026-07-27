// src/App.jsx — punto de arranque de la app.
// Reemplazá este contenido por tus pantallas reales, pero mantené:
//   - los componentes de @vibe/core (no otras librerías de UI)
//   - el acceso a monday SIEMPRE por src/lib/monday.js (nunca fetch directo)

import { useEffect, useState } from "react";
import { Box, Flex, Heading, Text, Loader } from "@vibe/core";
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
    return (
      <Box padding={Box.paddings.LARGE}>
        <Text color={Text.colors.NEGATIVE}>Error: {error}</Text>
      </Box>
    );
  }

  if (!context) {
    return (
      <Flex justify={Flex.justify.CENTER} style={{ padding: 48 }}>
        <Loader size={Loader.sizes.MEDIUM} />
      </Flex>
    );
  }

  return (
    <Box padding={Box.paddings.LARGE}>
      <Heading type={Heading.types.H1}>APP_NAME</Heading>
      <Text>
        Conectado. Board actual: {String(context.boardId ?? "—")}
        {mondayLib.IS_MOCK ? " (modo mock)" : ""}
      </Text>
    </Box>
  );
}
