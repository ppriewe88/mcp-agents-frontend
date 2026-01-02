"use client";

import styles from "@/app/tools/page.module.css";
import { Card } from "@/ui/Card";
import type { StoredItem } from "@/storage/storage";
import type { ToolSchema } from "@/models/toolSchema";

type Props = {
  tools: Array<StoredItem<ToolSchema>>;
  isLoading: boolean;
  loadError: string | null;
};

export function ToolSchemasList({ tools, isLoading, loadError }: Props) {
  if (isLoading) return <div>Loading...</div>;
  if (loadError) return <div className="formError">{loadError}</div>;
  if (tools.length === 0) return <div>No tools yet.</div>;

  return (
    <div className={styles.grid}>
      {tools.map((t) => (
        <Card key={t.id} title={t.name_for_llm} dataId={t.id}>
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Server:</span>
            <span className={styles.metaValue}>{t.server_url}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Tool name (LLM):</span>
            <span className={styles.metaValue}>{t.name_for_llm}</span>
          </div>

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Tool name (server):</span>
            <span className={styles.metaValue}>{t.name_on_server}</span>
          </div>

          {t.description_for_llm?.trim() ? (
            <div className={styles.metaRow}>
              <span className={styles.metaLabel}>
                Description: {t.description_for_llm}
              </span>
            </div>
          ) : null}

          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Args:</span>
          </div>

          {t.args_schema.properties.length === 0 ? (
            <div className={styles.metaValue}>-</div>
          ) : (
            <ul className={styles.argsList}>
              {t.args_schema.properties.map((arg) => (
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
