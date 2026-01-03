"use client";

import styles from "@/app/tools/page.module.css";
import { Card } from "@/ui/Card";
import type { StoredItem } from "@/storage/storage";
import type { ToolSchema, ToolSchemaRef } from "@/models/toolSchema";

type Props = {
  tools: Array<StoredItem<ToolSchema>>;
  isLoading: boolean;
  loadError: string | null;
};

export function DragToolSchemasList({ tools, isLoading, loadError }: Props) {
  if (isLoading) return <div>Loading...</div>;
  if (loadError) return <div className="formError">{loadError}</div>;
  if (tools.length === 0) return <div>No tools yet.</div>;

  return (
    <div className="grid">
      {tools.map((tool) => {
        const payload: ToolSchemaRef = {
          tool_id: tool.id,
          container: tool.container,
          name_for_llm: tool.name_for_llm,
          server_url: tool.server_url,
        };
        return (
          <Card
            key={tool.id}
            title={tool.name_for_llm}
            dataId={tool.id}
            dataContainer={tool.container}
            draggable={true}
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "copy";
              e.dataTransfer.setData(
                "application/x-mcp-toolschema-ref",
                JSON.stringify(payload)
              );
            }}
          >
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>Server:</span>
              <span className={styles.metaValue}>{tool.server_url}</span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
