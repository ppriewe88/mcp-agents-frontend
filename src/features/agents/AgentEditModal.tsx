"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/ui/Modal";
import { TextInput } from "@/ui/TextInput";
import { TextArea } from "@/ui/TextArea";
import { ScrollContainer } from "@/ui/ScrollContainer";
import { Button } from "@/ui/Button";
import { Checkbox } from "@/ui/CheckBox";
import type { Agent } from "@/models/agent";
import type { StoredItem } from "@/storage/storage";

type AgentEditModalProps = {
  isOpen: boolean;
  agent: StoredItem<Agent> | null;
  onClose: () => void;
  onSave: (agentId: string, agent: Agent) => void;
};

export function AgentEditModal({
  isOpen,
  agent,
  onClose,
  onSave,
}: AgentEditModalProps) {
  // Initialwerte direkt aus agent ziehen (MVP)
  const [name, setName] = useState(agent?.name ?? "");
  const [description, setDescription] = useState(agent?.description ?? "");
  const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt ?? "");
  const [directAnswerValidationPrompt, setDirectAnswerValidationPrompt] =
    useState(agent?.directAnswerValidationPrompt ?? "");
  const [directAnswersAllowed, setDirectAnswersAllowed] = useState<boolean>(
    agent?.directAnswersAllowed ?? true
  );
  const [directAnswerPrompt, setDirectAnswerPrompt] = useState(
    agent?.directAnswerPrompt ?? ""
  );
  const [toolbasedAnswerPrompt, setToolbasedAnswerPrompt] = useState(
    agent?.toolbasedAnswerPrompt ?? ""
  );
  const [maxToolcalls, setMaxToolcalls] = useState<string>(
    agent?.maxToolcalls !== undefined ? String(agent.maxToolcalls) : ""
  );
  const [onlyOneModelCall, setOnlyOneModelCall] = useState<boolean>(
    agent?.onlyOneModelCall ?? false
  );

  const canSave = useMemo(() => {
    return (
      name.trim().length > 0 &&
      description.trim().length > 0 &&
      systemPrompt.trim().length > 0 &&
      directAnswerValidationPrompt.trim().length > 0
    );
  }, [name, description, systemPrompt, directAnswerValidationPrompt]);

  const handleSave = () => {
    if (!agent) return;

    const parsedMaxToolcalls =
      maxToolcalls.trim().length === 0 ? undefined : Number(maxToolcalls);

    const updated: Agent = {
      name,
      description,
      systemPrompt,
      directAnswerValidationPrompt,
      directAnswersAllowed,
      directAnswerPrompt: directAnswerPrompt.trim().length
        ? directAnswerPrompt
        : undefined,
      toolbasedAnswerPrompt: toolbasedAnswerPrompt.trim().length
        ? toolbasedAnswerPrompt
        : undefined,
      maxToolcalls: parsedMaxToolcalls,
      onlyOneModelCall,
    };

    onSave(agent.id, updated);
  };

  return (
    <Modal isOpen={isOpen} title="Edit Agent" onClose={onClose}>
      <TextInput
        label="Name"
        value={name}
        onChange={setName}
        placeholder="e.g. Research Agent"
      />
      <TextInput
        label="Description"
        value={description}
        onChange={setDescription}
        placeholder="Short description"
      />
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
      <Checkbox
        label="Direct answers allowed"
        checked={directAnswersAllowed}
        onChange={setDirectAnswersAllowed}
      />

      <ScrollContainer>
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
          label="Direct Answer Validation Prompt"
          value={directAnswerValidationPrompt}
          onChange={setDirectAnswerValidationPrompt}
          placeholder="Define the agent behavior for direct answers..."
          rows={8}
        />
      </ScrollContainer>

      <Button label="Save" onClick={handleSave} disabled={!canSave || !agent} />
    </Modal>
  );
}
