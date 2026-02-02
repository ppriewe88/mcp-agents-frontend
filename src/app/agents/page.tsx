"use client";

import { useState, useEffect, useMemo } from "react";
import { AddButton } from "@/ui/AddButton";
import { ListArea } from "@/ui/ListArea";
import { ListAreaHalf } from "@/ui/ListAreaHalf";
import { AgentCreateOrEditModal } from "@/features/agents/AgentCreateOrEditModal";
import type { Agent, AgentRef } from "@/models/agent";
import type { StoredItem } from "@/storage/operations";
import { loadAgents, saveAgent, updateAgent } from "@/features/agents/agents.storage";
import type { ToolSchema, ToolSchemaRef } from "@/models/toolSchema";
import { loadToolSchemas } from "@/features/tools/toolschemas.storage";
import { AgentsList } from "@/features/agents/AgentsList";
import { OrchestratorAgentsList } from "@/features/agents/OrchestratorAgentsList";
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

    // Collect tools from the agent itself
    const toolIds = new Set(agent?.toolSchemas?.map((t) => t.tool_id) ?? []);

    // If orchestrator, also collect tools from subagents
    if (agent?.isOrchestrator && agent.subAgents) {
      agent.subAgents.forEach((subAgentRef) => {
        const subAgent = agents.find((a) => a.id === subAgentRef.agent_id);
        subAgent?.toolSchemas?.forEach((t) => toolIds.add(t.tool_id));
      });
    }

    return toolIds;
  }, [hoveredAgentId, agents]);

  const highlightedAgentIds = useMemo(() => {
    if (!hoveredAgentId) return new Set<string>();
    const agent = agents.find((a) => a.id === hoveredAgentId);
    // Highlight subagents when hovering over orchestrator
    return new Set(agent?.subAgents?.map((a) => a.agent_id) ?? []);
  }, [hoveredAgentId, agents]);

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
    setModalMode("subagent");
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
    setModalMode(agent.isOrchestrator ? "orchestrator" : "subagent");
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

  // handling dragging of subagents onto orchestrator agents
  const handleDropAgent = async (orchestrator: StoredItem<Agent>, agentRef: AgentRef) => {
    try {
      const existing = orchestrator.subAgents ?? [];

      // Prevent duplicate assignment
      const alreadyAssigned = existing.some((a) => a.agent_id === agentRef.agent_id && a.container === agentRef.container);
      if (alreadyAssigned) return;

      const merged: StoredItem<Agent> = {
        ...orchestrator,
        subAgents: [...existing, agentRef],
        id: orchestrator.id,
        partitionKey: orchestrator.partitionKey,
        container: orchestrator.container
      };

      await updateAgent(merged);

      const items = await loadAgents();
      setAgents(items);
    } catch (e) {
      console.error("Failed to assign subagent to orchestrator:", e);
    }
  };

  // ################################################################################ RENDER
  return (
    <>
      <div className="container">
        <AddButton onClick={handleAddOrchestratorAgent} ariaLabel="Create new orchestrator agent" />
        <ListArea title="Agent Configurations">
          <OrchestratorAgentsList
            isLoading={isLoading}
            loadError={loadError}
            agents={orchestratorAgents}
            hoveredAgentId={hoveredAgentId}
            highlightedAgentIds={highlightedAgentIds}
            // handlers
            onOpen={handleOpenAgentEdit}
            onDropToolSchema={handleDropToolSchema}
            onDropAgent={handleDropAgent}
            onAgentHover={(agentId) => setHoveredAgentId(agentId)}
          />
        </ListArea>

        <AddButton onClick={handleAddSubagent} ariaLabel="Create new subagent" />
        <ListArea title="Subagent Configurations">
          <AgentsList
            isLoading={isLoading}
            loadError={loadError}
            agents={subAgents}
            hoveredAgentId={hoveredAgentId}
            highlightedAgentIds={highlightedAgentIds}
            // handlers
            onOpen={handleOpenAgentEdit}
            onDropToolSchema={handleDropToolSchema}
            onAgentHover={(agentId) => setHoveredAgentId(agentId)}
          />
        </ListArea>

        {isModalOpen && <AgentCreateOrEditModal key={selectedAgent?.id ?? "create"} isOpen={true} initialAgent={selectedAgent} modalMode={modalMode} availableAgents={subAgents} onClose={handleCloseModal} onSubmit={handleSubmitCreateOrEdit} />}

        <ListArea title="Registered MCP-Tools">
          <DragToolSchemasList tools={tools} isLoading={isLoading} loadError={loadError} highlightedToolIds={highlightedToolIds} hoveredToolId={hoveredToolId} onToolHover={(toolId) => setHoveredToolId(toolId)} />
        </ListArea>
      </div>
    </>
  );
}
