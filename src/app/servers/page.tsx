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
import { listTools, parseTools } from "@/features/servers/servers.getTools";
import type { ServerTool } from "@/models/mcpServerTool";
import { toToolDisplay } from "@/models/mcpServerTool";

export default function ServersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [servers, setServers] = useState<Array<StoredItem<MCPServer>>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tools, setTools] = useState<ServerTool[]>([]);
  const [toolsError, setToolsError] = useState<string | null>(null);
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
    setToolsError(null);

    try {
      const result = await listTools(server);

      if (!result.ok) {
        setTools([]); // statt setToolsRaw([])
        setToolsError(result.error ?? "Failed to load tools.");
        return;
      }

      const parsed = parseTools(result.data);

      if (!parsed.ok) {
        setTools([]); // statt setToolsRaw([])
        setToolsError(parsed.error ?? "No valid tools parsed.");
        return;
      }

      setTools(parsed.tools ?? []);
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
        {toolsError && <div className="formError">{toolsError}</div>}

        {!toolsError && tools.length === 0 && <div>No tools loaded.</div>}

        {!toolsError && tools.length > 0 && (
          <div className={styles.grid}>
            {tools.map((tool) => (
              <Card key={tool.function.name} title={tool.function.name}>
                {tool.function.description && (
                  <div style={{ marginTop: 6 }}>
                    {tool.function.description}
                  </div>
                )}

                {tool.function.parameters && (
                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 600, marginBottom: 6 }}>
                      Parameters
                    </div>
                    <pre style={{ whiteSpace: "pre-wrap" }}>
                      {JSON.stringify(tool.function.parameters, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            ))}
            {/* {tools.map((tool) => {
              const view = toToolDisplay(tool);

              return (
                <Card key={view.name} title={view.name}>
                  <div>
                    <div style={{ fontWeight: 600 }}>Name</div>
                    <div>{view.name}</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 600 }}>Description</div>
                    <div>{view.description ?? "-"}</div>
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 600 }}>Required</div>
                    {view.required.length === 0 ? (
                      <div>-</div>
                    ) : (
                      <ul style={{ margin: 0, paddingLeft: 18 }}>
                        {view.required.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <div style={{ fontWeight: 600 }}>Parameters</div>

                    {view.params.length === 0 ? (
                      <div>-</div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          gap: 10,
                        }}
                      >
                        {view.params.map((p) => (
                          <div
                            key={p.name}
                            style={{
                              borderTop: "1px solid #eee",
                              paddingTop: 8,
                            }}
                          >
                            <div>
                              <div style={{ fontWeight: 600 }}>Parameter</div>
                              <div>{p.name}</div>
                            </div>

                            <div style={{ marginTop: 6 }}>
                              <div style={{ fontWeight: 600 }}>Title</div>
                              <div>{p.title ?? "-"}</div>
                            </div>

                            <div style={{ marginTop: 6 }}>
                              <div style={{ fontWeight: 600 }}>Type</div>
                              <div>{p.type ?? "-"}</div>
                            </div>

                            <div style={{ marginTop: 6 }}>
                              <div style={{ fontWeight: 600 }}>Required</div>
                              <div>{p.required ? "yes" : "no"}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {typeof view.strict === "boolean" && (
                    <div style={{ marginTop: 12 }}>
                      <div style={{ fontWeight: 600 }}>Strict</div>
                      <div>{view.strict ? "true" : "false"}</div>
                    </div>
                  )}
                </Card>
              );
            })} */}
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
