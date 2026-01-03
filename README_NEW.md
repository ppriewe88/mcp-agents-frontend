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

Aktuelle Struktur (relevant)
src/
├─ app/
│ ├─ agents/ // Agents-Verwaltung
│ ├─ servers/ // MCP-Server-Verwaltung
│ ├─ tools/ // ToolSchemas-Verwaltung
│ ├─ api/
│ │ └─ storage/[container]/route.ts // generische Cosmos-API
│ ├─ layout.tsx
│ └─ page.tsx // Startseite
│
├─ features/
│ ├─ agents/ // Agent UI + Storage-Wrapper
│ ├─ servers/ // Server UI + Storage + Runtime-Tools
│ └─ tools/
│ ├─ ToolSchemaCreateOrEditModal.tsx
│ ├─ ToolSchemasList.tsx
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
├─ Modal.tsx
├─ Card.tsx
└─ weitere UI-Bausteine

3. Architekturprinzipien (bindend)
   3.1 UI / Feature-Trennung

ui/

rein visuelle, wiederverwendbare Komponenten

keine Fachlogik

keine Persistenz

features/

fachliche Logik je Domäne

Page-nahe Komponenten (Listen, Modals)

orchestrieren UI + Storage

jede Domäne kapselt ihre Storage-Wrapper selbst

app/\*/page.tsx

Orchestrierungsebene

hält State (selectedItem, isModalOpen, Listen)

entscheidet über Create / Edit / Save / Refresh

4. Persistenzarchitektur (Cosmos DB)
   4.1 Grundprinzip

Cosmos-Zugriff ausschließlich serverseitig

Client kommuniziert nur über Next.js API Routes

eine generische API-Route für alle Container

/api/storage/[container]

4.2 API-Operationen
HTTP Zweck Cosmos
GET Load all items query
POST Create create
PUT Update / Upsert upsert

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

➡ Jedes Objekt kennt seine Persistenz-Metadaten.

4.4 Feature-spezifische Wrapper

agents.storage.ts

toolschemas.storage.ts

servers.storage.ts

➡ Pages sprechen nur mit Feature-Wrappern.

5. Card-Konzept (bindend)
   type CardProps = {
   title: string;
   dataId: string;
   dataContainer: string;
   children?: ReactNode;
   onClick?: () => void;
   };

dataContainer nur für Debugging

Aktionen arbeiten immer mit vollständigen Items im State

Card-Klick → onOpen(storedItem)

6. Fachliche Domänen
   6.1 Agents

Page: /agents

Persistenz: Cosmos (agents)

Status:

Create ✔

List ✔

Edit ✔ (PUT-Flow)

Tool-Zuweisung ❌ (geplant)

Edit-Flow:

Card-Klick → StoredItem in State

Edit-Modal nur gemountet, wenn Item existiert

Save: Patch → Merge → updateAgent → Reload

6.2 MCP-Server

Page: /servers

Persistenz: Cosmos (servers)

Runtime-Daten: Tools aus MCP-Backend

Besonderheit:

Mischung aus persistierten Servern

und nicht persistierten Runtime-Tools

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

7. ToolSchema-Create & Edit (aktueller Stand)
   Einheitliches Modal (neu, bindend)

ToolSchemaCreateOrEditModal

ersetzt ToolRegisterModal (Create)

ersetzt ToolEditModal (Edit)

unterscheidet Modus über:

initialToolSchema?: StoredItem<ToolSchema> | null

Verantwortlichkeiten

Modal

UI-only

baut ToolSchema

normalizeToolSchema + validateToolSchema

ruft ausschließlich onSubmit(schema)

Page

entscheidet:

Create → saveToolSchema

Edit → Merge + updateToolSchema

schließt Modal

reloadet Liste

➡ exakt gleiches Muster wie bei Agents.

8. Edit- & Modal-Konzept (bindend)

ein Modal für Create + Edit

kein useEffect zur Initialisierung

initiale Werte nur über useState(initial)

korrektes Remounting via:

key={storedItem?.id ?? "create"}

9. Datenflüsse
   Lesen

Page → Feature-Storage → Client-Storage → API → Cosmos

Create

Modal → Page(onSubmit) → saveXxx → POST → Cosmos → Reload

Edit

Card → Page-State → Modal → Patch → Merge → updateXxx → PUT → Reload

10. Mentales Arbeitsmodell (bindend)

schrittweise

minimal-invasiv

keine impliziten Feature-Sprünge

erst saubere Datenflüsse

dann UI-Wiring

Persistenzänderungen vor neuen Features

11. Aktueller Status

ToolSchema Create ✔

ToolSchema Edit ✔

Modals konsolidiert ✔

Alt-Code bereinigt ✔

Utilities ausgelagert ✔

Typisierung lint-sicher ✔

12. Nächste logische Schritte

Delete-Flow (DELETE API + Wrapper + Page)

Tool-Zuweisung zu Agents

Anzeige zugewiesener Tools auf Agent-Cards

UX-Verbesserungen (Confirm, Toasts, Optimistic Updates)

Status-Fazit:
Das Projekt besitzt jetzt eine konsistente, saubere und skalierbare Verwaltungsarchitektur.
Neue Features lassen sich mechanisch nach etablierten Mustern ergänzen, ohne Refactor-Zwang.

---

Ergänzung als Nachtrag zu oben stehender Zusammenfassung:

1. Status seit der letzten Zusammenfassung

Kurzantwort:
Ja, korrekt: seit der letzten Zusammenfassung wurde funktional noch nichts am Feature-Set geändert.

Konkret passiert ist nur:

ui/Card wurde technisch erweitert, sodass sie optional drag/drop-fähig ist
(neue Props: draggable, onDragStart, onDragOver, onDrop, Default = aus)

Nicht passiert seitdem:

keine Page-Änderungen (AgentsPage, ToolsPage, etc.)

keine neue Liste gebaut

keine Drag/Drop-Logik implementiert

keine Agent-Tool-Verknüpfung

keine Chat-Page

keine Backend-Endpunkte

➡️ Die letzte Zusammenfassung ist also inhaltlich weiterhin korrekt, nur mit einem Zusatz:

Die Card-Komponente ist jetzt technisch auf Drag & Drop vorbereitet.

2. Neue Zusammenfassung des Gesprächs seit der letzten Zusammenfassung

Diese Zusammenfassung kannst du ebenfalls 1:1 für den nächsten Chat verwenden.

Ergänzende Zusammenfassung – Stand nach letzter Architektur-Zusammenfassung
Ausgangslage

Das Projekt besitzt eine stabile Admin-Architektur für:

Agents

MCP-Server

persistierte ToolSchemas

ToolSchema Create/Edit ist konsolidiert (ToolSchemaCreateOrEditModal)

Datenflüsse und Persistenzmuster sind konsistent und bewährt

Vorhaben 1: Agent ↔ ToolSchema-Verknüpfung (UI + Persistenz)
Zielbild

Agents sollen mit persistierten ToolSchemas verknüpft werden.

ToolSchemas können visuell einem Agent zugewiesen werden

Die Zuweisung erfolgt über Drag & Drop

Die Verknüpfung wird persistiert im Agent-Dokument

Technischer Stand (bereits erledigt)

ui/Card wurde erweitert:

unterstützt optional Drag & Drop

Default-Verhalten bleibt unverändert (nicht draggable)

Keine bestehende Page wurde dadurch beeinflusst

Geplante UI-Struktur

1. Neue ToolSchema-Liste für die AgentsPage

Es wird nicht die bestehende ToolSchemasList wiederverwendet.

Stattdessen:

Neue Komponente (z. B. ToolSchemaPickerList)

Einsatz nur auf der AgentsPage

Darstellung:

Mini-Cards

stark reduziert (z. B. nur name_for_llm + server_url)

keine Args, keine Beschreibungen

Eigenschaften:

alle Cards draggable

Cards bleiben klickbar

Klick öffnet das bestehende ToolSchemaCreateOrEditModal (Edit)

➡️ Zweck: Auswahl- und Zuordnungsoberfläche, nicht Verwaltung.

2. Agent-Cards als Drop-Ziel

Agent-Cards werden droppable

Beim Drop eines ToolSchemas auf einen Agent:

ein Tool-Referenz-Tripel wird im Agent gespeichert

Geplantes Referenzformat im Agent:

{
tool_id: string; // ToolSchema.id
container: string; // z. B. "toolschemas"
name_for_llm: string; // für UI
server_url: string; // für UI / Kontext
}

id + container dienen der späteren Auflösung aus Cosmos

name_for_llm + server_url sind rein UI-/Kontextdaten

Persistenz:

Merge in bestehendes StoredItem<Agent>

updateAgent(merged)

Reload der Agents-Liste

3. Anzeige der Tools am Agent

Agent-Cards (und Agent-Edit-Modal) zeigen eine einfache Liste der zugewiesenen Tools

Darstellung zunächst minimal (Text oder Mini-Badge)

Keine komplexe Interaktion im MVP

Vorhaben 2: Agent-basierter Chat-Kontext (Frontend + Backend)
Zielbild

Ein neuer Chat-Bereich soll entstehen, der:

einen Agent auswählbar macht

automatisch Agent + zugewiesene ToolSchemas als Kontext lädt

diesen Kontext gesammelt an ein LLM weiterreicht

Architekturidee (bewusst simpel)
Frontend (Chat-Page)

Beim Betreten der Chat-Page:

loadAgents()

loadToolSchemas()

beide Ergebnisse werden einmalig geladen

Daten werden im Client gecached (Maps / State)

Agent-Auswahl:

User wählt einen Agent

Frontend:

liest Tool-Referenzen aus dem Agent

resolved die zugehörigen ToolSchemas aus dem Cache

Ergebnis:

selectedAgent

selectedToolSchemas

➡️ Kein erneutes Nachladen pro Nachricht, nur beim Wechsel des Agenten.

Kontextbildung für LLM

Aus selectedAgent + selectedToolSchemas wird ein einheitlicher Kontextblock gebaut

Dieser Block wird gemeinsam mit der User-Nachricht an das Backend gesendet

Beispiel (konzeptionell):

{
"agent": { ... },
"toolschemas": [ ... ],
"user_message": "..."
}

Backend (geplant)

Neuer Endpoint, z. B.:

POST /api/chat

Erwartet:

Agent-Daten

ToolSchemas

User-Text

Baut daraus den finalen Prompt / Kontext für das LLM

Aktueller Arbeitsstand

Architektur klar

UI-Bausteine vorbereitet

Keine halbfertigen Implementierungen

Nächster konkreter Schritt:
ToolSchemaPickerList bauen und auf AgentsPage integrieren

Nächste konkrete Schritte (in Reihenfolge)

Neue ToolSchemaPickerList (Mini-Cards, draggable, klickbar)

Drop-Logik auf Agent-Cards

Tool-Referenzen im Agent persistieren

Anzeige der Tools am Agent

Danach: Chat-Page + Kontext-Cache + Backend-Endpoint

Wenn du im nächsten Chat einsteigst, kannst du direkt sagen:

„Wir machen weiter bei Schritt 1: ToolSchemaPickerList bauen.“

Dann sind wir sofort wieder on track, ohne Wiederholung.
