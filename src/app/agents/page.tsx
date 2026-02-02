"use client";

import { useState, useEffect, useMemo } from "react";
import { AddButton } from "@/ui/AddButton";
import { ListArea } from "@/ui/ListArea";
import { ListAreaHalf } from "@/ui/ListAreaHalf";
import { AgentCreateOrEditModal } from "@/features/agents/AgentCreateOrEditModal";
import type { Agent } from "@/models/agent";
import type { StoredItem } from "@/storage/operations";
import { loadAgents, saveAgent, updateAgent } from "@/features/agents/agents.storage";
import type { ToolSchema, ToolSchemaRef } from "@/models/toolSchema";
import { loadToolSchemas } from "@/features/tools/toolschemas.storage";
import { AgentsList } from "@/features/agents/AgentsList";
import { DragToolSchemasList } from "@/features/tools/ToolSchemasDragList";

export default function AgentsPage() {
  // ################################################################################ STATES
  // basic states
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  // agents & modal states
  const [agents, setAgents] = useState<Array<StoredItem<Agent>>>([]);
  const [selectedAgent, setSelectedAgent] = useState<StoredItem<Agent> | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"orchestrator" | "subagent">("subagent");
  // tool states
  const [tools, setTools] = useState<Array<StoredItem<ToolSchema>>>([]);
  // hover effect states (bidirectional)
  const [hoveredAgentId, setHoveredAgentId] = useState<string | null>(null);
  const [hoveredToolId, setHoveredToolId] = useState<string | null>(null);

  // Filtering for render
  const orchestratorAgents = useMemo(() => agents.filter((a) => a.isOrchestrator), [agents]);
  const subAgents = useMemo(() => agents.filter((a) => !a.isOrchestrator), [agents]);

  // ################################################################################ COMPUTEDS
  // Compute highlighted items based on hover state
  const highlightedToolIds = useMemo(() => {
    if (!hoveredAgentId) return new Set<string>();
    const agent = agents.find((a) => a.id === hoveredAgentId);
    return new Set(agent?.toolSchemas?.map((t) => t.tool_id) ?? []);
  }, [hoveredAgentId, agents]);

  const highlightedAgentIds = useMemo(() => {
    if (!hoveredToolId) return new Set<string>();
    // TODO: Once tools have agentRefs, compute agents that use this tool
    // For now: dummy implementation (empty set)
    return new Set<string>();
  }, [hoveredToolId, agents]);

  // ################################################################################ HANDLERS
  // loading agents & tools on mount
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

  const handleAddSubagent = () => {
    setSelectedAgent(null);
    setIsModalOpen(true);
  };

  const handleAddOrchestratorAgent = () => {
    setSelectedAgent(null);
    setModalMode("orchestrator");
    setIsModalOpen(true);
  };

  // handling modal open for creating & editing & closing
  const handleOpenAgentEdit = (agent: StoredItem<Agent>) => {
    setSelectedAgent(agent);
    setIsModalOpen(true);
  };

  const handleSubmitCreateOrEdit = async (agent: Agent) => {
    try {
      if (selectedAgent === null) {
        await saveAgent(agent);
      } else {
        const merged: StoredItem<Agent> = {
          ...selectedAgent,
          ...agent,
          id: selectedAgent.id,
          partitionKey: selectedAgent.partitionKey,
          container: selectedAgent.container
        };

        await updateAgent(merged);
      }

      setIsModalOpen(false);
      setSelectedAgent(null);

      const items = await loadAgents();
      setAgents(items);
    } catch (e) {
      console.error("Failed to create agent:", e);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAgent(null);
  };

  // handling dragging of tools onto agents
  const handleDropToolSchema = async (agent: StoredItem<Agent>, toolRef: ToolSchemaRef) => {
    try {
      const existing = agent.toolSchemas ?? [];

      const alreadyAssigned = existing.some((t) => t.tool_id === toolRef.tool_id && t.container === toolRef.container);
      if (alreadyAssigned) return;

      const merged: StoredItem<Agent> = {
        ...agent,
        toolSchemas: [...existing, toolRef],
        id: agent.id,
        partitionKey: agent.partitionKey,
        container: agent.container
      };

      await updateAgent(merged);

      const items = await loadAgents();
      setAgents(items);
    } catch (e) {
      console.error("Failed to assign tool to agent:", e);
    }
  };

  // ################################################################################ RENDER
  return (
    <>
      <div className="container">
        <AddButton onClick={handleAddSubagent} ariaLabel="Create new orchestrator agent" />
        <ListArea title="Agent Configurations">PLACEHOLDER FOR AGENTS AS TOOLS CARDS</ListArea>

        <AddButton onClick={handleAddSubagent} ariaLabel="Create new subagent" />
        <ListArea title="Subagent Configurations">
          <AgentsList
            isLoading={isLoading}
            loadError={loadError}
            agents={agents}
            hoveredAgentId={hoveredAgentId}
            highlightedAgentIds={highlightedAgentIds}
            // handlers
            onOpen={handleOpenAgentEdit}
            onDropToolSchema={handleDropToolSchema}
            onAgentHover={(agentId) => setHoveredAgentId(agentId)}
          />
        </ListArea>

        {isModalOpen && <AgentCreateOrEditModal key={selectedAgent?.id ?? "create"} isOpen={true} initialAgent={selectedAgent} onClose={handleCloseModal} onSubmit={handleSubmitCreateOrEdit} />}

        <ListArea title="Registered MCP-Tools">
          <DragToolSchemasList tools={tools} isLoading={isLoading} loadError={loadError} highlightedToolIds={highlightedToolIds} hoveredToolId={hoveredToolId} onToolHover={(toolId) => setHoveredToolId(toolId)} />
        </ListArea>
      </div>
    </>
  );
}
