1. Projektstruktur (Ist-Zustand, aktuell)

Frontend: Next.js (App Router), TypeScript
Root: src/

src/
├─ app/
│ ├─ agents/
│ │ ├─ page.tsx // AgentsPage (Create + Edit Flow)
│ │ └─ page.module.css
│ │
│ ├─ servers/
│ │ ├─ page.tsx
│ │ └─ page.module.css
│ │
│ ├─ tools/
│ │ ├─ page.tsx
│ │ └─ page.module.css
│ │
│ ├─ api/
│ │ └─ storage/
│ │ └─ [container]/
│ │ └─ route.ts // generische Cosmos-API (GET, POST, PUT)
│ │
│ ├─ layout.tsx
│ ├─ page.tsx // Startseite
│ ├─ page.module.css
│ ├─ globals.css
│ └─ favicon.ico
│
├─ features/
│ ├─ agents/
│ │ ├─ AgentCreateModal.tsx
│ │ ├─ AgentEditModal.tsx // separates Edit-Modal (neu)
│ │ ├─ AgentsList.tsx
│ │ └─ agents.storage.ts // saveAgent, loadAgents, updateAgent
│ │
│ ├─ servers/
│ │ ├─ ServerCreateModal.tsx
│ │ ├─ servers.storage.ts
│ │ ├─ servers.getTools.ts
│ │ ├─ ServersList.tsx
│ │ └─ ServerToolsList.tsx
│ │
│ ├─ tools/
│ │ ├─ ToolRegisterModal.tsx
│ │ ├─ toolschemas.storage.ts
│ │ └─ ToolSchemasList.tsx
│
├─ models/
│ ├─ agent.ts
│ ├─ mcpServer.ts
│ ├─ mcpServerTool.ts
│ └─ toolSchema.ts
│
├─ storage/
│ ├─ cosmos.ts // serverseitige Cosmos-Client-Config
│ └─ storage.ts // generischer Client-Storage (GET, POST, PUT)
│
└─ ui/
├─ AddButton.tsx
├─ Button.tsx
├─ Card.tsx
├─ CheckBox.tsx
├─ Modal.tsx
├─ ScrollContainer.tsx
├─ TextInput.tsx
└─ TextArea.tsx

2. Architekturprinzipien (bindend)
   2.1 UI / Feature-Trennung

ui/

rein visuelle, wiederverwendbare Komponenten

kein Fachwissen, keine Persistenz

z. B. Card, Modal, Button

features/\*

fachliche Logik

Page-nahe Komponenten (Listen, Modals)

orchestrieren UI + Storage

jede Domäne kapselt ihre Storage-Wrapper

2.2 Persistenz

ausschließlich über Next.js API Routes

Cosmos-Zugriff nur serverseitig

generische Route:

/api/storage/[container]

generischer Client-Layer:

storage/storage.ts

Wichtig:
Der container-Name wird serverseitig ins Dokument geschrieben.
Jedes StoredItem<T> kennt seine Herkunft (container, partitionKey, id).

3. Card-Konzept (bindend)
   type CardProps = {
   title: string;
   dataId: string;
   dataContainer: string; // Cosmos oder "runtime"
   children?: ReactNode;
   onClick?: () => void;
   };

dataContainer dient nur Debugging / DOM-Lesbarkeit

keine Business-Logik liest aus dem DOM

Logik arbeitet immer mit vollständigen Items im State:

onOpen(item)

Runtime-Daten (z. B. ServerTools):

dataContainer = "runtime"

4. Projektzweck & Ziel

Webbasiertes Verwaltungssystem für:

Agents

MCP-Server

persistierte Tools (ToolSchemas)

Klare Trennung:

Kategorie Beispiele Persistenz
Konfiguration Agents, MCP-Server, ToolSchemas ✅ Cosmos
Runtime-Daten ServerTools vom MCP ❌ 5. Fachliche Domänen
5.1 Agents

Page: /agents
Datenmodell: models/agent.ts
Persistenz: Cosmos (agents)

Agent enthält:

Metadaten (name, description)

Prompt-Konfiguration

Kontrollflags (directAnswersAllowed, onlyOneModelCall, maxToolcalls)

vorbereitete Tool-Referenzen (toolSchemas)

UI-Komponenten:

AgentsPage

AgentsList (Card-basiert, klickbar)

AgentCreateModal

AgentEditModal

Status:

✔ Create

✔ List / Anzeige

✔ Edit (separates Edit-Modal, PUT-Flow vollständig)

❌ Tool-Zuweisung

5.2 MCP-Server

Page: /servers
Persistenz: Cosmos (servers)
Runtime-Funktion: Tool-Abfrage (Python-Backend)

UI-Komponenten:

ServersList

ServerToolsList

ServerCreateModal

Status:

✔ vollständig funktionsfähig

5.3 Tools
Runtime-Tools (ServerTool)

Herkunft: MCP-Server

Modell: models/mcpServerTool.ts

nicht persistiert

Persistierte Tools (ToolSchema)

Page: /tools
Persistenz: Cosmos (toolschemas)
Modell: models/toolSchema.ts

UI-Komponenten:

ToolRegisterModal

ToolSchemasList

Status:

✔ Registrierung

✔ Anzeige

❌ Edit / Update (nächster Schritt)

6. Tool-Registrierung

Ort: features/tools/ToolRegisterModal.tsx

Zweck:
Transformation von ServerTool → ToolSchema

Explizite Pflege von:

Namen (Server ↔ LLM)

Argumenten

Beschreibungen

Typen

Persistenz über:

saveToolSchema(...)

7. Edit-Konzept (erprobt mit Agents)

Create-Modals bleiben unverändert

Edit ist ein separates Modal

kein Wiederverwenden von Create im ersten Schritt

klare Übergabe von StoredItem<T>

Edit-Modal wird nur gemountet, wenn ein Item existiert
→ initiale useState(...) greift zuverlässig

Persistenz:

API: PUT /api/storage/[container]

Client: updateItemInContainer

Feature: updateXxx(storedItem)

Dieses Muster ist direkt auf ToolSchemas übertragbar.

8. Mentales Arbeitsmodell (bindend)

schrittweise

minimal-invasiv

keine impliziten Feature-Sprünge

Reihenfolge:

saubere Datenflüsse

klares UI-Wiring

Persistenz-Anpassungen

erst danach neue Features

9. Nächste logisch geplante Schritte

Edit-Flow für ToolSchemas

Edit-Modal (Kopie oder Reuse von ToolRegisterModal)

updateToolSchema im Storage

Edit-Wiring auf /tools-Page

Tool-Zuweisung zu Agents

Anzeige zugewiesener Tools auf Agent-Cards

Diese Zusammenfassung ist die Referenz, um den Edit-Flow jetzt 1:1 für ToolSchemas umzusetzen, mit minimalem Denkaufwand und maximaler Wiederverwendung der bereits etablierten Schichten.
