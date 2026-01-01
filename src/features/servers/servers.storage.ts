import { MCPServer } from "@/models/mcpServer";
import { loadItems, saveItemToContainer, StoredItem } from "@/storage/storage";

const CONTAINER = "servers";

export function saveServer(server: MCPServer): Promise<StoredItem<MCPServer>> {
  return saveItemToContainer<MCPServer>(CONTAINER, server);
}

export function loadServers(): Promise<StoredItem<MCPServer>[]> {
  return loadItems<MCPServer>(CONTAINER);
}
