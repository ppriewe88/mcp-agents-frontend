import type { MCPServer } from "@/models/mcpServer";
import type { StoredItem } from "@/storage/storage";
import type { ServerTool } from "@/models/mcpServerTool";
import { normalizeTool, validateTool } from "@/models/mcpServerTool";

export type ListToolsResult = {
  ok: boolean;
  data?: unknown; // <- json raw
  error?: string;
};

export async function listTools(
  server: StoredItem<MCPServer>
): Promise<ListToolsResult> {
  try {
    const res = await fetch("http://127.0.0.1:3001/get_tools", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        server_url: server.url,
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ok: false, error: `Backend error (${res.status}): ${text}` };
    }

    const data = (await res.json()) as unknown;
    return { ok: true, data };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch tools.";
    return { ok: false, error: msg };
  }
}

export function extractToolsArray(data: unknown): unknown[] {
  // häufige Formen:
  // 1) direkt Array: [ {...tool}, {...tool} ]
  // 2) JSON-RPC: { result: { tools: [...] } }
  // 3) JSON-RPC: { result: [...] }
  // 4) { tools: [...] }

  if (Array.isArray(data)) return data;

  if (data && typeof data === "object") {
    const obj = data as Record<string, unknown>;

    if (Array.isArray(obj.tools)) return obj.tools;

    const result = obj.result;
    if (Array.isArray(result)) return result;

    if (result && typeof result === "object") {
      const r = result as Record<string, unknown>;
      if (Array.isArray(r.tools)) return r.tools;
    }
  }

  return [];
}

export type ParseToolsResult = {
  ok: boolean;
  tools?: ServerTool[];
  error?: string;
};

export function parseTools(data: unknown): ParseToolsResult {
  const arr = extractToolsArray(data);

  if (arr.length === 0) {
    return { ok: false, error: "No tools array found in response." };
  }

  const tools: ServerTool[] = [];
  const errors: string[] = [];

  arr.forEach((raw, idx) => {
    try {
      // raw kommt als unknown -> erst als Tool annehmen und dann validieren
      const tool = normalizeTool(raw as ServerTool);
      validateTool(tool);
      tools.push(tool);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Invalid tool.";
      errors.push(`Tool[${idx}]: ${msg}`);
    }
  });

  if (tools.length === 0) {
    return { ok: false, error: errors.join("\n") || "No valid tools parsed." };
  }

  if (errors.length > 0) {
    // console.warn(errors.join("\n"));
  }

  return { ok: true, tools };
}
