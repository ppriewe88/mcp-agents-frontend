"use client";

import { useState, useEffect } from "react";
import { AddButton } from "@/ui/AddButton";
import { ListArea } from "@/ui/ListArea";
import { ListAreaHalf } from "@/ui/ListAreaHalf";
import { AgentCreateOrEditModal } from "@/features/agents/AgentCreateOrEditModal";
import type { Agent } from "@/models/agent";
import type { StoredItem } from "@/storage/operations";
import {
  loadAgents,
  saveAgent,
  updateAgent,
} from "@/features/agents/agents.storage";
import type { ToolSchema, ToolSchemaRef } from "@/models/toolSchema";
import { loadToolSchemas } from "@/features/tools/toolschemas.storage";
import { AgentsList } from "@/features/agents/AgentsList";
import { DragToolSchemasList } from "@/features/tools/ToolSchemasDragList";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Array<StoredItem<Agent>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalAgent, setModalAgent] = useState<StoredItem<Agent> | null>(null);
  const [tools, setTools] = useState<Array<StoredItem<ToolSchema>>>([]);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const agents = await loadAgents();
        if (!cancelled) setAgents(agents);
        const toolSchemas = await loadToolSchemas();
        if (!cancelled) setTools(toolSchemas);
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

  const handleOpenAgentEdit = (agent: StoredItem<Agent>) => {
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

  const handleDropToolSchema = async (
    agent: StoredItem<Agent>,
    toolRef: ToolSchemaRef
  ) => {
    try {
      const existing = agent.toolSchemas ?? [];

      const alreadyAssigned = existing.some(
        (t) =>
          t.tool_id === toolRef.tool_id && t.container === toolRef.container
      );
      if (alreadyAssigned) return;

      const merged: StoredItem<Agent> = {
        ...agent,
        toolSchemas: [...existing, toolRef],
        id: agent.id,
        partitionKey: agent.partitionKey,
        container: agent.container,
      };

      await updateAgent(merged);

      const items = await loadAgents();
      setAgents(items);
    } catch (e) {
      console.error("Failed to assign tool to agent:", e);
    }
  };

  return (
    <div className="container">
      <AddButton onClick={handleAddAgent} ariaLabel="Create new agent" />

      <ListArea title="Agent Configurations">
        <AgentsList
          agents={agents}
          isLoading={isLoading}
          loadError={loadError}
          onOpen={handleOpenAgentEdit}
          onDropToolSchema={handleDropToolSchema}
        />
      </ListArea>

      {isModalOpen && (
        <AgentCreateOrEditModal
          key={modalAgent?.id ?? "create"}
          isOpen={true}
          initialAgent={modalAgent}
          onClose={handleCloseModal}
          onSubmit={handleSubmitCreateOrEdit}
        />
      )}

      <div className="halfRowWrap">
        <ListAreaHalf title="Registered MCP-Tools">
          <DragToolSchemasList
            tools={tools}
            isLoading={isLoading}
            loadError={loadError}
          />
        </ListAreaHalf>

        <ListAreaHalf title="Registered Agents as Tools">
          PLACEHOLDER FOR AGENTS AS TOOLS CARDS
        </ListAreaHalf>
      </div>
    </div>
  );
}
