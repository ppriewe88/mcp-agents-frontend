import type { Agent } from "@/models/agent";
import type { ToolSchema } from "@/models/toolSchema";
import { isEmptyDefault } from "@/features/tools/toolschemas.utils";
import { ChatMessageModel } from "@/models/chatMessage";

type AgentConfigDto = {
  // mirrors AgentBehaviourConfig of backend
  name: string;
  description?: string; // optional, backend default ""
  system_prompt: string;
  directanswer_validation_sysprompt?: string | null; // optional, not expected in backend
  direct_answer_prompt?: string | null;
  toolbased_answer_prompt?: string | null;
  max_toolcalls?: number | null;
  only_one_model_call?: boolean; // backend default False
};

type EmptyDefaultDto = "EMPTY";

type ToolArgDto = {
  name_on_server: string;
  name_for_llm: string;
  description_for_llm: string;
  type?: string; // backend default "string"
  required?: boolean; // backend default true
  default?: string | EmptyDefaultDto | null; // backend: Optional[str | "EMPTY"]
};

type ToolArgsSchemaDto = {
  type: "object";
  properties: ToolArgDto[]; // list
  additionalProperties: false;
};

type ToolSchemaDto = {
  server_url: string;
  name_on_server: string;
  name_for_llm: string;
  description_for_llm: string;
  args_schema: ToolArgsSchemaDto;
};

export type StreamAgentRequestDTO = {
  messages: Array<ChatMessageModel>;
  agent_config: AgentConfigDto;
  tool_schemas: ToolSchemaDto[];
};

export function toAgentConfigDto(frontendAgent: Agent): AgentConfigDto {
  const result: AgentConfigDto = {
    name: frontendAgent.name,
    description: frontendAgent.description,

    system_prompt: frontendAgent.systemPrompt,
    directanswer_validation_sysprompt:
      frontendAgent.directAnswerValidationPrompt ?? null,

    direct_answer_prompt: frontendAgent.directAnswerPrompt ?? null,
    toolbased_answer_prompt: frontendAgent.toolbasedAnswerPrompt ?? null,

    max_toolcalls: frontendAgent.maxToolcalls ?? null,
    only_one_model_call: frontendAgent.onlyOneModelCall ?? false,
  };
  return result;
}

export function toToolSchemaDto(tool: ToolSchema): ToolSchemaDto {
  return {
    server_url: tool.server_url,
    name_on_server: tool.name_on_server,
    name_for_llm: tool.name_for_llm,
    description_for_llm: tool.description_for_llm,
    args_schema: {
      type: "object",
      additionalProperties: false,
      properties: tool.args_schema.properties.map((p) => ({
        name_on_server: p.name_on_server,
        name_for_llm: p.name_for_llm,
        description_for_llm: p.description_for_llm,
        type: p.type ?? "string",
        required: p.required ?? true,
        default: isEmptyDefault(p.default) ? "EMPTY" : p.default ?? null,
      })),
    },
  };
}
