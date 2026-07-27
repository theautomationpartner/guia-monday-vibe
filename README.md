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

### 📍 Antes de empezar: los dos lugares donde vas a trabajar

Todo pasa dentro de **VS Code**, en dos lugares distintos. No los confundas:

```
┌─────────────────────────────────────────────────────────────┐
│  VS Code                                                     │
│                                                              │
│   ┌──────────────────────┐   ┌───────────────────────────┐  │
│   │                      │   │  💬 EL CHAT DE CLAUDE     │  │
│   │   tus archivos       │   │                           │  │
│   │                      │   │  (panel lateral)          │  │
│   │                      │   │  Acá le escribís a Claude │  │
│   ├──────────────────────┤   │  y ponés los comandos     │  │
│   │ ⌨️ LA TERMINAL       │   │  que empiezan con /       │  │
│   │                      │   │                           │  │
│   │ Acá van los comandos │   │                           │  │
│   │ tipo node, git, gh   │   │                           │  │
│   └──────────────────────┘   └───────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

- **⌨️ La terminal** → menú **Terminal → New Terminal** (o `Ctrl + ñ`). Aparece abajo.
  Ahí van los comandos como `node --version`, `git`, `gh`.
- **💬 El chat de Claude** → el panel donde le escribís a Claude.
  Ahí van los comandos que empiezan con `/`, como `/monday-vibe:iniciar`.

> Regla simple: **si el comando empieza con `/`, va en el CHAT. Si no, va en la TERMINAL.**

---

### Paso 0 — Requisitos previos · ⌨️ TERMINAL

Abrí la terminal (**Terminal → New Terminal**) y pegá estos comandos, uno por uno (Enter después de
cada uno):

```bash
node --version
git --version
gh --version
```

Cada uno tiene que devolverte un número de versión:
- **node** → tiene que ser **v18** o más alto. Si dice "no se reconoce", instalá Node LTS desde
  [nodejs.org](https://nodejs.org).
- **git** → si falta, instalalo desde [git-scm.com](https://git-scm.com/download/win).
- **gh** → si falta, corré: `winget install GitHub.cli`.

> ⚠️ **Cada vez que instales una de estas herramientas, cerrá VS Code por completo y volvé a
> abrirlo.** Si no, la terminal sigue sin "ver" lo que acabás de instalar y te va a decir que no
> existe, aunque esté instalado. (Cerrar del todo, no "Reload Window".)

**Solo en Windows**, si alguno falla diciendo *"la ejecución de scripts está deshabilitada"*, pegá
esto una vez y respondé `S`:

```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```

---

### Paso 1 — Conectarte con GitHub · ⌨️ TERMINAL

El repo es **privado**, así que hay que darle a git una forma de identificarte **sin abrir ventanitas**
(el instalador de plugins no puede mostrarlas). En la terminal:

```bash
gh auth login
```

Te va a hacer varias preguntas — respondé así (con las flechas ↑↓ y Enter):

| Pregunta | Respondé |
|---|---|
| *What account do you want to log into?* | **GitHub.com** |
| *What is your preferred protocol...?* | **HTTPS** ← importante |
| *Authenticate Git with your GitHub credentials?* | **Yes** |
| *How would you like to authenticate?* | **Login with a web browser** |

Te muestra un código, apretás Enter, se abre el navegador, pegás el código y autorizás.

Después, **este comando es el que casi todos se olvidan** (sin él la instalación falla):

```bash
gh auth setup-git
```

**Comprobá que quedó bien** — esto tiene que funcionar sin pedirte usuario ni contraseña:

```bash
git clone --depth 1 https://github.com/theautomationpartner/guia-monday-vibe.git prueba-borrar
```

Si clonó, borrá la carpeta de prueba y seguí:

```bash
rm -rf prueba-borrar
```

> ❌ ¿Te dice *"Could not read from remote repository"*? No tenés acceso al repo → pedí que te
> agreguen a la organización en GitHub.

---

### Paso 2 — Agregar el marketplace · 💬 CHAT

**2.1** En el **chat de Claude**, escribí `/plu` (así, incompleto). Se despliega un menú y elegís
**"Manage plugins"**:

```
┌────────────────────────────────┐
│  Customize                     │
│  ▶ Manage plugins        ← ESTA│
├────────────────────────────────┤
│  /plu                          │
└────────────────────────────────┘
```

> 💡 En la extensión de VS Code **no existe** un comando `/plugin`. Se entra por acá.

**2.2** Se abre la ventana **"Manage Plugins"**. Clickeá la pestaña **"Marketplaces"**:

```
┌─ Manage Plugins ─────────────────────────────── ✕ ─┐
│                                                     │
│   Plugins    [ Marketplaces ]  ← clickeá acá        │
│   ─────────────────────────────────────────────     │
│                                                     │
│   ┌───────────────────────────────┐  ┌───────┐     │
│   │ pegá la URL acá               │  │  Add  │     │
│   └───────────────────────────────┘  └───────┘     │
└─────────────────────────────────────────────────────┘
```

**2.3** Pegá esta dirección **completa** en la cajita y dale **Add**:

```
https://github.com/theautomationpartner/guia-monday-vibe.git
```

> ⚠️ Copiala **entera**, con el `https://` del principio y el `.git` del final. Si ponés solo
> `theautomationpartner/guia-monday-vibe`, falla con un error de SSH.

✅ **Tiene que quedar así** (sin texto rojo):

```
┌─ Manage Plugins ─────────────────────────────── ✕ ─┐
│   Plugins    Marketplaces (1)                       │
│   ─────────────────────────────────────────────     │
│   guia-monday-vibe                          ⟳  🗑    │
│   Git: https://github.com/theautomation...          │
└─────────────────────────────────────────────────────┘
```

---

### Paso 3 — Instalar el plugin · 💬 CHAT

**3.1** En la misma ventana, clickeá la pestaña **"Plugins"**. Aparece **`monday-vibe`** → clickealo.

**3.2** Te pregunta dónde instalarlo. Elegí la **primera** opción:

```
┌─────────────────────────────────────────────┐
│  ▶ Install for you              ← ESTA      │
│    Available in all your projects           │
├─────────────────────────────────────────────┤
│    Install for this project                 │
│    Install locally                          │
└─────────────────────────────────────────────┘
```

> Va a aparecer un aviso de "asegurate de confiar en el plugin". Es el mensaje estándar para
> cualquier plugin — este lo hicimos nosotros, podés seguir tranquilo.

**3.3** Arriba aparece una barra con un botón **"Restart"** → clickealo.

**3.4** ⚠️ **Cerrá VS Code por completo y volvé a abrirlo.**

Sí, aunque le hayas dado a "Restart". El botón no siempre alcanza para que el plugin quede activo:
hay que **cerrar la ventana entera de VS Code** (no "Reload Window") y abrirla de nuevo. Si los
comandos del Paso 4 no te aparecen, casi siempre es por esto.

---

### Paso 4 — Verificar que funcionó · 💬 CHAT

En el chat escribí esto **sin mandarlo** (solo tipealo):

```
/monday-vibe:
```

Se tienen que desplegar los **6 comandos**:

```
/monday-vibe:iniciar     · crear una app nueva
/monday-vibe:planear     · pensar la app antes de codear
/monday-vibe:revisar     · chequear que esté todo bien
/monday-vibe:publicar    · subir a GitHub + Vercel
/monday-vibe:exportar    · generar el prompt para monday vibe
/monday-vibe:adaptar     · convertir una app hecha con otro stack
```

✅ **Si los ves, ya está instalado.** Probalo mandando `/monday-vibe:revisar`: te hace un diagnóstico
de tu entorno y te dice si falta algo.

> 📸 *Los esquemas de arriba son dibujos. Si querés agregar capturas de pantalla reales al README,
> mirá [`docs/img/`](docs/img/) — está todo listo, solo hay que soltar las imágenes.*

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
| Instalado pero no aparecen los comandos | El botón "Restart" no siempre alcanza | **Cerrá VS Code por completo y abrilo de nuevo** (no "Reload Window") |
| Instalaste node/git/gh pero "no se reconoce el comando" | La terminal no ve lo nuevo hasta reiniciar | **Cerrá VS Code por completo y abrilo de nuevo** |
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
