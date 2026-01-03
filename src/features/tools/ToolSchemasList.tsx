"use client";

import styles from "@/app/tools/page.module.css";
import { Card } from "@/ui/Card";
import type { StoredItem } from "@/storage/storage";
import type { ToolSchema } from "@/models/toolSchema";

type Props = {
  tools: Array<StoredItem<ToolSchema>>;
  isLoading: boolean;
  loadError: string | null;
  onOpen: (tool: StoredItem<ToolSchema>) => void;
};

export function ToolSchemasList({
  tools,
  isLoading,
  loadError,
  onOpen,
}: Props) {
  if (isLoading) return <div>Loading...</div>;
  if (loadError) return <div className="formError">{loadError}</div>;
  if (tools.length === 0) return <div>No tools yet.</div>;

  return (
    <div className="grid">
      {tools.map((tool) => (
        <Card
          key={tool.id}
          title={tool.name_for_llm}
          variant="toolschema"
          dataId={tool.id}
          dataContainer={tool.container}
          onClick={() => onOpen(tool)}
        >
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Server:</span>
            <span className={styles.metaValue}>{tool.server_url}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Tool name (LLM):</span>
            <span className={styles.metaValue}>{tool.name_for_llm}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Tool name (server):</span>
            <span className={styles.metaValue}>{tool.name_on_server}</span>
          </div>

          {tool.description_for_llm?.trim() ? (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>
                Description: {tool.description_for_llm}
              </span>
            </div>
          ) : null}

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Args:</span>
          </div>

          {tool.args_schema.properties.length === 0 ? (
            <div className={styles.metaValue}>-</div>
          ) : (
            <ul className={styles.argsList}>
              {tool.args_schema.properties.map((arg) => (
                <li key={arg.name_on_server} className={styles.argItem}>
                  <div>
                    <strong>{arg.name_for_llm}</strong>
                    {arg.name_for_llm !== arg.name_on_server && (
                      <span className={styles.argServerName}>
                        {" "}
                        (server: {arg.name_on_server})
                      </span>
                    )}
                  </div>

                  <div className={styles.argMeta}>
                    <span>type: {arg.type ?? "string"}</span>
                    {arg.required ? (
                      <span>required</span>
                    ) : (
                      <span>optional</span>
                    )}
                  </div>

                  {arg.description_for_llm?.trim() ? (
                    <div className={styles.argDescription}>
                      {arg.description_for_llm}
                    </div>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </Card>
      ))}
    </div>
  );
}
