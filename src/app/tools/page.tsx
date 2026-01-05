"use client";

import { ListArea } from "@/ui/ListArea";
import { useEffect, useState } from "react";
import type { StoredItem } from "@/storage/operations";
import type { ToolSchema } from "@/models/toolSchema";
import {
  loadToolSchemas,
  saveToolSchema,
  updateToolSchema,
} from "@/features/tools/toolschemas.storage";
import { ToolSchemasList } from "@/features/tools/ToolSchemasList";
import { ToolSchemaCreateOrEditModal } from "@/features/tools/ToolSchemaCreateOrEditModal";

export default function ToolsPage() {
  const [tools, setTools] = useState<Array<StoredItem<ToolSchema>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalToolSchema, setModalToolSchema] =
    useState<StoredItem<ToolSchema> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const items = await loadToolSchemas();
        if (!cancelled) setTools(items);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load tools.";
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

  const reloadTools = async () => {
    const items = await loadToolSchemas();
    setTools(items);
  };

  const handleOpenEdit = (tool: StoredItem<ToolSchema>) => {
    setModalToolSchema(tool);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setModalToolSchema(null);
  };

  const handleSubmitCreateOrEdit = async (toolSchema: ToolSchema) => {
    // Create vs Update Branch
    if (modalToolSchema === null) {
      await saveToolSchema(toolSchema);
    } else {
      const merged: StoredItem<ToolSchema> = {
        ...modalToolSchema,
        ...toolSchema,
        id: modalToolSchema.id,
        partitionKey: modalToolSchema.partitionKey,
        container: modalToolSchema.container,
      };

      await updateToolSchema(merged);
    }

    // close + reload
    handleCloseModal();
    await reloadTools();
  };

  return (
    <div className="container">
      <ListArea title="Registered MCP Tools">
        <ToolSchemasList
          tools={tools}
          isLoading={isLoading}
          loadError={loadError}
          onOpen={handleOpenEdit}
        />
      </ListArea>

      {isModalOpen && modalToolSchema && (
        <ToolSchemaCreateOrEditModal
          key={modalToolSchema?.id ?? "create"}
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          initialToolSchema={modalToolSchema}
          onSubmit={handleSubmitCreateOrEdit}
        />
      )}
    </div>
  );
}
