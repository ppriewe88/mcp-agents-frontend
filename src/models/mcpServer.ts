export type MCPServer = {
  name: string;
  url: string;
};

export function normalizeMCPServer(server: MCPServer): MCPServer {
  return {
    name: server.name.trim(),
    url: server.url.trim(),
  };
}

export function validateMCPServer(server: MCPServer): void {
  if (!server.name) {
    throw new Error("Name is required");
  }
  if (!server.url) {
    throw new Error("URL is required");
  }

  try {
    new URL(server.url);
  } catch {
    throw new Error("URL is not valid");
  }
}
