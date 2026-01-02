"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { AddButton } from "@/ui/AddButton";
import { AgentCreateModal } from "@/features/agents/AgentCreateModal";
import type { Agent } from "@/models/agent";
import type { StoredItem } from "@/storage/storage";
import { loadAgents, saveAgent } from "@/features/agents/agents.storage";
import { Card } from "@/ui/Card";
import { AgentsList } from "@/features/agents/AgentsList";

export default function AgentsPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [agents, setAgents] = useState<Array<StoredItem<Agent>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const items = await loadAgents();
        if (!cancelled) setAgents(items);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load agents.";
        if (!cancelled) setLoadError(msg);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddAgent = () => {
    setIsCreateOpen(true);
  };

  const handleClose = () => {
    setIsCreateOpen(false);
  };

  const handleSave = async (agent: Agent) => {
    try {
      // save agent
      const stored = await saveAgent(agent);
      console.log("Agent saved:", stored);
      setIsCreateOpen(false);
      // update list
      const items = await loadAgents();
      setAgents(items);
    } catch (error) {
      console.error("Failed to save agent:", error);
      // später: Toast / Error-State
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <AddButton onClick={handleAddAgent} ariaLabel="Create new agent" />
      </div>

      <div className={styles.listArea}>
        {isLoading && <div>Loading...</div>}
        {loadError && <div className="formError">{loadError}</div>}

        {!isLoading && !loadError && agents.length === 0 && (
          <div>No agents yet.</div>
        )}

        {!isLoading && !loadError && agents.length > 0 && (
          <div className={styles.grid}>
            <AgentsList agents={agents} />
          </div>
        )}
      </div>

      <AgentCreateModal
        isOpen={isCreateOpen}
        onClose={handleClose}
        onSave={handleSave}
      />
    </div>
  );
}
