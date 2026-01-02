1. Projektüberblick

Das Projekt ist ein webbasiertes Verwaltungssystem zur Konfiguration und Verwaltung von:

Agents

MCP-Servern

persistierten Tools (ToolSchemas)

Es dient als Administrations- und Konfigurationsoberfläche für ein agentenbasiertes LLM-/MCP-System.
Der Fokus liegt auf klaren Datenflüssen, sauberer Schichtung und minimal-invasiver Erweiterbarkeit.

2. Projektstruktur (Ist-Zustand)

Technologie

Frontend: Next.js (App Router)

Sprache: TypeScript

Persistenz: Azure Cosmos DB (serverseitig)

Root: src/

src/
├─ app/
│ ├─ agents/ // Agents-Verwaltung (Create + Edit)
│ ├─ servers/ // MCP-Server-Verwaltung
│ ├─ tools/ // ToolSchemas-Verwaltung (Create + Edit)
│ ├─ api/
│ │ └─ storage/[container]/route.ts // generische Cosmos-API
│ ├─ layout.tsx
│ └─ page.tsx // Startseite
│
├─ features/
│ ├─ agents/ // Agent-spezifische UI + Storage-Wrapper
│ ├─ servers/ // Server-spezifische UI + Storage + Runtime-Tools
│ └─ tools/ // ToolSchema UI + Storage
│
├─ models/ // Reine Datenmodelle (ohne UI / Persistenz)
│
├─ storage/
│ ├─ cosmos.ts // Serverseitige Cosmos-Client-Konfiguration
│ └─ storage.ts // Generischer Client-Storage (GET/POST/PUT)
│
└─ ui/ // Reine, wiederverwendbare UI-Komponenten

3. Architekturprinzipien (bindend)
   3.1 UI / Feature-Trennung

ui/

ausschließlich visuelle, wiederverwendbare Komponenten

keine Fachlogik

keine Persistenz

Beispiele: Card, Modal, Button, TextInput

features/\*

fachliche Logik je Domäne

Page-nahe Komponenten (Listen, Modals)

orchestrieren UI + Storage

jede Domäne kapselt ihre Storage-Wrapper selbst

app/\*/page.tsx

Orchestrierungsebene

hält State (selectedItem, isEditOpen, Listen)

entscheidet über Create / Edit / Save / Refresh

4. Persistenzarchitektur (Cosmos DB)
   4.1 Grundprinzip

Cosmos-Zugriff ausschließlich serverseitig

Client kommuniziert nur über Next.js API Routes

eine generische API-Route für alle Container

/api/storage/[container]

4.2 API-Operationen (serverseitig)
HTTP Zweck Cosmos-Operation
GET Laden aller Items container.items.query(...)
POST Create container.items.create(...)
PUT Update / Upsert container.items.upsert(...)

Wichtig

container und partitionKey werden serverseitig gesetzt

Client darf diese nicht manipulieren

4.3 Client-Storage (storage/storage.ts)

Generischer, domänenunabhängiger Zugriff:

saveItemToContainer(container, item) → POST

loadItems(container) → GET

updateItemInContainer(container, storedItem) → PUT

Zentraler Typ

type StoredItem<T> = T & {
id: string;
partitionKey: string;
container: string;
};

➡ Jedes Objekt „weiß“, woher es kommt (Container, Partition, ID).

4.4 Feature-spezifische Storage-Wrapper

Jede Domäne kapselt den generischen Storage:

agents.storage.ts

saveAgent

loadAgents

updateAgent

toolschemas.storage.ts

saveToolSchema

loadToolSchemas

updateToolSchema

servers.storage.ts

analog

➡ Pages arbeiten nur mit Feature-Wrappern, nie direkt mit storage.ts.

5. Card-Konzept (bindend)
   type CardProps = {
   title: string;
   dataId: string;
   dataContainer: string; // Cosmos oder "runtime"
   children?: ReactNode;
   onClick?: () => void;
   };

dataContainer dient nur Debugging / DOM-Lesbarkeit

keine Business-Logik liest aus dem DOM

Aktionen arbeiten immer mit vollständigen Items im State

onOpen(item)

Runtime-Daten

z. B. ServerTools

dataContainer = "runtime"

niemals persistiert

6. Fachliche Domänen
   6.1 Agents

Page: /agents

Persistenz: Cosmos (agents)

Modell: models/agent.ts

Funktionalität

Create ✔

List ✔

Edit ✔ (separates Edit-Modal, PUT-Flow)

Tool-Zuweisung ❌ (geplant)

Edit-Flow

Card-Klick → StoredItem<Agent> in State

AgentEditModal wird nur gemountet, wenn Agent existiert

Save:

Patch → Merge → updateAgent → Refresh

6.2 MCP-Server

Page: /servers

Persistenz: Cosmos (servers)

Runtime: Tool-Abfrage aus MCP-Backend

Besonderheit

Mischung aus:

persistierter Server-Konfiguration

nicht persistierten Runtime-Tools

Status: vollständig funktionsfähig

6.3 Tools
6.3.1 Runtime-Tools (ServerTool)

Herkunft: MCP-Server

Modell: models/mcpServerTool.ts

nicht persistiert

6.3.2 Persistierte Tools (ToolSchema)

Page: /tools

Persistenz: Cosmos (toolschemas)

Modell: models/toolSchema.ts

Funktionalität

Registrierung (Create) ✔

Anzeige ✔

Edit ✔ (neu, analog Agents)

7. Tool-Registrierung

Ort: features/tools/ToolRegisterModal.tsx

Zweck

Transformation:

ServerTool → ToolSchema

Explizit gepflegt

Namen (Server ↔ LLM)

Argumente

Typen

Beschreibungen

Defaults

Persistenz

saveToolSchema(...) → POST → Cosmos

8. Edit-Konzept (bindend, bewährt)

Create-Modals bleiben unangetastet

Edit ist immer ein separates Modal

kein Vermischen von Create/Edit

Edit-Modal:

bekommt vollständiges StoredItem<T>

wird nur gemountet, wenn Item existiert

useState(initial) greift zuverlässig

Save:

Patch im Modal

Merge + PUT auf Page-Ebene

Refresh der Liste

Dieses Muster ist 1:1 wiederverwendbar für alle Domänen.

9. Datenflüsse (Lesen / Schreiben / Ändern)
   Lesen
   Page
   → Feature-Storage (loadXxx)
   → Client-Storage (GET)
   → API /api/storage/[container]
   → Cosmos

Create
Modal
→ Feature-Storage (saveXxx)
→ Client-Storage (POST)
→ API
→ Cosmos.create

Edit
Card-Klick
→ Page-State (selectedItem)
→ Edit-Modal
→ Patch
→ Page: Merge
→ Feature-Storage (updateXxx)
→ Client-Storage (PUT)
→ API
→ Cosmos.upsert
→ Refresh

10. Mentales Arbeitsmodell (bindend)

schrittweise

minimal-invasiv

keine impliziten Feature-Sprünge

Reihenfolge

saubere Datenflüsse

klares UI-Wiring

Persistenz-Anpassungen

erst danach neue Features

11. Nächste logische Schritte

Delete-Flow (DELETE Route + Wrapper + Page-Orchestrierung)

Tool-Zuweisung zu Agents

Anzeige zugewiesener Tools auf Agent-Cards

optionale UX-Verbesserungen (Confirmations, Optimistic Updates)

Status:
Das Projekt besitzt nun eine konsistente, skalierbare Verwaltungsarchitektur mit klarer Trennung von UI, Fachlogik und Persistenz.
Neue Features (Edit, Delete, Zuweisungen) lassen sich mechanisch nach etablierten Mustern ergänzen, ohne Refactor-Zwang.
