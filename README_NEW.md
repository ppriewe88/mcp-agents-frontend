1. Projektüberblick

Das Projekt ist ein webbasiertes Verwaltungssystem zur Konfiguration und Administration eines agentenbasierten LLM-/MCP-Systems.

Es dient der Verwaltung von:

Agents

MCP-Servern

persistierten Tools (ToolSchemas)

und stellt eine klare, erweiterbare Administrationsoberfläche bereit.

Zentrale Ziele:

saubere Trennung von UI, Fachlogik und Persistenz

explizite, nachvollziehbare Datenflüsse

minimal-invasive Erweiterbarkeit ohne Refactor-Zwang

2. Projektstruktur (Ist-Zustand)
   Technologie

Frontend: Next.js (App Router)

Sprache: TypeScript

Persistenz: Azure Cosmos DB (ausschließlich serverseitig)

Root: src/

Aktuelle Struktur (relevant)
src/
├─ app/
│ ├─ agents/
│ │ ├─ page.tsx
│ │ └─ page.module.css
│ ├─ servers/
│ │ ├─ page.tsx
│ │ └─ page.module.css
│ ├─ tools/
│ │ ├─ page.tsx
│ │ └─ page.module.css
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
├─ Button.tsx
├─ Card.tsx
├─ ListArea.tsx
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

entscheidet über Create / Edit / Save / Reload

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

5. Card-Konzept (bindend)
   type CardProps = {
   title: string;
   dataId: string;
   dataContainer: string;
   children?: ReactNode;
   onClick?: () => void;
   };

dataContainer dient nur Debugging

Aktionen arbeiten immer mit vollständigen StoredItems

Card-Klick → onOpen(storedItem)

6. Fachliche Domänen
   6.1 Agents

Page: /agents
Persistenz: Cosmos (agents)

Status:

Create ✔

List ✔

Edit ✔

Tool-Zuweisung ✔ (neu)

Edit-Flow:

Card-Klick → StoredItem<Agent> in State

Edit-Modal nur gemountet, wenn Item existiert

Save: Patch → Merge → updateAgent → Reload

Tool-Zuweisung (neu)

Agents speichern keine vollständigen ToolSchemas, sondern Referenzen.

Referenztyp:

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

Unterscheidung:

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

8. ToolSchema ↔ Agent-Verknüpfung (neu)
   8.1 UI-Struktur

Auf der AgentsPage existiert eine separate Tool-Liste

Komponente: ToolSchemasDragList

Darstellung: reduzierte Mini-Cards

Zweck: Auswahl & Zuordnung, keine Verwaltung

8.2 Drag & Drop

ToolSchema-Mini-Cards sind draggable

Agent-Cards sind Drop-Ziele

Beim Drop:

ToolSchemaRef wird erzeugt

in bestehendes StoredItem<Agent> gemerged

Persistenz via updateAgent

Reload der Agent-Liste

Duplikate werden verhindert.

8.3 Anzeige & Edit

Agent-Edit-Modal zeigt zugewiesene Tools als ToolBadges

Entfernen von Tools:

lokal im Modal

Persistenz nur bei Save

Modal schließen ohne Save verwirft Änderungen

9. Datenflüsse
   Lesen
   Page → Feature-Storage → Client-Storage → API → Cosmos

Create
Modal → Page(onSubmit) → saveXxx → POST → Cosmos → Reload

Edit
Card → Page-State → Modal → Patch → Merge → updateXxx → PUT → Reload

Tool-Zuweisung
DragToolSchemasList
→ Drag ToolSchemaRef
→ Drop auf Agent-Card
→ Merge in Agent
→ updateAgent
→ Reload

10. Mentales Arbeitsmodell (bindend)

schrittweise

minimal-invasiv

keine impliziten Seiteneffekte

erst saubere Datenflüsse

dann UI-Wiring

Persistenzänderungen vor neuen Features

11. Aktueller Status

Agent Create / Edit ✔

ToolSchema Create / Edit ✔

Drag & Drop Tool-Zuweisung ✔

Persistenz der Tool-Referenzen ✔

Anzeige & Entfernen im Agent-Modal ✔

Architektur konsistent ✔

12. Nächste logische Schritte

Anzeige zugewiesener Tools direkt auf Agent-Cards

visuelles Drag-Over-Feedback

optional: Entfernen direkt aus der Agent-Card

danach: Agent-basierte Chat-Page inkl. Tool-Auflösung

Status-Fazit:
Das Projekt verfügt nun über eine konsistente, skalierbare Administrationsarchitektur inklusive robuster Agent↔ToolSchema-Verknüpfung. Neue Features lassen sich mechanisch und ohne Refactor-Zwang entlang etablierter Muster ergänzen.
