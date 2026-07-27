# REQUISITOS — leé esto antes de empezar

Checklist de lo que necesitás **antes** de arrancar tu primera app de monday. Si te falta algo de acá,
te vas a trabar a mitad de camino.

---

## 1. En tu máquina

| Qué | Para qué | Cómo verificar |
|---|---|---|
| **Node.js 18+** | Correr la app (Vite) e instalar paquetes | `node --version` |
| **npm** | Instalar dependencias | `npm --version` |
| **Git** | Versionar y subir a GitHub | `git --version` |
| **VS Code + Claude Code** | Desarrollar | Ya lo tenés si leés esto |

Si alguno falla:
- **Node/npm** → instalá desde [nodejs.org](https://nodejs.org) (versión LTS).
- **Git** → [git-scm.com](https://git-scm.com/download/win).

### Gotcha de Windows (te va a pasar)
Si PowerShell te dice **"la ejecución de scripts está deshabilitada"** al correr `npm`/`npx`,
corré esto **una vez** y respondé `S`:
```powershell
Set-ExecutionPolicy -Scope CurrentUser RemoteSigned
```
Permite scripts locales solo para tu usuario. Es la config normal de una máquina de desarrollo.

**Otro gotcha:** si alguna vez tenés que instalar una herramienta de línea de comandos, preferí
**`npm install -g <paquete>`** antes que usar `npx <paquete>` cada vez. En Windows, `npx` re-descarga
y suele dar timeouts y errores `EPERM`.

---

## 2. Cuentas que necesitás

| Cuenta | Para qué | Ojo con |
|---|---|---|
| **GitHub** | Guardar el repo (privado) | Que el repo sea **privado** (es código de cliente) |
| **Vercel** | Desplegar la app para que el cliente la pruebe | El plan free alcanza; se conecta con tu GitHub |
| **monday del cliente** | Leer sus boards reales | Necesitás acceso y el **token** (ver `SEGURIDAD-TOKEN.md`) |
| **monday con vibe** | El paso final | Ver abajo ⬇️ |

### Requisitos de la cuenta monday para usar vibe
Esto es lo que más frena, y no depende de vos:
- ✅ Cuenta **paga** (las cuentas free **no pueden crear** apps vibe; las de trial pueden construir y
  probar pero **no publicar**).
- ✅ **IA habilitada** por un admin: *Administración → AI governance → AI permissions → Enable AI features*.
- ✅ **Créditos disponibles** (los planes traen un cupo mensual; avisa al 80% y 100%).
- ✅ **Permiso para crear/publicar** apps vibe (en Enterprise, el admin lo habilita por rol).

> Confirmá esto **antes** de prometerle una fecha al cliente.

---

## 3. Cómo conseguir los board/column IDs reales

**Esto es lo más importante del kit.** Todos los casos que salieron baratos tenían IDs reales;
los que fallaron, no. **No inventes IDs ni asumas nombres de columna.**

### Board ID → está en la URL
Abrí el board en monday y miralo en la barra de direcciones:
```
https://TUCUENTA.monday.com/boards/1234567890
                                    └────────┘
                                    ese es el board ID
```

### Column IDs → desde la columna
En monday, en el menú de la columna, buscá su **ID** (suele figurar en la configuración/"Column ID").
Los IDs se ven así: `text_abc123`, `numeric_def456`, `dropdown_ghi789`, `status`, `date4`.

> **Importante:** el **ID no es el nombre**. Una columna llamada "Estado" puede tener el ID
> `color_xyz987`. La app usa el **ID**, no el nombre.

### Atajo: pediéselo a Claude
Si hay un **conector de monday** disponible en tu chat de Claude, pedile:
> "Leé el board `<URL o nombre>` y dame sus columnas con ID, nombre y tipo."

❌ **No montes un MCP local de monday** (`npx @mondaydotcomorg/monday-api-mcp`): es frágil en Windows
(tokens, variables de entorno, timeouts) y **no hace falta** para esto.

### Anotá el modelo de datos así
| Board | Board ID | Columna | Column ID | Tipo |
|---|---|---|---|---|
| Pedidos | 1234567890 | Estado | `color_abc123` | status |
| Pedidos | 1234567890 | Fecha de entrega | `date_def456` | date |
| Pedidos | 1234567890 | Responsable | `person` | person |

*(Ejemplo genérico — usá los IDs reales del cliente.)*

Esa tabla **es parte del prompt de vibe**.

---

## 4. Antes de escribir código, definí

- [ ] **Tipo de app** (variant): board view / item view / dashboard widget / standalone.
- [ ] **Idioma de la UI** (lo ve el cliente: español o inglés — no es el idioma en que vos programás).
- [ ] **Los boards ya existen** y tenés sus IDs (⚠️ vibe soporta **máximo 5 boards** por app).
- [ ] **Qué NO va a hacer la app** (el scope acotado ahorra créditos: todos los casos baratos lo tenían).

---

## 5. Checklist final de arranque

- [ ] `node --version` y `git --version` responden.
- [ ] Tengo cuenta de GitHub y de Vercel.
- [ ] Tengo acceso al monday del cliente y su token (para el `.env.local`).
- [ ] La cuenta monday destino es paga, con IA habilitada y con créditos.
- [ ] Tengo la tabla de boards/columnas con **IDs reales**.
- [ ] Definí tipo de app, idioma y scope.

✅ Con esto podés arrancar. Seguí con el `README.md`.
