"use client";

import styles from "./page.module.css";
import { useEffect, useState } from "react";
import type { StoredItem } from "@/storage/storage";
import type { ToolSchema } from "@/models/toolSchema";
import { loadToolSchemas } from "@/features/tools/toolschemas.storage";
import { ToolSchemasList } from "@/features/tools/ToolSchemasList";

export default function ToolsPage() {
  const [tools, setTools] = useState<Array<StoredItem<ToolSchema>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

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

  return (
    <div className={styles.container}>
      <div className={styles.header} />

      <div className={styles.listArea}>
        <ToolSchemasList
          tools={tools}
          isLoading={isLoading}
          loadError={loadError}
        />
      </div>
    </div>
  );
}
