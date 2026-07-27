# MODELOS DE IA — los 2 mundos (no los confundas)

Hay **dos lugares distintos** donde elegís un modelo de IA en este flujo, y **no son lo mismo**.
Confundirlos es lo que hace que una app cueste 10× de más.

```
🌍 MUNDO A — Claude Code (tu VS Code)     🌍 MUNDO B — monday vibe (el navegador)
   Desarrollo local                          Reconstrucción final
   Paga tu suscripción de Claude             Gasta CRÉDITOS del cliente
   ✅ Priorizá CALIDAD                        💸 Priorizá COSTO
```

---

## 🌍 Mundo A — Claude Code (desarrollo local)

**No gasta créditos de monday.** Acá conviene el mejor modelo que tengas: cada error que evitás
local es un error que no vas a pagar caro en vibe.

| Tarea | Modelo sugerido |
|---|---|
| Diseñar la app, lógica compleja, planificar, decisiones de arquitectura | **Opus** (el más capaz) |
| La mayor parte del desarrollo, día a día | **Sonnet** (balanceado) |
| Ediciones mecánicas y rápidas | **Haiku** / **Fable** |

Se cambia con `/model` dentro de Claude Code.

---

## 🌍 Mundo B — monday vibe (cada build cuesta créditos)

**Acá manda el costo.** Se elige el modelo **antes** de mandar el prompt, en el selector del chat de
vibe. Según monday, **elegir bien el modelo es la forma más rápida de bajar el gasto**.

| Modelo en vibe | Costo por build | Usalo para |
|---|---|---|
| **Gemini Flash** | **10–20 créditos** | Scaffold, UI, dashboards, ajustes visuales, textos, pulido |
| **Claude Sonnet** | **30–50 créditos** | Pantallas con lógica/estado, la mayoría del detalle |
| **Claude Opus** | **50–500 créditos** | 🚨 SOLO lógica pesada aislada. Casi nunca |
| **Auto-select** | — | Si dudás, que elija vibe |

Además:
- Los créditos se cobran **por mensaje**, y el costo se muestra **al final de cada run**.
- El **modo "Discuss"/Chat cuesta menos** que Build (no escribe ni ejecuta código) → usalo para
  preguntas y brainstorming, nunca gastes un Build solo para preguntar.

### ⚠️ Opus es la trampa de créditos #1
Un caso real de dashboard hecho **todo en Opus** con 40+ iteraciones gastó **miles** de créditos.
Otro dashboard equivalente, hecho con modelo barato y sin iterar en vivo, costó **~237**.
**Mismo tipo de app, 10× de diferencia.** La diferencia fue el modelo y la disciplina.

### Ojo con los nombres
Los modelos de vibe **no son los mismos** que los de Claude Code:
- **"Fable" no existe en monday vibe** (es solo de Claude Code).
- Las versiones de Claude en vibe suelen ir por detrás de las de Claude Code.

---

## Triage: ¿esta app justifica el flujo completo?

No toda app necesita el flujo local→Vercel→vibe. Decidí al inicio:

| La app es… | Recomendación |
|---|---|
| **Trivial** (1 pantalla, sin lógica, sin datos críticos) | Probá **directo en vibe con Gemini Flash** (10–20 créd.). Montar todo el flujo local es overkill. |
| **Mediana** (2–3 pantallas, algo de lógica, datos reales) | **Flujo completo.** Es donde más se ahorra. |
| **Compleja** (multi-pantalla, cálculos, integraciones, cliente exigente) | **Flujo completo, sí o sí.** Acá es donde se queman cientos de créditos si improvisás. |

Regla práctica: **si vas a iterar más de 3–4 veces, el flujo local ya te conviene.**

---

## Controlar el gasto desde la cuenta (para admins)

monday te deja **ver y limitar** el consumo, no solo sufrirlo:
- **Administración → AI governance → Credits Usage**: ver cuántos créditos se consumieron, **qué
  features los están gastando**, y comprar más si hace falta.
- Ahí mismo se pueden **poner límites de uso** en la cuenta.
- El sistema avisa al **80%** y al **100%** del cupo mensual. Pasado el límite, el uso de IA puede
  quedar restringido.
- Los créditos son un **pool compartido** entre todas las capacidades de IA (vibe, agentes,
  notetaker, etc.) — no es un cupo exclusivo de vibe.

> Antes de arrancar un proyecto con un cliente, mirá ahí cuántos créditos hay disponibles. Es lo que
> te dice si tenés margen o si conviene ser especialmente cuidadoso.

## Reglas de oro (Mundo B)

1. **Elegí el modelo antes de cada prompt.** Flash por defecto; subí solo si hace falta.
   *(monday: "es la forma más efectiva de manejar el consumo".)*
2. **Nunca Opus** para scaffolding, UI o ajustes visuales.
3. **Preguntá en modo Discuss**, no gastando un Build.
4. **Si un build sale mal, revertí a la versión anterior** en vez de encadenar prompts de arreglo
   (acumulan bugs y créditos) — recomendación oficial de monday.
5. **Instrucciones granulares.** Dejar que la IA decida = más razonamiento = más créditos. Decile
   exactamente qué hacer, no "resolvelo vos".
6. **Lo importante al principio o al final** del prompt (es donde el modelo más presta atención).
7. **No pidas búsquedas web** salvo que sean imprescindibles: gastan pasos extra.
8. **Adjuntá en vez de describir**: CSV/XLSX para los datos, imagen para el diseño.
9. **Agrupá cambios afines** en un solo prompt (cada mensaje tiene costo base).
10. **Explorá la UX en local**, no en vibe.
