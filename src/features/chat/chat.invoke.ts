import type { StoredItem } from "@/storage/operations";
import type { Agent } from "@/models/agent";
import { streamControl } from "@/features/chat/streamControl";
import type { StreamChunk, StreamControlResult } from "@/features/chat/streamControl";
import type { StreamAgentRequestDTO } from "@/features/chat/chat.dto";
import type { ToolSchema } from "@/models/toolSchema";
import { toAgentConfigDto, toToolSchemaDto } from "@/features/chat/chat.dto";
import { ChatMessageModel } from "@/models/chatMessage";

export type StepItem = {
  id: string;
  level: "outer_agent" | "inner_agent";
  kind: "step";
  text: string; // erstmal nur Textanzeige, später strukturierter
};

export type ResolvedAgent = {
  agent: StoredItem<Agent>;
  toolSchemas: ToolSchema[];
};

type InvokeAgentArgs = {
  onFinalText: (appendText: string) => void;
  onStep: (item: StepItem) => void;
  messages: Array<ChatMessageModel>;
  resolvedAgent: ResolvedAgent;
  resolvedSubAgents?: Array<ResolvedAgent>;
};

type NdjsonChunk = {
  type?: string;
  data?: unknown;
  level?: string;
};

function makeStepItem(result: Extract<StreamControlResult, { kind: "step" }>): StepItem {
  return { id: crypto.randomUUID(), kind: "step", level: result.level, text: result.text };
}

export async function invokeAgent({ onFinalText, onStep, messages, resolvedAgent, resolvedSubAgents }: InvokeAgentArgs): Promise<void> {
  const url = "http://127.0.0.1:3001/stream-test";

  const toBundle = (r: ResolvedAgent) => ({
    agent_config: toAgentConfigDto(r.agent),
    tool_schemas: r.toolSchemas.map(toToolSchemaDto)
  });

  const payload: StreamAgentRequestDTO = {
    messages,
    agent: toBundle(resolvedAgent),
    subagents: resolvedSubAgents?.map(toBundle)
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/x-ndjson"
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`HTTP ${res.status} ${res.statusText}${errText ? `: ${errText}` : ""}`);
  }
  if (!res.body) {
    throw new Error("No response body (stream not supported).");
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder("utf-8");

  let buffer = "";
  let outerFinalBuffer = "";

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

      if (action.kind === "outer_final") {
        onFinalText(action.text);
        outerFinalBuffer += action.text; // accumulate outer final answer for thread
      } else if (action.kind === "inner_final") {
        onStep(makeStepItem({ kind: "step", text: action.text, level: "inner_agent" }));
      } else if (action.kind === "step") {
        onStep(makeStepItem(action));
      }
    }
  }

  // After stream: send accumulated outer final message to AgentThread
  if (outerFinalBuffer) {
    onStep(makeStepItem({ kind: "step", text: outerFinalBuffer, level: "outer_agent" }));
  }
}
