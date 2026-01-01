"use client";

import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { AddButton } from "@/ui/AddButton";
import { Button } from "@/ui/Button";
import { Card } from "@/ui/Card";
import { ServerCreateModal } from "@/features/servers/ServerCreateModal";
import type { MCPServer } from "@/models/mcpServer";
import type { StoredItem } from "@/routing/storage";
import { loadServers, saveServer } from "@/features/servers/servers.storage";
import { listTools } from "@/features/servers/servers.getTools";

export default function ServersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [servers, setServers] = useState<Array<StoredItem<MCPServer>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [toolsLog, setToolsLog] = useState<string[]>([]);
  const [toolLoadingById, setToolLoadingById] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const items = await loadServers();
        if (!cancelled) setServers(items);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load servers.";
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

  const handleAddServer = () => {
    setIsCreateOpen(true);
  };

  const handleClose = () => {
    setIsCreateOpen(false);
  };

  const handleSaveServer = async (server: MCPServer) => {
    try {
      const stored = await saveServer(server);
      console.log("Server saved:", stored);
      setIsCreateOpen(false);

      const items = await loadServers();
      setServers(items);
    } catch (error) {
      console.error("Failed to save server:", error);
      // später: Toast / Error-State
    }
  };

  const handleGetTools = async (server: StoredItem<MCPServer>) => {
    setToolLoadingById((prev) => ({ ...prev, [server.id]: true }));
    try {
      const result = await listTools(server);

      const prefix = result.ok ? "OK" : "ERROR";
      setToolsLog((prev) => [
        ...prev,
        `[${prefix}] ${server.name} - ${result.payloadText}`,
      ]);
    } finally {
      setToolLoadingById((prev) => ({ ...prev, [server.id]: false }));
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <AddButton
          onClick={handleAddServer}
          ariaLabel="Create new MCP server"
        />
      </div>

      {/* SERVERS LIST */}
      <div className={styles.listArea}>
        {isLoading && <div>Loading...</div>}
        {loadError && <div className="formError">{loadError}</div>}

        {!isLoading && !loadError && servers.length === 0 && (
          <div>No servers yet.</div>
        )}

        {!isLoading && !loadError && servers.length > 0 && (
          <div className={styles.grid}>
            {servers.map((server) => (
              <Card key={server.id} title={server.name}>
                <div>{server.url}</div>

                <div style={{ marginTop: 12 }}>
                  <Button
                    label={
                      toolLoadingById[server.id] ? "Loading..." : "Get tools"
                    }
                    onClick={() => handleGetTools(server)}
                    disabled={!!toolLoadingById[server.id]}
                  />
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* TOOLS LOG */}
      <div className={styles.listArea}>
        {toolsLog.length === 0 && <div>No tool output yet.</div>}

        {toolsLog.length > 0 && (
          <div>
            {toolsLog.map((line, idx) => (
              <pre key={idx} style={{ whiteSpace: "pre-wrap" }}>
                {line}
              </pre>
            ))}
          </div>
        )}
      </div>

      <ServerCreateModal
        isOpen={isCreateOpen}
        onClose={handleClose}
        onSave={handleSaveServer}
      />
    </div>
  );
}
