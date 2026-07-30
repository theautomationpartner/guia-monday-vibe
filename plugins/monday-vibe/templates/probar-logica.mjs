// probar-logica.mjs — chequeo de las CUENTAS de tu app, sin navegador ni token.
//
// Correlo con:  npm run probar
//
// Por qué existe, si ya están `build` y `verificar`:
//   · `build`     dice que COMPILA
//   · `verificar` dice que DIBUJA
//   · esto dice que los NÚMEROS ESTÁN BIEN, que es lo único que el cliente nota.
//     Si alguien figura al 80% cuando está al 110%, la app "anda" y está mal.
//
// ⚠️ ADAPTALO: los casos de abajo son de una app de asignaciones y están de EJEMPLO.
// Borralos y escribí los de tu lógica. La estructura que conviene conservar:
//   1. cargar los datos de mentira y comprobar que se parsearon bien
//   2. una cuenta simple de cada regla de negocio
//   3. LOS CASOS BORDE que ya te mordieron (doble conteo, listas vacías, sin fechas)
//   4. los umbrales, uno por uno y por sus dos lados (84/85, 100/101)
//
// Usa los datos de mentira de src/lib/monday.js, que a propósito tienen la FORMA EXACTA de lo
// que devuelve monday (arrays en column_values, timeline como JSON en `value`, cursor). Así el
// código que maneja esas trampas queda probado en local, y no las descubrís contra el cliente.

// Este test comprueba las CUENTAS, así que necesita datos de mentira aunque el proyecto esté
// apuntando a la cuenta real. Se fuerza acá para que no dependa de cómo esté el .env.local.
globalThis.__FORZAR_MOCK__ = true;

import { createServer } from "vite";

const server = await createServer({
  root: process.cwd(),
  server: { middlewareMode: true },
  appType: "custom",
  logLevel: "error",
});

let fallos = 0;
const dice = (etiqueta, real, esperado) => {
  const ok = JSON.stringify(real) === JSON.stringify(esperado);
  if (!ok) fallos++;
  console.log(`${ok ? "✅" : "❌"} ${etiqueta}`);
  if (!ok) console.log(`     esperaba ${JSON.stringify(esperado)} · vino ${JSON.stringify(real)}`);
};

try {
  const s = await server.ssrLoadModule("/src/services/asignaciones.js");
  const PROYECTO_ABIERTO = "900000001";

  const datos = await s.cargarTodo(PROYECTO_ABIERTO);
  dice("hay acceso a los boards", datos.hayAcceso, true);
  dice("trae las 6 personas", datos.personas.length, 6);
  dice("trae las 10 asignaciones (8 nuevas + 2 heredadas)", datos.asignaciones.length, 10);
  dice("reconoce el proyecto abierto", datos.proyectoAbierto?.nombre, "Sample Project — Line Upgrade");
  dice("le lee el rango de fechas", Boolean(datos.proyectoAbierto?.rango), true);

  // Las heredadas son las que cuelgan de una tarea y no de un proyecto.
  dice("marca 2 asignaciones como heredadas", datos.asignaciones.filter((a) => a.esHeredada).length, 2);

  // --- La cuenta principal ---
  const filasEnPantalla = datos.asignaciones
    .filter((a) => !a.esHeredada && String(a.proyectoId) === PROYECTO_ABIERTO)
    .map((a) => ({ id: a.id, personaId: a.personaId, pct: a.pct }));

  const carga = s.calcularCarga({
    asignaciones: datos.asignaciones,
    filasEnPantalla,
    proyectoAbiertoId: PROYECTO_ABIERTO,
    proyectos: datos.proyectos,
  });

  // Ana: 50 en el proyecto abierto + 60 en otro = 110
  dice("Ana suma 110% (50 + 60)", carga["701"]?.total, 110);
  dice("Ana queda sobrecargada", s.estadoDeCarga(carga["701"].total), "overloaded");
  // Carla: 100 + 20 = 120
  dice("Carla suma 120% (100 + 20)", carga["703"]?.total, 120);
  // Diego: 90 solo → en riesgo, no sobrecargado
  dice("Diego queda en riesgo con 90%", s.estadoDeCarga(carga["704"].total), "atRisk");
  // Bruno: 30 del proyecto abierto; sus 15 heredados NO se suman
  dice("Bruno suma 30% y no cuenta lo heredado", carga["702"]?.total, 30);
  dice("…pero lo heredado se informa aparte", carga["702"]?.heredado, 15);
  // Elena está en un proyecto ya terminado: cuenta en el total, no en "activos hoy"
  dice("Elena suma 40% en total", carga["705"]?.total, 40);
  dice("…pero 0% en proyectos corriendo hoy", carga["705"]?.enProyectosActivos, 0);
  // Federico está en un proyecto SIN fechas cargadas
  dice("Federico suma 25% aunque su proyecto no tenga fechas", carga["706"]?.total, 25);
  dice("…y no aparece como corriendo hoy", carga["706"]?.enProyectosActivos, 0);

  // --- El recálculo en vivo: mover un slider tiene que cambiar el total al instante ---
  const conAnaEn10 = s.calcularCarga({
    asignaciones: datos.asignaciones,
    filasEnPantalla: filasEnPantalla.map((f) => (f.personaId === "701" ? { ...f, pct: 10 } : f)),
    proyectoAbiertoId: PROYECTO_ABIERTO,
    proyectos: datos.proyectos,
  });
  dice("bajar a Ana a 10% deja su total en 70% (10 + 60)", conAnaEn10["701"]?.total, 70);

  // El bug clásico: contar dos veces a la misma persona por no excluir lo ya guardado
  // del proyecto abierto. Si eso pasara, Ana daría 160 (50 guardado + 50 pantalla + 60).
  dice("no cuenta dos veces al proyecto abierto", carga["701"].total !== 160, true);

  // --- Sacar a alguien de la pantalla lo saca de la cuenta ---
  const sinCarla = s.calcularCarga({
    asignaciones: datos.asignaciones,
    filasEnPantalla: filasEnPantalla.filter((f) => f.personaId !== "703"),
    proyectoAbiertoId: PROYECTO_ABIERTO,
    proyectos: datos.proyectos,
  });
  dice("sacar a Carla la deja en 20% (solo su otro proyecto)", sinCarla["703"]?.total, 20);

  // --- Umbrales ---
  dice("84% es sano", s.estadoDeCarga(84), "healthy");
  dice("85% ya es riesgo", s.estadoDeCarga(85), "atRisk");
  dice("100% sigue siendo riesgo", s.estadoDeCarga(100), "atRisk");
  dice("101% es sobrecarga", s.estadoDeCarga(101), "overloaded");

  // --- Fechas ---
  const hoy = new Date().toISOString().slice(0, 10);
  dice("un rango que incluye hoy está activo", s.estaActivoHoy({ from: hoy, to: hoy }, hoy), true);
  dice("un rango terminado ayer no está activo", s.estaActivoHoy({ from: "2020-01-01", to: "2020-01-02" }, hoy), false);
  dice("sin rango no está activo", s.estaActivoHoy(null, hoy), false);

  console.log(fallos === 0 ? "\n✅ Todas las cuentas dan bien." : `\n❌ ${fallos} chequeo(s) fallaron.`);
  process.exitCode = fallos === 0 ? 0 : 1;
} catch (e) {
  console.error("❌ Explotó al probar la lógica:\n   " + (e?.message || e));
  console.error((e?.stack || "").split("\n").slice(1, 6).join("\n"));
  process.exitCode = 1;
} finally {
  await server.close();
}
