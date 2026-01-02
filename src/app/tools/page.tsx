"use client";

import styles from "./page.module.css";
import { useEffect, useState } from "react";
import type { StoredItem } from "@/storage/storage";
import type { ToolSchema } from "@/models/toolSchema";
import {
  loadToolSchemas,
  updateToolSchema,
} from "@/features/tools/toolschemas.storage";
import { ToolSchemasList } from "@/features/tools/ToolSchemasList";
import { ToolEditModal } from "@/features/tools/ToolEditModal";

export default function ToolsPage() {
  const [tools, setTools] = useState<Array<StoredItem<ToolSchema>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedTool, setSelectedTool] =
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

  const handleOpenEdit = (tool: StoredItem<ToolSchema>) => {
    setSelectedTool(tool);
    setIsEditOpen(true);
  };

  const handleCloseEdit = () => {
    setIsEditOpen(false);
    setSelectedTool(null);
  };

  const handleSaveEdit = async (patch: ToolSchema) => {
    if (!selectedTool) return;

    const merged: StoredItem<ToolSchema> = {
      ...selectedTool,
      ...patch,
      id: selectedTool.id,
      partitionKey: selectedTool.partitionKey,
      container: selectedTool.container,
    };

    await updateToolSchema(merged);

    handleCloseEdit();

    const items = await loadToolSchemas();
    setTools(items);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header} />

      <div className={styles.listArea}>
        <ToolSchemasList
          tools={tools}
          isLoading={isLoading}
          loadError={loadError}
          onOpen={handleOpenEdit}
        />
      </div>

      {isEditOpen && selectedTool && (
        <ToolEditModal
          isOpen={isEditOpen}
          tool={selectedTool}
          onClose={handleCloseEdit}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}
