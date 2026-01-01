"use client";

import styles from "./page.module.css";
import type { MCPServer } from "@/models/mcpServer";
import type { StoredItem } from "@/routing/storage";
import { Card } from "@/ui/Card";
import { Button } from "@/ui/Button";

type Props = {
  servers: Array<StoredItem<MCPServer>>;
  isLoading: boolean;
  loadError: string | null;
  toolLoadingById: Record<string, boolean>;
  onGetTools: (server: StoredItem<MCPServer>) => void;
};

export function ServersList({
  servers,
  isLoading,
  loadError,
  toolLoadingById,
  onGetTools,
}: Props) {
  if (isLoading) return <div>Loading...</div>;
  if (loadError) return <div className="formError">{loadError}</div>;
  if (servers.length === 0) return <div>No servers yet.</div>;

  return (
    <div className={styles.grid}>
      {servers.map((server) => (
        <Card key={server.id} title={server.name}>
          <div>{server.url}</div>

          <div style={{ marginTop: 12 }}>
            <Button
              label={toolLoadingById[server.id] ? "Loading..." : "Get tools"}
              onClick={() => onGetTools(server)}
              disabled={!!toolLoadingById[server.id]}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
