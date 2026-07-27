# Guía monday vibe

Plugin de Claude Code para crear apps de **monday.com** sin quemar créditos de IA.

Desarrollás la app **local** con Claude Code → la desplegás en **Vercel** para que el cliente la
pruebe → y recién al final la pasás a **monday vibe** con un prompt preparado.

> **¿Por qué?** Iterar dentro de monday vibe cuesta créditos. Casos reales del equipo: una app hecha
> "a lo loco" quemó **~800 créditos y quedó rota**; otra más compleja, con este método, costó **~420
> y quedó andando**. La diferencia es el método, no la suerte.

---

## Instalación (una sola vez) — paso a paso

> Probado en Windows + VS Code. Toma unos 5 minutos.

### Paso 0 — Requisitos previos

Necesitás **Node.js 18+**, **git** y **GitHub CLI (`gh`)**. Verificalo en una terminal:

```bash
node --version    # v18 o superior
git --version
gh --version      # si falta: winget install GitHub.cli
```

**En Windows**, si algún comando falla con *"la ejecución de scripts está deshabilitada"*, corré esto
una vez (respondé `S`):

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

### Paso 1 — Autenticarte con GitHub (⚠️ imprescindible)

El repo es **privado**, así que git necesita credenciales que pueda entregar **sin abrir ventanas**
(el instalador de plugins no puede mostrar diálogos). Corré estos dos comandos:

```bash
gh auth login          # elegí GitHub.com → HTTPS → autenticar por navegador
gh auth setup-git      # deja a gh como proveedor de credenciales de git
```

**Verificá que funcione** (esto tiene que clonar sin pedirte nada):

```bash
git clone --depth 1 https://github.com/theautomationpartner/guia-monday-vibe.git /tmp/prueba
rm -rf /tmp/prueba
```

Si clona bien → seguí. Si pide usuario/contraseña → repetí `gh auth setup-git`.

> 💡 Sin el `gh auth setup-git`, la instalación falla con
> *"Cannot prompt because user interactivity has been disabled"*.

### Paso 2 — Agregar el marketplace

En Claude Code (VS Code):

1. En el chat escribí `/plu` y elegí **"Manage plugins"** (en la extensión **no** existe el comando
   `/plugin`; es esa opción del menú).
2. Andá a la pestaña **"Marketplaces"**.
3. Pegá esta URL **completa** en la cajita y dale **Add**:

```
https://github.com/theautomationpartner/guia-monday-vibe.git
```

> ⚠️ **Usá la URL HTTPS completa.** La forma corta `theautomationpartner/guia-monday-vibe` intenta
> clonar por **SSH** y falla con *"SSH host key is not in your known_hosts file"*.

Tiene que aparecer **`guia-monday-vibe`** en la lista, sin errores rojos.

### Paso 3 — Instalar el plugin

1. Pestaña **"Plugins"**.
2. Aparece **`monday-vibe`** → clickealo.
3. Elegí **"Install for you"** (*Available in all your projects*).
4. Dale al botón **"Restart"** que aparece arriba.

### Paso 4 — Verificar

En el chat escribí (sin mandar):

```
/monday-vibe:
```

Se tienen que desplegar los **6 comandos**: `iniciar`, `planear`, `revisar`, `publicar`, `exportar`,
`adaptar`.

✅ **Listo.** Probalo con `/monday-vibe:revisar` — te da un diagnóstico de tu entorno.

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

## Si algo falla al instalar

Estos dos son los que le pasan a **casi todos** la primera vez:

| Error | Causa | Solución |
|---|---|---|
| *"SSH host key is not in your known_hosts file"* | Usaste la forma corta `owner/repo` → git intenta **SSH** | Usá la **URL HTTPS completa** (`https://github.com/...git`) |
| *"Cannot prompt because user interactivity has been disabled"* / *"unable to get password"* | git necesita credenciales pero no puede preguntarte | Corré **`gh auth setup-git`** y reiniciá VS Code |
| *"Could not read from remote repository"* | Sin acceso al repo | Pedí que te agreguen a la organización |
| No aparece `/plugin` al escribir `/` | En la extensión de VS Code no existe ese comando | Escribí `/plu` y elegí **"Manage plugins"** |
| Instalado pero no aparecen los comandos | Falta reiniciar | Botón **Restart**, o cerrá y abrí VS Code completo |
| No encontrás los comandos | Llevan prefijo | Escribí `/monday-vibe:` y se despliegan los 6 |

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
