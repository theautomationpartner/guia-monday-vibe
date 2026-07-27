# Capturas de pantalla del README

Los dibujitos ASCII del README funcionan, pero **una captura real se entiende mejor**.
Si querés agregarlas, es muy simple:

## Cómo agregarlas

1. Sacá la captura (en Windows: `Win + Shift + S`).
2. Guardala **en esta carpeta** (`docs/img/`) con **exactamente** el nombre de la tabla de abajo.
3. En el `README.md`, buscá el bloque ASCII correspondiente y **debajo** pegá la línea de markdown
   que figura en la última columna.
4. `git add . && git commit -m "Agrega capturas" && git push`

## Las capturas que valen la pena

| Nombre del archivo | Qué mostrar | Línea a pegar en el README |
|---|---|---|
| `01-menu-plugins.png` | El menú desplegado al escribir `/plu`, con "Manage plugins" resaltado | `![Menú Manage plugins](docs/img/01-menu-plugins.png)` |
| `02-marketplace-vacio.png` | La pestaña Marketplaces con la cajita vacía y el botón Add | `![Agregar marketplace](docs/img/02-marketplace-vacio.png)` |
| `03-marketplace-ok.png` | El marketplace ya agregado (`Marketplaces (1)`) | `![Marketplace agregado](docs/img/03-marketplace-ok.png)` |
| `04-instalar-plugin.png` | Las 3 opciones de instalación, con "Install for you" | `![Instalar el plugin](docs/img/04-instalar-plugin.png)` |
| `05-instalado.png` | El plugin en INSTALLED con el punto verde | `![Plugin instalado](docs/img/05-instalado.png)` |
| `06-comandos.png` | Los 6 comandos desplegados al escribir `/monday-vibe:` | `![Los 6 comandos](docs/img/06-comandos.png)` |

## Antes de subir una captura

- [ ] Que **no se vea ningún token** ni dato de cliente (board IDs, nombres, URLs de cuentas).
- [ ] Recortá solo la ventana relevante, no toda la pantalla.
- [ ] Que se lea bien (no la achiques de más).
