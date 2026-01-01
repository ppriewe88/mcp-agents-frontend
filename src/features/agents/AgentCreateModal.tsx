"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/ui/Modal";
import { TextInput } from "@/ui/TextInput";
import { TextArea } from "@/ui/TextArea";
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
  };

  const handleSave = () => {
    try {
      const agent: Agent = {
        name,
        description,
        systemPrompt,
        directAnswerValidationPrompt,
        directAnswersAllowed,
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
      <TextArea
        label="System prompt"
        value={systemPrompt}
        onChange={setSystemPrompt}
        placeholder="Define the agent behavior for tooling (initial)..."
        rows={8}
      />
      <Checkbox
        label="Direct answers allowed"
        checked={directAnswersAllowed}
        onChange={setDirectAnswersAllowed}
      />
      <TextArea
        label="Direct Answer Validation Prompt"
        value={directAnswerValidationPrompt}
        onChange={setDirectAnswerValidationPrompt}
        placeholder="Define the agent behavior for direct answers..."
        rows={8}
      />
      {error && <div className="formError">{error}</div>}
      <Button label="Save" onClick={handleSave} disabled={!canSave} />
    </Modal>
  );
}
