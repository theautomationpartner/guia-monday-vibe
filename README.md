# Guía monday vibe

Plugin de Claude Code para crear apps de **monday.com** sin quemar créditos de IA.

Desarrollás la app **local** con Claude Code → la desplegás en **Vercel** para que el cliente la
pruebe → y recién al final la pasás a **monday vibe** con un prompt preparado.

> **¿Por qué?** Iterar dentro de monday vibe cuesta créditos. Casos reales del equipo: una app hecha
> "a lo loco" quemó **~800 créditos y quedó rota**; otra más compleja, con este método, costó **~420
> y quedó andando**. La diferencia es el método, no la suerte.

---

## Instalación (una sola vez)

En Claude Code, pegá estos dos comandos:

```
/plugin marketplace add theautomationpartner/guia-monday-vibe
/plugin install monday-vibe@guia-monday-vibe
```

Si te pide recargar, corré `/reload-plugins`. Listo, ya lo tenés para siempre.

> El repo es privado: necesitás acceso y estar logueado con GitHub.

---

## Cómo se usa (el flujo completo)

```
/monday-vibe:iniciar     →  crea el proyecto ya configurado
   (desarrollás con Claude, que ya conoce las reglas)
/monday-vibe:publicar    →  GitHub + Vercel, el cliente la prueba
/monday-vibe:exportar    →  te da lo que pegás en monday vibe
```

### Los comandos

| Comando | Para qué | Cuándo |
|---|---|---|
| `/monday-vibe:iniciar` | Crea el proyecto configurado (stack, reglas, proxy, .env) | Al empezar una app nueva |
| `/monday-vibe:planear` | Diseña la app antes de codear | Apps medianas o complejas |
| `/monday-vibe:revisar` | Revisa entorno, seguridad del token y stack | Si algo no anda, o antes de publicar |
| `/monday-vibe:publicar` | Sube a GitHub y despliega en Vercel | Cuando la app está lista para que el cliente la vea |
| `/monday-vibe:exportar` | Genera los prompts para monday vibe | Cuando el cliente ya dio el OK |
| `/monday-vibe:adaptar` | Convierte una app hecha con otro stack | Si la app ya existía "a su manera" |

**Los 3 que vas a usar siempre:** `iniciar` → `publicar` → `exportar`. El resto es para casos puntuales.

---

## Antes de tu primera app

Leé **[REQUISITOS](plugins/monday-vibe/docs/REQUISITOS.md)** — qué necesitás tener listo (Node, git,
cuentas) y **cómo sacar los board/column IDs reales**, que es lo que más ahorra créditos.

Otros documentos útiles:
- **[SEGURIDAD DEL TOKEN](plugins/monday-vibe/docs/SEGURIDAD-TOKEN.md)** — dónde vive el token y dónde nunca.
- **[MODELOS DE IA](plugins/monday-vibe/docs/MODELOS.md)** — los 2 mundos (Claude Code vs monday vibe) y cuál elegir.

---

## Las 5 reglas que ahorran créditos

1. 💸 **Modelo barato en vibe.** Gemini Flash para UI y ajustes; Opus casi nunca (cuesta hasta 25× más).
2. 🧪 **Probá en local y en Vercel, no en vibe.** Cada prueba dentro de vibe cuesta un build.
3. 📊 **IDs de boards y columnas reales**, nunca inventados.
4. 🔒 **El token nunca en el repo** ni con prefijo `VITE_`.
5. 🎨 **Stack Vibe** (`@vibe/core`), no Next.js ni shadcn ni Tailwind.

---

## Actualizar el plugin

```
/plugin marketplace update guia-monday-vibe
```

---

## Estructura del repo

```
guia-monday-vibe/
├── .claude-plugin/marketplace.json     ← catálogo (hace que el repo sea instalable)
└── plugins/monday-vibe/
    ├── .claude-plugin/plugin.json      ← manifiesto del plugin
    ├── skills/                         ← los comandos
    ├── agents/vibe-planner.md          ← el planificador
    ├── templates/                      ← archivos que copia /iniciar
    └── docs/                           ← requisitos, seguridad, modelos
```

Para modificarlo: editás, hacés push, y el equipo actualiza con `/plugin marketplace update`.

---

Hecho por **The Automation Partner**.
