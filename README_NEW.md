1. Projektstruktur (Ist-Zustand)
   Frontend (Next.js, App Router, TypeScript)

Root: src/

src/
├─ app/
│ ├─ agents/
│ │ ├─ page.tsx
│ │ └─ page.module.css
│ ├─ servers/
│ │ ├─ page.tsx
│ │ └─ page.module.css
│ ├─ tools/
│ │ └─ (derzeit leer / Platzhalter)
│ ├─ api/
│ │ └─ storage/
│ │ └─ [container]/route.ts
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
│ ├─ servers/
│ │ ├─ ServerCreateModal.tsx
│ │ ├─ servers.storage.ts
│ │ └─ servers.getTools.ts
│ └─ tools/
│ └─ (noch leer)
│
├─ models/
│ ├─ agent.ts
│ ├─ mcpServer.ts
│ └─ mcpServerTool.ts
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
└─ Card.tsx

2. Architekturprinzipien (wichtig für Weiterarbeit)

UI-Komponenten (ui/) sind dumm
→ keine Fachlogik, nur Props, keine Datenbeschaffung

Fachlogik liegt in features/\*

\*.storage.ts: Persistenz (Cosmos DB über API)

\*.getTools.ts: externe Calls (Python MCP Backend)

Persistenz

ausschließlich über Next.js API Routes

Cosmos DB Zugriff nur serverseitig

generischer Storage-Layer (routing/storage.ts)

Containername wird per URL bestimmt

MCP-Kommunikation

niemals über Next.js

ausschließlich über externes Python-FastAPI-Backend

Frontend ruft dieses Backend direkt auf (Runtime-Daten, keine Persistenz)

3. Projektzweck & Ziel
   Kurzfassung

Ein webbasiertes System zur Verwaltung von Agents, MCP-Servern und deren Tools, mit sauberer Trennung zwischen:

Persistierten Konfigurationsdaten (Agents, Server)

Dynamischen Runtime-Daten (Tools von MCP-Servern)

3.1 Agents

Werden im Frontend angelegt (/agents)

Datenmodell (models/agent.ts) enthält u.a.:

name

description

systemPrompt

directAnswerValidationPrompt

directAnswersAllowed

Agents werden in Cosmos DB gespeichert

Aktueller Status: voll funktionsfähig

3.2 MCP-Server

Werden im Frontend angelegt (/servers)

Datenmodell (models/mcpServer.ts):

name

url

Werden in Cosmos DB gespeichert

Pro Server kann zur Laufzeit:

„Get tools“ ausgelöst werden

→ Call an Python-FastAPI (POST /get_tools)

→ Übergabe der server.url

Aktueller Status: voll funktionsfähig

3.3 Tools (aktueller Fokus)
Herkunft

Tools kommen dynamisch von MCP-Servern

Rückgabeformat ist MCP-/OpenAI-kompatibel (type: "function")

Beispiel:

{
"type": "function",
"function": {
"name": "add",
"description": "Add two numbers together",
"parameters": {
"type": "object",
"properties": {
"a": { "title": "A", "type": "integer" },
"b": { "title": "B", "type": "integer" }
},
"required": ["a", "b"],
"additionalProperties": false
},
"strict": true
}
}

Tool-Modell (Ist-Zustand)

models/mcpServerTool.ts

ServerTool: Raw-Tool (nahe am Backend-JSON)

normalizeTool, validateTool: minimal, defensiv

ToolDisplay: UI-DTO

toToolDisplay(tool):

wandelt JSON-Schema in UI-freundliche Struktur:

Name

Description

Required-Liste

Parameter-Liste (name, title, type, required)

Wichtig:
Tools werden noch nicht persistiert.

3.4 Aktuelle Tool-Verarbeitung

servers.getTools.ts

listTools() → raw Backend-Response (unknown)

extractToolsArray() → robust gegen verschiedene Response-Formate

parseTools():

unknown → ServerTool[]

normalize + validate

Page (/servers/page.tsx)

speichert ServerTool[] im State

rendert Anzeige über toToolDisplay(tool)

Anzeige ist vollständig aufgedröselt, kein JSON-Dump mehr

4. Geplante Weiterentwicklung (wichtig für später)
   4.1 Registrierte Tools (zukünftiges Ziel)

Aus einem ServerTool soll später ein persistierbares Tool-Schema entstehen:

Erweiterung von ToolDisplay um:

LLM-spezifische Namen

Alias / Override-Felder

evtl. Default-Werte

Ein „registriertes Tool“ enthält:

referenzierte server.url

das Tool-Schema

optionale Überschreibungen

Diese registrierten Tools:

werden persistiert

können Agents zugewiesen werden

➡️ Das ist bewusst noch nicht implementiert, aber das aktuelle Modell ist darauf vorbereitet.

5. Mentales Modell für zukünftige Arbeit („geführtes Programmieren“)

Wenn du mir dieses Projekt in einem neuen Chat beschreibst, ist mein Arbeitsmodus:

Nichts automatisch persistieren, was Runtime-Daten sind

Erst:

saubere Modelle

klare UI-Darstellung

Dann:

explizite Einführung eines neuen Konzepts („registriertes Tool“)

Trennung strikt einhalten:

Server-Tool ≠ registriertes Tool ≠ Agent-Tool-Zuweisung

Änderungen immer:

minimal

schichtenspezifisch

ohne unnötige Abstraktion

Wenn du morgen oder später wiederkommst, kannst du einfach sagen:

„Wir sind beim MCP-Tool-Projekt, Stand wie zuletzt zusammengefasst.“

Dann mache ich genau hier weiter.
