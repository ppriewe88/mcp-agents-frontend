"use client";
import type { Agent } from "@/models/agent";
import type { StoredItem } from "@/storage/storage";
import { Card } from "@/ui/Card";
import type { ToolSchemaRef } from "@/models/toolSchema";

type AgentsListProps = {
  agents: Array<StoredItem<Agent>>;
  isLoading: boolean;
  loadError: string | null;
  onOpen: (agent: StoredItem<Agent>) => void;
  onDropToolSchema: (agent: StoredItem<Agent>, toolRef: ToolSchemaRef) => void;
};

const TOOL_REF_MIME = "application/x-mcp-toolschema-ref";

export function AgentsList({
  agents,
  isLoading,
  loadError,
  onOpen,
  onDropToolSchema,
}: AgentsListProps) {
  if (isLoading) return <div>Loading...</div>;
  if (loadError) return <div className="formError">{loadError}</div>;
  if (agents.length === 0) return <div>No agents yet.</div>;
  return (
    <div className="grid">
      {agents.map((agent) => (
        <Card
          key={agent.id}
          dataId={agent.id}
          dataContainer={agent.container}
          title={agent.name}
          variant="agent"
          onClick={() => onOpen(agent)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();

            const raw = e.dataTransfer.getData(TOOL_REF_MIME);
            if (!raw) return;

            try {
              const toolRef = JSON.parse(raw) as ToolSchemaRef;
              if (!toolRef?.tool_id) return;

              onDropToolSchema(agent, toolRef);
            } catch {
              // ungültiges JSON -> ignorieren
              return;
            }
          }}
        >
          <div>
            <strong>Description</strong>
            <div className="textClamp">{agent.description}</div>
          </div>

          <div>
            <strong>Direct answers allowed:</strong>{" "}
            {agent.directAnswersAllowed ? "Yes" : "No"}
          </div>

          <div>
            <strong>Only one model call:</strong>{" "}
            {agent.onlyOneModelCall ? "Yes" : "No"}
          </div>

          <div>
            <strong>Max toolcalls:</strong>{" "}
            {agent.maxToolcalls !== undefined
              ? agent.maxToolcalls
              : "Unlimited"}
          </div>

          <div>
            <strong>Assigned tools:</strong> {agent.toolSchemas?.length ?? 0}
          </div>
        </Card>
      ))}
    </div>
  );
}
