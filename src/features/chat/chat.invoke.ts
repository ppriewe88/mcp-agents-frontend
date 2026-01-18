import type { StoredItem } from "@/storage/operations";
import type { Agent } from "@/models/agent";
import { streamControl } from "@/features/chat/streamControl";
import type { StreamChunk } from "@/features/chat/streamControl";
import type { StreamAgentRequestDTO } from "@/features/chat/chat.dto";
import type { ToolSchema } from "@/models/toolSchema";
import { toAgentConfigDto, toToolSchemaDto } from "@/features/chat/chat.dto";
import { ChatMessageModel } from "@/models/chatMessage";

type StepItem = {
  id: string;
  kind: "step";
  text: string; // erstmal nur Textanzeige, später strukturierter
};

type InvokeAgentArgs = {
  onFinalText: (appendText: string) => void;
  onStep: (item: StepItem) => void;
  messages: Array<ChatMessageModel>;
  agent: StoredItem<Agent>;
  toolSchemas: ToolSchema[];
};

type NdjsonChunk = {
  type?: string;
  data?: unknown;
  level?: string;
};

function makeStepItem(text: string): StepItem {
  return { id: crypto.randomUUID(), kind: "step", text };
}

export async function invokeAgent({
  onFinalText,
  onStep,
  messages,
  agent,
  toolSchemas,
}: InvokeAgentArgs): Promise<void> {
  const url = "http://127.0.0.1:3001/stream-test";

  const payload: StreamAgentRequestDTO = {
    messages,
    agent_config: toAgentConfigDto(agent),
    tool_schemas: toolSchemas.map(toToolSchemaDto),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson",
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(
      `HTTP ${res.status} ${res.statusText}${errText ? `: ${errText}` : ""}`,
    );
  }
  if (!res.body) {
    throw new Error("No response body (stream not supported).");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    if (!value) continue;

    buffer += decoder.decode(value, { stream: true });

    // NDJSON: process complete lines
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? ""; // keep last partial line in buffer

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let msg: NdjsonChunk;
      try {
        msg = JSON.parse(trimmed);
      } catch {
        // MVP: ignore malformed line
        continue;
      }

      // minimal validation
      const type = msg?.type;
      const level = msg?.level;
      const data = msg?.data;
      if (typeof type !== "string" || typeof data !== "string") {
        continue; // MVP: ignore unknown/untyped chunks
      }

      // central routing
      const action = streamControl({ type, level, data } as StreamChunk);

      if (action.kind === "final") {
        onFinalText(action.text);
      } else if (action.kind === "step") {
        // Dummy handling can live in caller; here we pass it through:
        onStep(makeStepItem(action.text));
      }
    }
  }
}
