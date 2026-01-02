"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/ui/Modal";
import { TextInput } from "@/ui/TextInput";
import { TextArea } from "@/ui/TextArea";
import { ScrollContainer } from "@/ui/ScrollContainer";
import { Button } from "@/ui/Button";
import { Agent } from "@/models/agent";
import { normalizeAgent, validateAgent } from "@/models/agent";
import { Checkbox } from "@/ui/CheckBox";

type AgentCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (agent: Agent) => void;
};

export function AgentCreateModal({
  isOpen,
  onClose,
  onSave,
}: AgentCreateModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [directAnswerValidationPrompt, setDirectAnswerValidationPrompt] =
    useState("");
  const [directAnswersAllowed, setDirectAnswersAllowed] =
    useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [directAnswerPrompt, setDirectAnswerPrompt] = useState("");
  const [toolbasedAnswerPrompt, setToolbasedAnswerPrompt] = useState("");
  const [maxToolcalls, setMaxToolcalls] = useState<string>(""); // als string fürs Input
  const [onlyOneModelCall, setOnlyOneModelCall] = useState<boolean>(false);

  const canSave = useMemo(
    () =>
      name.trim().length > 0 &&
      systemPrompt.trim().length > 0 &&
      description.trim().length > 0 &&
      directAnswerValidationPrompt.trim().length > 0,
    [name, systemPrompt, description, directAnswerValidationPrompt]
  );

  const resetForm = () => {
    setName("");
    setDescription("");
    setSystemPrompt("");
    setDirectAnswerValidationPrompt("");
    setDirectAnswersAllowed(true);
    setError(null);
    setDirectAnswerPrompt("");
    setToolbasedAnswerPrompt("");
    setMaxToolcalls("");
    setOnlyOneModelCall(false);
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

      const normalized = normalizeAgent(agent);
      validateAgent(normalized);

      resetForm();
      setError(null);
      onSave(normalized);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid input.");
    }
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} title="Create Agent" onClose={handleClose}>
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

      {error && <div className="formError">{error}</div>}
      <Button label="Save" onClick={handleSave} disabled={!canSave} />
    </Modal>
  );
}
