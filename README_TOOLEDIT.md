Hier ist die haargenaue Schritt-für-Schritt-Zusammenfassung (für mich selbst), in exakt der Reihenfolge, wie wir die Editierbarkeit für Agents umgesetzt haben – so, dass ich später das Gleiche für ToolSchemas nachbauen kann.

Zielbild

Create bleibt unangetastet (Create-Modal + Plus-Button funktionieren weiter wie zuvor).

Edit ist ein separates Modal (kein Vermischen von Create/Edit-Flows).

Klick auf Card öffnet Edit-Modal vorbelegt.

Save überschreibt den Datensatz in Cosmos via PUT (Upsert) und refresh’t die Liste.

Schrittfolge Agents Edit (exakte Reihenfolge + Inhalt) 0) Ausgangslage

Page lädt Items via loadAgents() und rendert AgentsList.

Create-Flow existiert über AgentCreateModal + saveAgent().

1. AgentEditModal anlegen (separat, analog zu AgentCreateModal)

Neues Component AgentEditModal erstellt, analog zu AgentCreateModal (gleiche Felder/UI-Struktur).

Form-State im Edit-Modal per useState(agent?.field ?? default) initialisiert.

Kein Normalize/Validate (MVP).

Wichtige Implikation:

useState(initial) übernimmt Werte nur beim Mount, nicht bei späteren Prop-Änderungen.

2. AgentsList klickbar machen (ohne DOM-Lesen, item-basiert)

AgentsList um Prop erweitert: onOpen(agent: StoredItem<Agent>).

In der Card: onClick={() => onOpen(agent)} verdrahtet.

Dadurch wird die Logik weiterhin state-getrieben (vollständiges Item wird übergeben), nicht via data-id aus DOM.

3. AgentsPage minimal um Edit-State erweitern

In AgentsPage zwei States ergänzt:

isEditOpen: boolean

selectedAgent: StoredItem<Agent> | null

Handler ergänzt:

handleOpenEdit(agent) setzt selectedAgent und isEditOpen(true)

AgentsList bekommt onOpen={handleOpenEdit} (damit compile error weg ist).

4. Edit-Modal in AgentsPage rendern + korrektes Öffnen/Schließen

AgentEditModal in AgentsPage gerendert.

onClose muss echte Close-Logik bekommen, sonst funktioniert Overlay-Klick („ins Leere klicken“) nicht mehr.

handleCloseEdit() setzt isEditOpen(false) und selectedAgent(null).

Kritischer Fix für Vorbelegung (ohne useEffect):

Damit initiale useState(agent?.name ?? "") wirklich greift, darf das Modal nicht mounten, solange agent=null ist.

Deshalb wird das Edit-Modal nur gerendert, wenn isEditOpen && selectedAgent:

{isEditOpen && selectedAgent && (
<AgentEditModal ... agent={selectedAgent} ... />
)}

Damit mountet das Modal erst, wenn ein Agent vorhanden ist → Vorbelegung funktioniert.

(Alternative wäre key/remount oder useEffect gewesen; wir haben uns für bedingtes Rendern entschieden.)

5. Backend: PUT-Operation in der generischen API-Route ergänzen

In src/app/api/storage/[container]/route.ts eine PUT-Methode ergänzt.

Verhalten:

erwartet body.id

setzt serverseitig partitionKey und container

schreibt via container.items.upsert(item) (überschreibt / erstellt)

Damit existiert jetzt eine generische Update-Fähigkeit für alle Container.

6. Client-Storage: generische PUT-Funktion ergänzen

In src/storage/storage.ts ergänzt:

updateItemInContainer(container, item: StoredItem<T>) → fetch(..., method: "PUT")

analog zu saveItemToContainer (POST) und loadItems (GET)

7. Feature-Wrapper Agents: updateAgent ergänzen

In src/features/agents/agents.storage.ts ergänzt:

updateAgent(agent: StoredItem<Agent>) → ruft updateItemInContainer("agents", agent).

Wichtig: Wrapper erwartet bewusst ein StoredItem, damit id sicher enthalten ist.

8. Page-Save: handleSaveEdit implementieren (Merge + Update + Refresh + Close)

In AgentsPage handleSaveEdit(agentId, patch) implementiert.

MVP-Strategie:

Patch (Agent) wird in selectedAgent gemerged, wobei id/partitionKey/container defensiv erhalten bleiben.

await updateAgent(mergedStoredItem)

danach schließen (isEditOpen=false, selectedAgent=null)

Liste refresh (loadAgents() → setAgents(items))

9. Modal-Save verdrahten

AgentEditModal bekommt in der Page onSave={handleSaveEdit}.

Save-Button im Modal ruft onSave(agent.id, updatedAgent) auf.

Damit ist der Flow end-to-end: Card-Klick → Modal vorbefüllt → Save → Cosmos PUT → Liste aktualisiert.

Zusatzinfos für ToolSchemas (Übertragung / Wiederverwendung)

Es existiert bereits ein ToolSchema Create-Modal (größer), aktuell auf der Servers-Page im Einsatz.

Für Edit gibt es zwei realistische Wege (MVP-orientiert):

Copy: Create-Modal duplizieren zu ToolSchemaEditModal (analog zu Agent-Ansatz: Create bleibt unverändert, Edit separat).

Reuse: Dasselbe Modal sowohl für Create als auch Edit nutzen (mit initialValues/mode).
Vorteil: weniger Code-Duplizierung. Nachteil: mehr Refactor-Risiko, wenn das Create-Modal aktuell stark „create-spezifisch“ ist.

Wichtige Vereinfachung bei ToolSchemas laut deiner Zusatzinfo:

Edit-Zwilling wird nicht auf derselben Seite wie das Create-Modal verwendet → State-Wiring wird einfacher (keine parallelen Modals auf einer Page nötig).

Da PUT (API + Storage) jetzt existiert, sind bei ToolSchemas die „Schichten“ bereits vorbereitet:

Route PUT ✅

updateItemInContainer ✅

Es fehlt dann nur:

toolschemas.storage.ts: updateToolSchema(storedItem)

Page-Wiring (selected + open + conditional render)

Edit-Modal (copy oder reuse)

Save-Handler (merge + update + refresh + close)
