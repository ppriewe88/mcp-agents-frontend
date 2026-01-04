import type { StoredItem } from "@/storage/storage";
import type { Agent } from "@/models/agent";

export type InvokeAgentResponse = {
  status: "ok" | "error";
  agent_id?: string;
  response?: string;
  error?: string;
};

export async function invokeAgent(
  agent: StoredItem<Agent>,
  message: string
): Promise<InvokeAgentResponse> {
  const url = "http://127.0.0.1:3001/invoke";

  const payload = {
    agent: {
      id: agent.id,
      partitionKey: agent.partitionKey,
      container: agent.container,
      agent: {
        name: agent.name,
        systemPrompt: agent.systemPrompt,
        directAnswerValidationPrompt: agent.directAnswerValidationPrompt,
        description: agent.description,

        directAnswersAllowed: agent.directAnswersAllowed,
        directAnswerPrompt: agent.directAnswerPrompt,
        toolbasedAnswerPrompt: agent.toolbasedAnswerPrompt,

        maxToolcalls: agent.maxToolcalls,
        onlyOneModelCall: agent.onlyOneModelCall,

        toolSchemas: agent.toolSchemas,
      },
    },
    message,
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(
      `Invoke failed (${res.status} ${res.statusText})${
        text ? `: ${text}` : ""
      }`
    );
  }

  return (await res.json()) as InvokeAgentResponse;
}
