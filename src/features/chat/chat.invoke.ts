import type { StoredItem } from "@/storage/operations";
import type { Agent } from "@/models/agent";
import { streamControl } from "@/features/chat/streamControl";
import type { StreamAgentRequestDTO } from "@/features/chat/chat.dto";
import type { ToolSchema } from "@/models/toolSchema";
import { toAgentConfigDto, toToolSchemaDto } from "@/features/chat/chat.dto";

type InvokeAgentArgs = {
  renderChunk: (appendText: string) => void;
  message: string;
  agent: StoredItem<Agent>;
  toolSchemas: ToolSchema[];
};

export async function invokeAgent({
  renderChunk,
  message,
  agent,
  toolSchemas,
}: InvokeAgentArgs): Promise<void> {
  const url = "http://127.0.0.1:3001/stream-test";

  const payload: StreamAgentRequestDTO = {
    message,
    agent_config: toAgentConfigDto(agent),
    tool_schemas: toolSchemas.map(toToolSchemaDto),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} ${res.statusText}${errText ? `: ${errText}` : ""}`
    );
  }
  if (!res.body) {
    throw new Error("No response body (stream not supported).");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    if (value) {
      const rawChunk = decoder.decode(value, { stream: true });
      const { appendText } = streamControl(rawChunk);
      if (appendText) {
        renderChunk(appendText);
      }
    }
  }
}
