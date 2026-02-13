"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/ui/Modal";
import { TextInput } from "@/ui/TextInput";
import { TextArea } from "@/ui/TextArea";
import { ScrollContainer } from "@/ui/ScrollContainer";
import { Button } from "@/ui/Button";
import { Checkbox } from "@/ui/CheckBox";
import type { Agent, AgentRef } from "@/models/agent";
import { normalizeAgent, validateAgent } from "@/models/agent";
import type { StoredItem } from "@/storage/operations";
import { ToolBadge } from "@/ui/ToolBadge";
import { AgentBadge } from "@/ui/AgentBadge";

type AgentCreateOrEditModalProps = {
  isOpen: boolean;
  initialAgent?: StoredItem<Agent> | null;
  modalMode: "orchestrator" | "subagent";
  availableAgents: Array<StoredItem<Agent>>;
  onClose: () => void;
  onSubmit: (agent: Agent) => void;
};

export function AgentCreateOrEditModal({
  isOpen,
  initialAgent = null,
  modalMode,
  availableAgents,
  onClose,
  onSubmit,
}: AgentCreateOrEditModalProps) {
  const isEdit = Boolean(initialAgent);

  const [assignedTools, setAssignedTools] = useState(
    initialAgent?.toolSchemas ?? []
  );

  const [assignedAgents, setAssignedAgents] = useState<AgentRef[]>(
    initialAgent?.subAgents ?? []
  );

  // initialize state from initialAgent (edit) or defaults (create)
  const [name, setName] = useState(initialAgent?.name ?? "");
  const [description, setDescription] = useState(
    initialAgent?.description ?? ""
  );
  const [systemPrompt, setSystemPrompt] = useState(
    initialAgent?.systemPrompt ?? ""
  );
  const [directAnswerValidationPrompt, setDirectAnswerValidationPrompt] =
    useState(initialAgent?.directAnswerValidationPrompt ?? "");

  const [directAnswerPrompt, setDirectAnswerPrompt] = useState(
    initialAgent?.directAnswerPrompt ?? ""
  );

  const [toolbasedAnswerPrompt, setToolbasedAnswerPrompt] = useState(
    initialAgent?.toolbasedAnswerPrompt ?? ""
  );

  const [maxToolcalls, setMaxToolcalls] = useState<string>(
    initialAgent?.maxToolcalls !== undefined
      ? String(initialAgent.maxToolcalls)
      : ""
  );

  const [onlyOneModelCall, setOnlyOneModelCall] = useState<boolean>(
    initialAgent?.onlyOneModelCall ?? false
  );

  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(() => {
    return (
      name.trim().length > 0 &&
      description.trim().length > 0 &&
      systemPrompt.trim().length > 0
    );
  }, [name, description, systemPrompt]);

  const resetForm = () => {
    setName("");
    setDescription("");
    setSystemPrompt("");
    setDirectAnswerValidationPrompt("");
    setDirectAnswerPrompt("");
    setToolbasedAnswerPrompt("");
    setMaxToolcalls("");
    setOnlyOneModelCall(false);
    setAssignedAgents([]);
    setError(null);
  };

  const handleSave = () => {
    try {
      const parsedMaxToolcalls =
        maxToolcalls.trim().length === 0 ? undefined : Number(maxToolcalls);

      const agent: Agent = {
        name,
        description,
        systemPrompt,
        directAnswerValidationPrompt,
        directAnswerPrompt: directAnswerPrompt.trim().length
          ? directAnswerPrompt
          : undefined,
        toolbasedAnswerPrompt: toolbasedAnswerPrompt.trim().length
          ? toolbasedAnswerPrompt
          : undefined,
        maxToolcalls: parsedMaxToolcalls,
        onlyOneModelCall,
        toolSchemas: assignedTools,
        isOrchestrator: modalMode === "orchestrator",
        subAgents: modalMode === "orchestrator" ? assignedAgents : undefined,
      };

      const normalized = normalizeAgent(agent);
      validateAgent(normalized);

      if (!isEdit) resetForm();
      setError(null);

      onSubmit(normalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input.");
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleRemoveTool = (tool_id: string, container: string) => {
    setAssignedTools((prev) =>
      prev.filter((t) => !(t.tool_id === tool_id && t.container === container))
    );
  };

  const handleRemoveAgent = (agent_id: string, container: string) => {
    setAssignedAgents((prev) =>
      prev.filter((a) => !(a.agent_id === agent_id && a.container === container))
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      title={isEdit ? "Edit Agent" : "Create Agent"}
      onClose={handleClose}
    >
      <ScrollContainer title="Name">
        <TextInput
          value={name}
          onChange={setName}
          placeholder="e.g. Research Agent"
        />
      </ScrollContainer>

      <ScrollContainer title="Description">
        <TextInput
          value={description}
          onChange={setDescription}
          placeholder="Short description"
        />
      </ScrollContainer>

      <ScrollContainer title="Loop Behaviour, Prompts, Tools">
        <TextInput
          label="Max toolcalls (optional)"
          value={maxToolcalls}
          onChange={setMaxToolcalls}
          placeholder="e.g. 5"
        />
        <Checkbox
          label="Only one model call"
          checked={onlyOneModelCall}
          onChange={setOnlyOneModelCall}
        />
        <TextArea
          label="System prompt"
          value={systemPrompt}
          onChange={setSystemPrompt}
          placeholder="Define the agent behavior for tooling (initial)..."
          rows={8}
        />
        <TextArea
          label="Direct Answer Prompt (optional)"
          value={directAnswerPrompt}
          onChange={setDirectAnswerPrompt}
          placeholder="Optional prompt used when direct answers are allowed..."
          rows={6}
        />
        <TextArea
          label="Toolbased Answer Prompt (optional)"
          value={toolbasedAnswerPrompt}
          onChange={setToolbasedAnswerPrompt}
          placeholder="Optional prompt used when tools are involved..."
          rows={6}
        />
        <TextArea
          label="Direct Answer Validation Prompt (optional)"
          value={directAnswerValidationPrompt}
          onChange={setDirectAnswerValidationPrompt}
          placeholder="Define the agent behavior for direct answers..."
          rows={8}
        />
        <div className="formLabel">Assigned Tools</div>
        {assignedTools.length > 0 ? (
          <div className="toolBadges">
            {assignedTools.map((tool) => (
              <ToolBadge
                key={`${tool.container}::${tool.tool_id}`}
                toolRef={tool}
                onRemove={() => handleRemoveTool(tool.tool_id, tool.container)}
              />
            ))}
          </div>
        ) : (
          <div className="formHint">No tools assigned yet.</div>
        )}

        {modalMode === "orchestrator" && (
          <>
            <div className="formLabel">Assigned Subagents</div>
            {assignedAgents.length > 0 ? (
              <div className="toolBadges">
                {assignedAgents.map((agent) => (
                  <AgentBadge
                    key={`${agent.container}::${agent.agent_id}`}
                    agentRef={agent}
                    onRemove={() => handleRemoveAgent(agent.agent_id, agent.container)}
                  />
                ))}
              </div>
            ) : (
              <div className="formHint">No subagents assigned yet.</div>
            )}
          </>
        )}
      </ScrollContainer>

      {error && <div className="formError">{error}</div>}
      <Button label="Save" onClick={handleSave} disabled={!canSave} />
    </Modal>
  );
}
