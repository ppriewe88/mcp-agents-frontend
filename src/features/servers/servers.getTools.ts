import type { MCPServer } from "@/models/mcpServer";
import type { StoredItem } from "@/routing/storage";

export type ListToolsResult = {
  ok: boolean;
  payloadText: string; // string für UI-List
};

function pretty(x: unknown): string {
  if (typeof x === "string") return x;
  try {
    return JSON.stringify(x, null, 2);
  } catch {
    return String(x);
  }
}

export async function listTools(
  server: StoredItem<MCPServer>
): Promise<ListToolsResult> {
  try {
    const res = await fetch("http://127.0.0.1:3001/get_tools", {
      method: "GET",
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        payloadText: `Backend error (${res.status}): ${text}`,
      };
    }

    const data = await res.json();
    return {
      ok: true,
      payloadText: pretty(data),
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to fetch tools.";
    return { ok: false, payloadText: msg };
  }
}
