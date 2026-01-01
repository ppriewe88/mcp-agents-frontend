1. Projektstruktur (Ist-Zustand)
   Frontend (Next.js, App Router, TypeScript)

Root: src/

src/
├─ app/
│ ├─ agents/
│ │ ├─ page.tsx
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
│ │ └─ route.ts
│ │
│ ├─ layout.tsx
│ ├─ page.tsx
│ ├─ page.module.css
│ ├─ globals.css
│ └─ favicon.ico
│
├─ features/
│ ├─ agents/
│ │ ├─ AgentCreateModal.tsx
│ │ └─ agents.storage.ts
│ │
│ ├─ servers/
│ │ ├─ ServerCreateModal.tsx
│ │ ├─ servers.storage.ts
│ │ ├─ servers.getTools.ts
│ │ ├─ ServersList.tsx
│ │ └─ ServerToolsList.tsx
│ │
│ ├─ toolschemas/
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
├─ routing/
│ └─ storage.ts
│
├─ server/
│ └─ cosmos.ts
│
└─ ui/
├─ AddButton.tsx
├─ Button.tsx
├─ Card.tsx
├─ CheckBox.tsx
├─ Modal.tsx
├─ TextInput.tsx
└─ TextArea.tsx

2. Architekturprinzipien (bindend)
   UI / Feature-Trennung

ui/
ausschließlich dumme, wiederverwendbare UI-Komponenten
→ keine Fachlogik, kein State, keine Datenbeschaffung

features/\*
fachliche Logik, Modals, Listen, Page-nahe Komponenten

Persistenz

ausschließlich über Next.js API Routes

Cosmos DB Zugriff nur serverseitig

generischer Storage-Layer: routing/storage.ts

Containername wird per URL bestimmt (/api/storage/[container])

MCP-Kommunikation

niemals über Next.js API

ausschließlich über externes Python-FastAPI-Backend

Frontend ruft MCP-Backend direkt auf

MCP-Daten sind Runtime-Daten, nicht automatisch persistiert

3. Projektzweck & Ziel (Kurzfassung)

Webbasiertes Verwaltungssystem für:

Agents

MCP-Server

registrierte Tools

mit klarer Trennung zwischen:

persistierten Konfigurationsdaten
(Agents, Server, ToolSchemas)

dynamischen Runtime-Daten
(ServerTools vom MCP-Backend)

4. Fachliche Domänen
   4.1 Agents

Verwaltung über /agents

Datenmodell: models/agent.ts

Persistenz: Cosmos DB (agents)

UI:

AgentsPage

AgentCreateModal

Status: voll funktionsfähig

4.2 MCP-Server

Verwaltung über /servers

Datenmodell: models/mcpServer.ts

Persistenz: Cosmos DB (servers)

Laufzeitfunktion:

„Get tools“

POST an Python-Backend (/get_tools)

UI:

ServersList

ServerToolsList

Status: voll funktionsfähig

4.3 Tools (aktueller Fokus)
Herkunft

Tools kommen dynamisch von MCP-Servern

Format: MCP / OpenAI Tool-Format (type: "function")

Trennung der Tool-Ebenen
Ebene Zweck Persistenz
ServerTool rohe Runtime-Tools vom MCP ❌
ToolSchema registriertes Tool für Agents ✅
Agent-Tool-Zuweisung (noch nicht implementiert) ❌ 5. Tool-Datenmodelle (Frontend)
5.1 ServerTool (Runtime)

Datei: models/mcpServerTool.ts

Rohformat nah am Backend

normalizeTool, validateTool

nicht persistiert

5.2 ToolSchema (persistiert)

Datei: models/toolSchema.ts

Frontend-Spiegel des Python-Backends

ToolSchema

server_url
name_on_server
name_for_llm
description_for_llm
args_schema

ToolArgsSchema

type: "object"
properties: ToolArg[] // explizit Liste
additionalProperties: false

ToolArg

name_on_server
name_for_llm
description_for_llm
type
required
default (string | EmptyDefault | null)

6. Tool-Registrierung (Create)
   ToolRegisterModal

Ort: features/toolschemas/ToolRegisterModal.tsx

Verwendung:

auf der Servers-Page („Register Tool“)

Zweck:

aus ServerTool → ToolSchema

UI:

Server-Face vs. LLM-Face

explizite Pflege von:

Tool-Namen (LLM)

Parameter-Namen (LLM)

Parameter-Beschreibung / Typ / Default

Persistenz:

saveToolSchema

Container: toolschemas

Status: funktional

7. Tools-Übersicht (persistierte Tools)
   ToolsPage (/tools)

lädt alle ToolSchemas aus Cosmos

keine Create-Funktion (bewusst)

UI:

ToolSchemasList

Card-basierte Darstellung

Anzeige:

Tool (LLM) ↔ Tool (Server)

Server-URL

vollständige Args-Liste

name_for_llm

name_on_server

type

required / optional

description_for_llm

8. Aktueller Stand „Edit“

ToolSchemasList besitzt Edit-Button

Klick liefert aktuell nur das Tool (kein Modal)

kein Update / Upsert implementiert

bewusster Stop-Point erreicht

9. Mentales Arbeitsmodell („geführtes Programmieren“)

Für zukünftige Schritte gilt weiterhin:

keine impliziten Feature-Sprünge

Änderungen:

minimal

schichtenspezifisch

nachvollziehbar

Reihenfolge:

saubere Modelle

klare UI-Darstellung

erst dann neue Konzepte (z. B. Edit-Modus, Zuweisungen)

10. Nächste logisch mögliche Mini-Schritte (nicht umgesetzt)

Tool → Agent-Zuweisung

Agent-Schema (Datenmodell) dafür noch erweitern
