// verificar-css.mjs — caza variables CSS que NO existen.
//
// Correlo con:  npm run verificar-css   (después de `npm run build`)
//
// Por qué existe: si una variable CSS no está definida, el navegador **descarta la declaración
// entera** y no avisa. `padding: var(--spacing-small)` con esa variable inexistente no es
// "padding cero por error": es que no hay padding, en silencio. La app se ve apretada, fea o
// vieja, y no hay nada en la consola.
//
// Pasó dos veces en el mismo proyecto:
//   · vibe generó CSS apuntando a tokens de monday que en su propio proyecto no existían
//     → las tarjetas quedaron sin fondo ni borde
//   · nosotros usamos --spacing-small / -medium / -large / -xs asumiendo que Vibe los traía
//     → NO los trae. 19 declaraciones descartadas.

import { readFileSync, readdirSync, existsSync } from "node:fs";

const FUENTES = ["src/App.css"];
const DIST = "dist/assets";

if (!existsSync(DIST)) {
  console.error("❌ No hay build. Corré `npm run build` primero.");
  process.exit(1);
}

const propio = FUENTES.filter(existsSync).map((f) => readFileSync(f, "utf8")).join("\n");
const compilado = readdirSync(DIST)
  .filter((f) => f.endsWith(".css"))
  .map((f) => readFileSync(`${DIST}/${f}`, "utf8"))
  .join("\n");

const usadas = [...new Set([...propio.matchAll(/var\((--[a-zA-Z0-9-]+)/g)].map((m) => m[1]))];

const rotas = [];
const bien = [];
for (const v of usadas) {
  const definida = compilado.includes(`${v}:`) || compilado.includes(`${v} :`);
  (definida ? bien : rotas).push(v);
}

console.log(`variables CSS usadas: ${usadas.length}\n`);
if (bien.length) {
  console.log(`✅ definidas (${bien.length})`);
}
if (rotas.length) {
  console.log(`\n❌ NO EXISTEN (${rotas.length}) — cada uso descarta la declaración entera:`);
  for (const v of rotas) {
    const usos = (propio.match(new RegExp(v.replace(/-/g, "\\-"), "g")) || []).length;
    console.log(`   ${v}   ·  ${usos} uso(s)`);
  }
  console.log("\n💡 O las definís vos en un :root, o usás una que exista.");
  console.log("   Vibe NO trae escala de espaciado: --spacing-* hay que definirlos a mano.");
  process.exitCode = 1;
} else {
  console.log("\n✅ Todas las variables CSS que usás existen de verdad.");
}
