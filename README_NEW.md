1. Projektstruktur (Ist-Zustand)

Frontend: Next.js (App Router), TypeScript
Root: src/

src/
├─ app/
│ ├─ agents/
│ │ ├─ page.tsx // AgentsPage
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
│ │ └─ route.ts // generische Cosmos-Persistenz-API
│ │
│ ├─ layout.tsx
│ ├─ page.tsx // Startseite
│ ├─ page.module.css
│ ├─ globals.css
│ └─ favicon.ico
│
├─ features/
│ ├─ agents/
│ │ ├─ AgentCreateModal.tsx // Create-Modal für Agents
│ │ ├─ AgentsList.tsx // Card-Liste (clickable)
│ │ └─ agents.storage.ts
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
│ └─ storage.ts // generischer Client-Storage
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

2.2 Persistenz

ausschließlich über Next.js API Routes

Cosmos-Zugriff nur serverseitig

generische Route:
/api/storage/[container]

generischer Client-Layer: storage/storage.ts

Wichtig:
Der Containername wird serverseitig ins Dokument geschrieben (container Feld), damit jedes geladene Item seine Herkunft kennt.

3. Card-Konzept (aktueller Stand)
   type CardProps = {
   title: string;
   dataId: string;
   dataContainer: string; // Herkunft (Cosmos oder "runtime")
   children?: ReactNode;
   onClick?: () => void;
   };

dataContainer dient nur Debugging / DOM-Lesbarkeit

keine Business-Logik liest aus dem DOM

Logik nutzt immer das komplette Item im State (onOpen(item))

Für Runtime-Daten (z. B. ServerTools):

dataContainer="runtime"

4. Projektzweck & Ziel

Webbasiertes Verwaltungssystem für:

Agents

MCP-Server

persistierte Tools (ToolSchemas)

klare Trennung zwischen:

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

vorbereitete Tool-Referenzen

UI:

AgentsPage

AgentsList (Card-basiert, klickbar)

AgentCreateModal

Status:

✔ Create

✔ List / Anzeige

⚠️ Edit: in Arbeit (separates Edit-Modal geplant)

❌ Tool-Zuweisung

5.2 MCP-Server

Page: /servers

Persistenz: Cosmos (servers)

Laufzeitfunktion: Get tools (Python-Backend)

UI:

ServersList

ServerToolsList

Status:

✔ vollständig funktionsfähig

5.3 Tools
Runtime-Tools (ServerTool)

Herkunft: MCP-Server

Datenmodell: models/mcpServerTool.ts

nicht persistiert

Persistierte Tools (ToolSchema)

Page: /tools

Persistenz: Cosmos (toolschemas)

Datenmodell: models/toolSchema.ts

UI:

ToolRegisterModal

ToolSchemasList

Status:

✔ Registrierung

✔ Anzeige

❌ Edit / Update

6. Tool-Registrierung

Ort: features/tools/ToolRegisterModal.tsx

Zweck: Transformation
ServerTool → ToolSchema

explizite Pflege von:

Namen (Server ↔ LLM)

Argumenten

Beschreibungen

Typen

Persistenz: saveToolSchema

7. Edit-Thematik (aktueller Stand)

Create-Modals bleiben unverändert

Edit wird als separates Modal gebaut (kein Wiederverwenden von Create)

Motivation:

sauberes State-Management

keine Vermischung von Create/Edit-Flows

klare Übergabe von StoredItem<T>

8. Mentales Arbeitsmodell (bindend)

schrittweise

minimal-invasiv

keine impliziten Feature-Sprünge

Reihenfolge:

saubere Datenflüsse

klare UI-Wiring

Persistenz-Anpassungen

erst danach neue Features

9. Nächste logisch geplante Mini-Schritte

Separates AgentEditModal

Update/Upsert-API für Cosmos (Edit ≠ Create)

Edit-Flow für ToolSchemas

Tool-Zuweisung zu Agents

Anzeige zugewiesener Tools auf Agent-Cards

Wenn du willst, kann ich dir beim nächsten Chat direkt mit Punkt 1 (AgentEditModal sauber einbauen) wieder einsteigen – ohne Wiederholung.
