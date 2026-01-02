"use client";
import styles from "@/app/agents/page.module.css";
import type { Agent } from "@/models/agent";
import type { StoredItem } from "@/storage/storage";
import { Card } from "@/ui/Card";

type AgentsListProps = {
  agents: Array<StoredItem<Agent>>;
  isLoading: boolean;
  loadError: string | null;
};

export function AgentsList({ agents, isLoading, loadError }: AgentsListProps) {
  if (isLoading) return <div>Loading...</div>;
  if (loadError) return <div className="formError">{loadError}</div>;
  if (agents.length === 0) return <div>No agents yet.</div>;
  return (
    <div className={styles.grid}>
      {agents.map((agent) => (
        <Card key={agent.id} dataId={agent.id} title={agent.name}>
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
    </div>
  );
}
