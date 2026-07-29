// src/App.jsx — punto de arranque de la app.
// Reemplazá este contenido por tus pantallas reales, pero mantené:
//   - `useMondayTheme()` en la raíz (si no, la app se ve blanca en el modo oscuro de monday)
//   - los componentes de @vibe/core para la UI (no otras librerías)
//   - el acceso a monday SIEMPRE por src/lib/monday.js (nunca fetch directo)
//
// ⚠️ API de @vibe/core 4: las props son STRINGS en minúscula.
//    padding="medium"  ·  type="text2"  ·  gap="medium"  ·  direction="column"  ·  weight="bold"
//    NO existen las constantes de Vibe 2 (Box.paddings.MEDIUM, Text.types.TEXT2…): usarlas
//    compila igual pero revienta al correr y deja la PANTALLA EN BLANCO.
//    Los valores válidos de cada prop están en:
//      node_modules/@vibe/{layout,typography}/dist/**/*.types.d.ts
//    Esa es la única fuente de verdad de la versión instalada. No adivines ni tires de memoria.
//
// ⚠️ IDIOMA: los comentarios del código van en español, pero TODO texto que ve el usuario va en
//    el idioma de la app. Y las pistas para el desarrollador, detrás de `import.meta.env.DEV`,
//    para que no terminen en el build que ve el cliente.

import { useEffect, useState } from "react";
import { Box, Flex, Heading, Text, Button } from "@vibe/core";
import mondayLib, { useMondayTheme } from "./lib/monday";
import "./App.css";

export default function App() {
  const [context, setContext] = useState(null);
  const [error, setError] = useState(null);

  // La app va embebida: tiene que seguir el tema de monday (claro / oscuro / negro).
  useMondayTheme();

  useEffect(() => {
    let vivo = true;
    mondayLib
      .getContext()
      .then((c) => vivo && setContext(c))
      .catch((e) => vivo && setError(String(e?.message || e)));
    return () => {
      vivo = false;
    };
  }, []);

  // Ojo con los estados: "cargando", "vacío" y "sin acceso" NO son errores.
  // Mostrar "algo salió mal" en esos casos asusta al usuario al pedo.
  if (error) {
    return (
      <Box padding="medium">
        <Heading type="h2">Something went wrong</Heading>
        <Text type="text2" color="secondary">
          {error}
        </Text>
      </Box>
    );
  }

  if (!context) {
    return (
      <Box padding="medium">
        <Text type="text2" color="secondary">
          Loading…
        </Text>
      </Box>
    );
  }

  return (
    <Box padding="medium">
      <Flex direction="column" gap="medium" align="stretch">
        <Heading type="h2">APP_NAME</Heading>
        <Text type="text2" color="secondary">
          {mondayLib.IS_MOCK ? "Sample data" : "Connected"} · theme: {String(context.theme ?? "—")}
        </Text>
        <Flex>
          <Button onClick={() => console.log("context:", context)}>Test Vibe</Button>
        </Flex>
      </Flex>
    </Box>
  );
}
