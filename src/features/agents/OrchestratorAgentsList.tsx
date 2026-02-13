"use client";
import type { Agent, AgentRef } from "@/models/agent";
import type { StoredItem } from "@/storage/operations";
import { Card } from "@/ui/Card";
import type { ToolSchemaRef } from "@/models/toolSchema";

type OrchestratorAgentsListProps = {
  agents: Array<StoredItem<Agent>>;
  isLoading: boolean;
  loadError: string | null;
  onOpen: (agent: StoredItem<Agent>) => void;
  onDropToolSchema: (agent: StoredItem<Agent>, toolRef: ToolSchemaRef) => void;
  onDropAgent: (orchestrator: StoredItem<Agent>, agentRef: AgentRef) => void;
  hoveredAgentId: string | null;
  highlightedAgentIds: Set<string>;
  onAgentHover: (agentId: string | null) => void;
};

const TOOL_REF_MIME = "application/x-mcp-toolschema-ref";
const AGENT_REF_MIME = "application/x-mcp-agent-ref";

export function OrchestratorAgentsList({ agents, isLoading, loadError, onOpen, onDropToolSchema, onDropAgent, hoveredAgentId, highlightedAgentIds, onAgentHover }: OrchestratorAgentsListProps) {
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
          variant={agent.isOrchestrator ? "orchestrator" : "agent"}
          onClick={() => onOpen(agent)}
          isHighlighted={hoveredAgentId === agent.id || highlightedAgentIds.has(agent.id)}
          onMouseEnter={() => onAgentHover(agent.id)}
          onMouseLeave={() => onAgentHover(null)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
          }}
          onDrop={(e) => {
            e.preventDefault();

            // Handle tool drop (existing)
            const toolRaw = e.dataTransfer.getData(TOOL_REF_MIME);
            if (toolRaw) {
              try {
                const toolRef = JSON.parse(toolRaw) as ToolSchemaRef;
                if (toolRef?.tool_id) {
                  onDropToolSchema(agent, toolRef);
                  return;
                }
              } catch {
                // invalid JSON
              }
            }

            // Handle agent drop (NEW - orchestrators only)
            const agentRaw = e.dataTransfer.getData(AGENT_REF_MIME);
            if (agentRaw) {
              try {
                const agentRef = JSON.parse(agentRaw) as AgentRef;
                if (agentRef?.agent_id) {
                  onDropAgent(agent, agentRef);
                }
              } catch {
                // invalid JSON
              }
            }
          }}
        >
          <div>
            <strong>Description</strong>
            <div className="textClamp">{agent.description}</div>
          </div>

          <div>
            <strong>Only one model call:</strong> {agent.onlyOneModelCall ? "Yes" : "No"}
          </div>

          <div>
            <strong>Max toolcalls:</strong> {agent.maxToolcalls !== undefined ? agent.maxToolcalls : "Unlimited"}
          </div>

          <div>
            <strong>Assigned tools:</strong> {agent.toolSchemas?.length ?? 0}
          </div>

          <div>
            <strong>Assigned subagents:</strong> {agent.subAgents?.length ?? 0}
          </div>
        </Card>
      ))}
    </div>
  );
}
