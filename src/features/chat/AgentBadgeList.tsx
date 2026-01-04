"use client";
import type { Agent, AgentRef } from "@/models/agent";
import type { StoredItem } from "@/storage/storage";
import { AgentBadge } from "@/ui/AgentBadge";

type AgentBadgeListProps = {
  agents: Array<StoredItem<Agent>>;
  isLoading: boolean;
  loadError: string | null;
  onSelect: (agent: StoredItem<Agent>) => void;
  selectedAgent: StoredItem<Agent> | null;
};

export function AgentBadgeList({
  agents,
  isLoading,
  loadError,
  onSelect,
  selectedAgent,
}: AgentBadgeListProps) {
  if (isLoading) return <div>Loading...</div>;
  if (loadError) return <div className="formError">{loadError}</div>;
  if (agents.length === 0) return <div>No agents yet.</div>;
  return (
    <div className="agentBadges">
      {agents.map((agent) => {
        const ref: AgentRef = {
          agent_id: agent.id,
          container: agent.container,
          name: agent.name,
        };

        const isSelected = selectedAgent?.id === agent.id;
        return (
          <AgentBadge
            key={`${agent.container}::${agent.id}`}
            agentRef={ref}
            onClick={() => onSelect(agent)}
            selected={isSelected}
          />
        );
      })}
    </div>
  );
}
