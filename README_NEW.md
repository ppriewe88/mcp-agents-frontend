1. Projektüberblick

Das Projekt ist ein webbasiertes Verwaltungssystem zur Konfiguration und Administration eines agentenbasierten LLM-/MCP-Systems.

Es dient der Verwaltung von:

Agents

MCP-Servern

persistierten Tools (ToolSchemas)

Zusätzlich wird eine Chat-Seite vorbereitet, auf der konfigurierte Agents ausgewählt und später ausgeführt werden können.

Zentrale Ziele:

saubere Trennung von UI, Fachlogik und Persistenz

explizite, nachvollziehbare Datenflüsse

minimal-invasive Erweiterbarkeit ohne Refactor-Zwang

2. Projektstruktur (Ist-Zustand)
   Technologie

Frontend: Next.js (App Router)

Sprache: TypeScript

Persistenz: Azure Cosmos DB (ausschließlich serverseitig)

Root
src/

Aktuelle Struktur (relevant)
src/
├─ app/
│ ├─ agents/
│ │ └─ page.tsx
│ ├─ servers/
│ │ └─ page.tsx
│ ├─ tools/
│ │ └─ page.tsx
│ ├─ chat/
│ │ └─ page.tsx // Chat-Seite (Agent-Auswahl)
│ ├─ api/
│ │ └─ storage/[container]/route.ts // generische Cosmos-API
│ ├─ layout.tsx
│ ├─ page.tsx // Startseite
│ └─ globals.css
│
├─ features/
│ ├─ agents/
│ │ ├─ AgentCreateOrEditModal.tsx
│ │ ├─ AgentsList.tsx
│ │ └─ agents.storage.ts
│ ├─ chat/
│ │ └─ AgentBadgeList.tsx // Agent-Auswahl (Badges)
│ ├─ servers/
│ │ ├─ ServerCreateModal.tsx
│ │ ├─ ServerList.tsx
│ │ ├─ ServerToolsList.tsx
│ │ ├─ servers.getTools.ts
│ │ └─ servers.storage.ts
│ └─ tools/
│ ├─ ToolSchemaCreateOrEditModal.tsx
│ ├─ ToolSchemasList.tsx
│ ├─ ToolSchemasDragList.tsx
│ ├─ toolschemas.storage.ts
│ └─ toolschemas.utils.ts
│
├─ models/
│ ├─ agent.ts
│ ├─ mcpServer.ts
│ ├─ mcpServerTool.ts
│ └─ toolSchema.ts
│
├─ storage/
│ ├─ cosmos.ts // serverseitiger Cosmos-Client
│ └─ storage.ts // generischer Client-Storage
│
└─ ui/
├─ AddButton.tsx
├─ AgentBadge.tsx // klickbares & selektierbares Badge
├─ Button.tsx
├─ Card.tsx
├─ ListArea.tsx // erweitert um variant
├─ ListAreaHalf.tsx
├─ Modal.tsx
├─ ScrollContainer.tsx
├─ ToolBadge.tsx
└─ weitere UI-Bausteine

3. Architekturprinzipien (bindend)
   3.1 UI / Feature / Page-Trennung

ui/

rein visuelle, wiederverwendbare Komponenten

keine Fachlogik

keine Persistenz

features/

fachliche Logik je Domäne

Page-nahe Komponenten (Listen, Modals)

kapseln Persistenzzugriffe über Storage-Wrapper

app/\*/page.tsx

Orchestrierungsebene

hält Page-State (Listen, selektierte Items, Modal-Status)

entscheidet über Create / Edit / Save / Reload / Selection

4. Persistenzarchitektur (Cosmos DB)
   4.1 Grundprinzip

Cosmos-Zugriff ausschließlich serverseitig

Client kommuniziert nur über Next.js API Routes

eine generische API für alle Container:

/api/storage/[container]

4.2 API-Operationen
HTTP Zweck Cosmos
GET Load query
POST Create create
PUT Update upsert

Wichtig:

container und partitionKey werden serverseitig gesetzt

Client darf diese nicht manipulieren

4.3 Client-Storage (storage/storage.ts)

Generische Funktionen:

saveItemToContainer(container, item)

loadItems(container)

updateItemInContainer(container, storedItem)

Zentraler Typ:

type StoredItem<T> = T & {
id: string;
partitionKey: string;
container: string;
};

➡ Persistenz-Metadaten werden nicht in Domänenmodellen gespeichert.

4.4 Feature-spezifische Wrapper

agents.storage.ts

toolschemas.storage.ts

servers.storage.ts

➡ Pages sprechen ausschließlich mit Feature-Wrappern.

5. Card- und Badge-Konzepte (bindend)
   5.1 Card-Konzept (Admin-Ansichten)
   type CardProps = {
   title: string;
   dataId: string;
   dataContainer: string;
   children?: ReactNode;
   onClick?: () => void;
   };

dataContainer dient nur Debugging

Aktionen arbeiten immer mit vollständigen StoredItem<T>

Card-Klick → onOpen(storedItem)

5.2 Badge-Konzept (Chat & Auswahl)
AgentBadge (ui/AgentBadge.tsx)

visuelle Darstellung eines AgentRef

optional klickbar (onClick)

optional selektierbar (selected)

keine Persistenzlogik

kein Wrapper-DIV notwendig

AgentBadgeList (features/chat/AgentBadgeList.tsx)

rendert eine kompakte Badge-Leiste

kapselt Loading / Error / Empty-State

ruft onSelect(StoredItem<Agent>) bei Klick

bestimmt Selected-State über Vergleich:

selectedAgent?.id === agent.id

6. Fachliche Domänen
   6.1 Agents

Page: /agents
Persistenz: Cosmos (agents)

Status:

Create ✔

List ✔

Edit ✔

Tool-Zuweisung ✔

Chat-Selektion ✔

Edit-Flow:

Card-Klick → StoredItem<Agent> in State

Edit-Modal nur gemountet, wenn Item existiert

Save: Patch → Merge → updateAgent → Reload

Tool-Zuweisung:

Agents speichern keine vollständigen ToolSchemas, sondern Referenzen.

type ToolSchemaRef = {
tool_id: string;
container: string; // z. B. "toolschemas"
name_for_llm: string; // UI / Kontext
server_url: string; // UI / Kontext
};

6.2 MCP-Server

Page: /servers
Persistenz: Cosmos (servers)

Besonderheiten:

Mischung aus persistierten Servern

und nicht persistierten Runtime-Tools aus dem MCP-Backend

Status: stabil & funktionsfähig

6.3 Tools
6.3.1 Runtime-Tools (ServerTool)

Herkunft: MCP-Server

Modell: mcpServerTool.ts

nicht persistiert

6.3.2 Persistierte Tools (ToolSchema)

Page: /tools

Persistenz: Cosmos (toolschemas)

Modell: toolSchema.ts

7. ToolSchema Create & Edit (bindend)

Einheitliches Modal:

ToolSchemaCreateOrEditModal

ersetzt Create- und Edit-Modals

initialToolSchema?: StoredItem<ToolSchema> | null

Verantwortlichkeiten:

Modal

UI-only

baut ToolSchema

normalizeToolSchema + validateToolSchema

ruft ausschließlich onSubmit(schema)

Page

entscheidet Create vs. Edit

saveToolSchema oder Merge + updateToolSchema

schließt Modal

reloadet Liste

➡ exakt gleiches Muster wie bei Agents.

8. ToolSchema ↔ Agent-Verknüpfung
   8.1 UI-Struktur

AgentsPage enthält separate Tool-Liste

Komponente: ToolSchemasDragList

reduzierte Mini-Cards

Zweck: Auswahl & Zuordnung, keine Verwaltung

8.2 Drag & Drop

ToolSchema-Mini-Cards sind draggable

Agent-Cards sind Drop-Ziele

Beim Drop:

ToolSchemaRef wird erzeugt

in bestehendes StoredItem<Agent> gemerged

Persistenz via updateAgent

Reload der Agent-Liste

Duplikate werden verhindert

8.3 Anzeige & Edit

Agent-Edit-Modal zeigt zugewiesene Tools als ToolBadges

Entfernen lokal im Modal

Persistenz nur bei Save

Modal schließen ohne Save verwirft Änderungen

9. Chat-Page (neu)

Page: /chat

Zweck:

Auswahl eines konfigurierten Agents

Vorbereitung für agentbasierten Chat

spätere Tool-Auflösung & Agent-Execution

UI-Struktur:

obere, kompakte ListArea (variant="compact")

AgentBadgeList als horizontale Badge-Leiste

Selected-Agent visuell hervorgehoben

ListArea-Erweiterung:

variant?: "default" | "compact"

compact entfernt Mindesthöhe für Ribbon-artige Nutzung

State-Modell:

selectedAgent: StoredItem<Agent> | null

vollständiger Agent inkl. id bleibt im State

UI-Highlighting über selectedAgent.id

reiner Agent kann beim Fetch abgeleitet werden

10. Datenflüsse
    Lesen
    Page
    → Feature-Storage
    → Client-Storage
    → API
    → Cosmos

Create
Modal
→ Page(onSubmit)
→ saveXxx
→ POST
→ Cosmos
→ Reload

Edit
Card
→ Page-State
→ Modal
→ Patch
→ Merge
→ updateXxx
→ PUT
→ Reload

Tool-Zuweisung
ToolSchemasDragList
→ Drag ToolSchemaRef
→ Drop auf Agent-Card
→ Merge in Agent
→ updateAgent
→ Reload

Agent-Auswahl (Chat)
ChatPage
→ AgentBadgeList
→ AgentBadge(onClick)
→ setSelectedAgent(StoredItem<Agent>)
→ visuelles Highlighting
→ später: Fetch(selectedAgent)

11. Mentales Arbeitsmodell (bindend)

schrittweise

minimal-invasiv

keine impliziten Seiteneffekte

erst saubere Datenflüsse

dann UI-Wiring

Persistenzänderungen vor neuen Features

12. Aktueller Status

Agent Create / Edit ✔

ToolSchema Create / Edit ✔

Drag & Drop Tool-Zuweisung ✔

Persistenz der Tool-Referenzen ✔

Anzeige & Entfernen im Agent-Modal ✔

Chat-Agent-Auswahl ✔

Selected-State & visuelles Feedback ✔

Architektur konsistent ✔

13. Nächste logische Schritte

Chat-Button & Fetch-Flow mit selectedAgent

serverseitige Tool-Auflösung aus toolSchemas

Agent-Execution-Endpoint

optionale Tastaturnavigation / Deselect-Logik

Status-Fazit

Das Projekt verfügt nun über eine konsistente, skalierbare Administrations- und Auswahlarchitektur, die Konfiguration und Interaktion (Chat) sauber vorbereitet.
Neue Features lassen sich mechanisch und ohne Refactor-Zwang entlang etablierter Muster ergänzen.

########## ERGÄNZUNG zum Thema Streaming:
invokeAgent sendet per fetch einen POST an den FastAPI-Endpoint und liest die Response als NDJSON-Stream (application/x-ndjson) über res.body.getReader() + TextDecoder.

Der Stream wird über einen buffer zeilenweise (Delimiter \n) in vollständige JSON-Records zerlegt; jede Zeile wird geparst zu { type, data }.

Die zentrale Routing-Logik liegt in streamControl(StreamChunk): Dort wird anhand von type entschieden, ob ein Chunk als finaler Text oder als Step/Arbeitschritt behandelt wird (und später: Tool-/Tabellenpakete).

invokeAgent verteilt anschließend auf zwei getrennte Handler:

onFinalText(appendText: string) aktualisiert die Chat-Message (AI) durch Append in setMessages (wie bisher).

onStep(item: StepItem) ist der Einstiegspunkt für nicht-finale Chunks; aktuell kann er loggen, später wird er UI-Elemente/Boxen in einer Step-Liste anlegen (reihenfolgegetreu, append-only).

Typisch sind Discriminated-Unions als Basistypen: StreamChunk (eingehende Stream-Chunks) und StepItem (UI-nahe Repräsentation für Steps). Das Design erlaubt später ohne API-Bruch zusätzliche Chunk-Typen (z. B. tool_result_table) und reichere UI-Payloads.

To-dos

StreamChunk zu einer vollständigen Discriminated Union ausbauen (z. B. text_step, text_final, tool_result, tool_request, …).

streamControl erweitern, sodass es nicht nur Text weiterreicht, sondern für neue Typen strukturierte StepItems mit Metadaten (Label, Icon, Payload) erzeugt.

Einen dedizierten State für Step-Items (z. B. steps: StepItem[]) in der Page einführen und in onStep append-only pflegen.

UI-Komponenten für Step-Items bauen (Boxen/Liste), die anhand von kind oder payload unterschiedliche Darstellungen rendern (Text, Tabelle, Download-Button, etc.).

Optionale Token-Koaleszenz: mehrere text_step-Chunks zu einer Step-Box zusammenführen, um UI-Rauschen zu vermeiden.

Fehler- und Abbruch-Chunks (aborted, etc.) visuell differenziert darstellen.

Type Guards für Stream-Chunks ergänzen, um any vollständig zu vermeiden
