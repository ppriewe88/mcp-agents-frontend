"use client";

import type { Agent } from "@/models/agent";
import type { StoredItem } from "@/storage/storage";
import { Card } from "@/ui/Card";

type AgentsListProps = {
  agents: Array<StoredItem<Agent>>;
};

export function AgentsList({ agents }: AgentsListProps) {
  return (
    <>
      {agents.map((agent) => (
        <Card key={agent.id} title={agent.name}>
          <div>
            <strong>Description</strong>
            <div>{agent.description}</div>
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
    </>
  );
}
