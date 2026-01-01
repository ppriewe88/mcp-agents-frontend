"use client";

import styles from "./page.module.css";
import { useEffect, useState } from "react";
import { AddButton } from "@/ui/AddButton";
import { ServerCreateModal } from "@/features/servers/ServerCreateModal";
import type { MCPServer } from "@/models/mcpServer";
import type { StoredItem } from "@/routing/storage";
import { loadServers, saveServer } from "@/features/servers/servers.storage";
import { listTools, parseTools } from "@/features/servers/servers.getTools";
import type { ServerTool } from "@/models/mcpServerTool";
import { ServersList } from "./ServersList";
import { ServerToolsList } from "./ServerToolsList";
import { ToolRegisterModal } from "@/features/servers/ToolRegisterModal";

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
  const [toolsServerUrl, setToolsServerUrl] = useState<string | null>(null);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ServerTool | null>(null);

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
    setToolsServerUrl(server.url);

    try {
      const result = await listTools(server);

      if (!result.ok) {
        setTools([]);
        setToolsServerUrl(null);
        setToolsError(result.error ?? "Failed to load tools.");
        return;
      }

      const parsed = parseTools(result.data);

      if (!parsed.ok) {
        setTools([]);
        setToolsServerUrl(null);
        setToolsError(parsed.error ?? "No valid tools parsed.");
        return;
      }

      setTools(parsed.tools ?? []);
    } finally {
      setToolLoadingById((prev) => ({ ...prev, [server.id]: false }));
    }
  };

  const handleRegisterTool = (tool: ServerTool) => {
    setSelectedTool(tool);
    setIsRegisterOpen(true);
  };

  const handleCloseRegister = () => {
    setIsRegisterOpen(false);
    setSelectedTool(null);
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <AddButton
          onClick={handleAddServer}
          ariaLabel="Create new MCP server"
        />
      </div>

      <div className={styles.listArea}>
        <ServersList
          servers={servers}
          isLoading={isLoading}
          loadError={loadError}
          toolLoadingById={toolLoadingById}
          onGetTools={handleGetTools}
        />
      </div>

      <div className={styles.listArea}>
        <ServerToolsList
          tools={tools}
          toolsError={toolsError}
          serverUrl={toolsServerUrl}
          onRegisterTool={handleRegisterTool}
        />
      </div>

      <ServerCreateModal
        isOpen={isCreateOpen}
        onClose={handleClose}
        onSave={handleSaveServer}
      />

      <ToolRegisterModal
        key={`${toolsServerUrl ?? "no-server"}::${
          selectedTool?.function.name ?? "no-tool"
        }`}
        isOpen={isRegisterOpen}
        onClose={handleCloseRegister}
        tool={selectedTool}
        serverUrl={toolsServerUrl}
      />
    </div>
  );
}
