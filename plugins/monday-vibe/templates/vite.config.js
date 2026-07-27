import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Config mínima para una app de monday.
// En Vercel, la carpeta `api/` se despliega como funciones serverless automáticamente
// (no hace falta configurarla acá). En dev local, si necesitás el proxy real,
// usá `vercel dev` en vez de `npm run dev`.
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
});
