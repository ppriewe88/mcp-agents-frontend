import type { ToolSchemaRef } from "@/models/toolSchema";

export type Agent = {
  // required
  name: string;
  systemPrompt: string;
  directAnswerValidationPrompt: string;
  description: string; // backend default: ""

  // optional / with defaults (backend-aligned)
  directAnswersAllowed?: boolean; // backend default: true

  // optional prompts
  directAnswerPrompt?: string; // backend Optional[str]
  toolbasedAnswerPrompt?: string; // backend Optional[str]

  // optional controls
  maxToolcalls?: number; // backend Optional[int]
  onlyOneModelCall?: boolean; // backend default: false

  // tool assignment (mirrors AgentRegistryEntry.tool_schemas)
  toolSchemas?: ToolSchemaRef[];
};

export function normalizeAgent(agent: Agent): Agent {
  return {
    name: agent.name.trim(),
    description: agent.description.trim(),
    systemPrompt: agent.systemPrompt.trim(),
    directAnswerValidationPrompt: agent.directAnswerValidationPrompt.trim(),
    directAnswersAllowed: agent.directAnswersAllowed ?? true,
    directAnswerPrompt: agent.directAnswerPrompt?.trim(),
    toolbasedAnswerPrompt: agent.toolbasedAnswerPrompt?.trim(),
    maxToolcalls: agent.maxToolcalls,
    onlyOneModelCall: agent.onlyOneModelCall ?? false,
    toolSchemas: agent.toolSchemas ?? [],
  };
}

export function validateAgent(agent: Agent): void {
  if (agent.name.trim().length === 0)
    throw new Error("Name must not be empty.");

  if (agent.description.trim().length === 0)
    throw new Error("Description must not be empty.");

  if (agent.systemPrompt.trim().length === 0)
    throw new Error("System prompt must not be empty.");

  if (agent.directAnswerValidationPrompt.trim().length === 0)
    throw new Error("Direct answer validation prompt must not be empty.");

  if (agent.maxToolcalls !== undefined) {
    if (!Number.isInteger(agent.maxToolcalls))
      throw new Error("Max toolcalls must be an integer.");
    if (agent.maxToolcalls < 0) throw new Error("Max toolcalls must be >= 0.");
  }
}
