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
│ │ └─ route.ts // generische Persistenz-API
│ │
│ ├─ layout.tsx
│ ├─ page.tsx // Startseite
│ ├─ page.module.css
│ ├─ globals.css // globale Styles (inkl. scrollContainer)
│ └─ favicon.ico
│
├─ features/
│ ├─ agents/
│ │ ├─ AgentCreateModal.tsx // Create-Flow für Agents
│ │ ├─ AgentsList.tsx // Card-Liste mit Agent-Metadaten
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
│ ├─ agent.ts // Agent inkl. Tool-Zuweisung
│ ├─ mcpServer.ts
│ ├─ mcpServerTool.ts
│ └─ toolSchema.ts
│
├─ server/
│ └─ cosmos.ts // Cosmos-DB-Anbindung (serverseitig)
│
├─ storage/
│ └─ storage.ts // generischer Storage-Layer (Client)
│
└─ ui/
├─ AddButton.tsx
├─ Button.tsx
├─ Card.tsx
├─ CheckBox.tsx
├─ Modal.tsx
├─ ScrollContainer.tsx // einfacher Scroll-Wrapper (children)
├─ TextInput.tsx
└─ TextArea.tsx

2. Architekturprinzipien (bindend)
   UI / Feature-Trennung

ui/

ausschließlich dumme, wiederverwendbare UI-Komponenten

kein Fachwissen, kein Datenzugriff, kein Persistenzcode

Beispiele: Card, Modal, ScrollContainer, Inputs

features/\*

fachliche Logik

Page-nahe Komponenten (Listen, Modals)

Orchestrierung von UI + Storage

Persistenz

ausschließlich über Next.js API Routes

Cosmos DB Zugriff nur serverseitig

generischer Storage-Layer: storage/storage.ts

Containername wird über URL bestimmt
(/api/storage/[container])

MCP-Kommunikation

niemals über Next.js API

ausschließlich über externes Python FastAPI Backend

Frontend ruft MCP-Backend direkt auf

MCP-Daten sind Runtime-Daten

keine automatische Persistenz von MCP-Ergebnissen

3. Projektzweck & Ziel (Kurzfassung)

Webbasiertes Verwaltungssystem für:

Agents

MCP-Server

registrierte Tools

mit klarer Trennung zwischen:

persistierten Konfigurationsdaten

Agents

MCP-Server

ToolSchemas

dynamischen Runtime-Daten

ServerTools vom MCP-Backend

4. Fachliche Domänen
   4.1 Agents

Verwaltung: /agents

Datenmodell: models/agent.ts

Agent enthält:

Metadaten (name, description)

Prompt-Konfiguration

Kontrollflags (directAnswersAllowed, onlyOneModelCall, maxToolcalls)

Liste von ToolSchemas (Vorbereitung für Zuweisung)

Persistenz: Cosmos DB (agents)

UI:

AgentsPage

AgentCreateModal

AgentsList (Card-basierte Übersicht)

Status:
✔ Create
✔ List / Anzeige
❌ Edit
❌ Tool-Zuweisung (vorbereitet)

4.2 MCP-Server

Verwaltung: /servers

Datenmodell: models/mcpServer.ts

Persistenz: Cosmos DB (servers)

Laufzeitfunktion:

„Get tools“

POST an Python-Backend (/get_tools)

UI:

ServersList

ServerToolsList

Status:
✔ voll funktionsfähig

4.3 Tools
Herkunft

Tools kommen dynamisch von MCP-Servern

Format: MCP / OpenAI Tool-Format (type: "function")

Trennung der Tool-Ebenen
Ebene Zweck Persistenz
ServerTool rohe Runtime-Tools vom MCP ❌
ToolSchema registriertes Tool für Agents ✅
Agent-Tool-Zuweisung Tools pro Agent ❌ (nächster Schritt) 5. Tool-Datenmodelle (Frontend)
5.1 ServerTool (Runtime)

Datei: models/mcpServerTool.ts

roh, backendnah

normalizeTool, validateTool

nicht persistiert

5.2 ToolSchema (persistiert)

Datei: models/toolSchema.ts

Frontend-Spiegel des Python-Backends.

Struktur:

server_url

name_on_server

name_for_llm

description_for_llm

args_schema

ToolArgsSchema

type: "object"

properties: ToolArg[] (explizite Liste)

additionalProperties: false

ToolArg

name_on_server

name_for_llm

description_for_llm

type

required

default

6. Tool-Registrierung (Create)

Komponente: ToolRegisterModal

Ort: features/tools/ToolRegisterModal.tsx

Verwendung:

auf der Server-Page („Register Tool“)

Zweck:

Transformation von ServerTool → ToolSchema

UI:

Server-Face vs. LLM-Face

explizite Pflege von:

Tool-Namen

Parameter-Namen

Beschreibungen

Typen

Defaults

Persistenz:

saveToolSchema

Container: toolschemas

Status:
✔ funktional

7. Tools-Übersicht (persistierte Tools)

Page: /tools

lädt alle ToolSchema aus Cosmos

keine Create-Funktion (bewusst)

UI: ToolSchemasList

Anzeige:

Tool (LLM) ↔ Tool (Server)

Server-URL

vollständige Argumentliste

Pflicht / optional

Beschreibungen

8. Aktueller Stand „Edit“

ToolSchemasList besitzt Edit-Button

Klick liefert aktuell nur das Tool

kein Update / Upsert implementiert

bewusster Stop-Point

9. Mentales Arbeitsmodell („geführtes Programmieren“)

Weiterhin bindend:

keine impliziten Feature-Sprünge

Änderungen:

minimal

schichtenspezifisch

nachvollziehbar

Reihenfolge:

saubere Datenmodelle

klare UI-Darstellung

erst danach neue Konzepte (Edit, Zuweisungen)

10. Nächste logisch mögliche Mini-Schritte (geplant)

ToolSchemas in Agents-Page anzeigen

Drag & Drop: ToolSchema → Agent

Persistente Tool-Zuweisung am Agent

Erweiterung der Agent-Card (zugewiesene Tools sichtbar)
