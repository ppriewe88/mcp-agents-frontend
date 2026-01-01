"use client";

import { useMemo, useState } from "react";
import { Modal } from "@/ui/Modal";
import { TextInput } from "@/ui/TextInput";
import { Button } from "@/ui/Button";
import {
  MCPServer,
  normalizeMCPServer,
  validateMCPServer,
} from "@/models/mcpServer";

type ServerCreateModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (server: MCPServer) => void;
};

export function ServerCreateModal({
  isOpen,
  onClose,
  onSave,
}: ServerCreateModalProps) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  const canSave = useMemo(
    () => name.trim().length > 0 && url.trim().length > 0,
    [name, url]
  );

  const resetForm = () => {
    setName("");
    setUrl("");
    setError(null);
  };

  const handleSave = () => {
    try {
      const server: MCPServer = { name, url };

      const normalized = normalizeMCPServer(server);
      validateMCPServer(normalized);

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
    <Modal isOpen={isOpen} title="Create MCP Server" onClose={handleClose}>
      <TextInput
        label="Name"
        value={name}
        onChange={setName}
        placeholder="e.g. Local MCP Server"
      />
      <TextInput
        label="URL"
        value={url}
        onChange={setUrl}
        placeholder="e.g. http://localhost:3001"
      />

      {error && <div className="formError">{error}</div>}

      <Button label="Save" onClick={handleSave} disabled={!canSave} />
    </Modal>
  );
}
