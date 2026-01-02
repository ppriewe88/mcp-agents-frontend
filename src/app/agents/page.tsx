"use client";

import styles from "./page.module.css";
import { useState, useEffect } from "react";
import { AddButton } from "@/ui/AddButton";
import { AgentCreateOrEditModal } from "@/features/agents/AgentCreateOrEditModal";
import type { Agent } from "@/models/agent";
import type { StoredItem } from "@/storage/storage";
import {
  loadAgents,
  saveAgent,
  updateAgent,
} from "@/features/agents/agents.storage";
import { AgentsList } from "@/features/agents/AgentsList";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Array<StoredItem<Agent>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAgent, setModalAgent] = useState<StoredItem<Agent> | null>(null);

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
    setModalAgent(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (agent: StoredItem<Agent>) => {
    setModalAgent(agent);
    setIsModalOpen(true);
  };

  const handleSubmitCreateOrEdit = async (agent: Agent) => {
    try {
      if (modalAgent === null) {
        await saveAgent(agent);
      } else {
        const merged: StoredItem<Agent> = {
          ...modalAgent,
          ...agent,
          id: modalAgent.id,
          partitionKey: modalAgent.partitionKey,
          container: modalAgent.container,
        };

        await updateAgent(merged);
      }

      setIsModalOpen(false);
      setModalAgent(null);

      const items = await loadAgents();
      setAgents(items);
    } catch (e) {
      console.error("Failed to create agent:", e);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalAgent(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <AddButton onClick={handleAddAgent} ariaLabel="Create new agent" />
      </div>

      <div className={styles.listArea}>
        <AgentsList
          agents={agents}
          isLoading={isLoading}
          loadError={loadError}
          onOpen={handleOpenEdit}
        />
      </div>

      {isModalOpen && (
        <AgentCreateOrEditModal
          key={modalAgent?.id ?? "create"}
          isOpen={true}
          initialAgent={modalAgent}
          onClose={handleCloseModal}
          onSubmit={handleSubmitCreateOrEdit}
        />
      )}
    </div>
  );
}
