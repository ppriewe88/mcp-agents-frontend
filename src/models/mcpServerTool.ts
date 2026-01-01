export type ServerToolParameterDefinition = {
  title?: string;
  type?: string;
};

export type ServerToolParameterSchema = {
  type: "object";
  properties: Record<string, ServerToolParameterDefinition>;
  required?: string[];
  additionalProperties?: boolean;
};

export type ServerToolFunction = {
  name: string;
  description?: string;
  parameters?: ServerToolParameterSchema;
  strict?: boolean;
};

export type ServerTool = {
  type: "function";
  function: ServerToolFunction;
};

export type ToolParam = {
  name: string;
  title?: string;
  type?: string;
  required: boolean;
};

export type ToolDisplay = {
  name: string;
  description?: string;
  params: ToolParam[];
  required: string[];
  strict?: boolean;
};

export function normalizeTool(tool: ServerTool): ServerTool {
  return {
    type: "function",
    function: {
      name: tool.function.name.trim(),
      description: tool.function.description?.trim(),
      parameters: tool.function.parameters,
      strict: tool.function.strict,
    },
  };
}

export function validateTool(tool: ServerTool): void {
  if (tool.type !== "function") {
    throw new Error("Unsupported tool type");
  }

  if (!tool.function?.name?.trim()) {
    throw new Error("Tool.function.name is required");
  }

  const p = tool.function.parameters;
  if (p && p.type !== "object") {
    throw new Error("Tool.function.parameters.type must be 'object'");
  }
}

export function toToolDisplay(tool: ServerTool): ToolDisplay {
  const fn = tool.function;
  const schema = fn.parameters;

  const requiredList = Array.isArray(schema?.required) ? schema.required : [];
  const requiredSet = new Set(requiredList);

  const props = schema?.properties ?? {};

  const params: ToolParam[] = Object.entries(props).map(([name, def]) => ({
    name,
    title: def.title,
    type: def.type,
    required: requiredSet.has(name),
  }));

  params.sort((a, b) => {
    if (a.required !== b.required) return a.required ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  return {
    name: fn.name,
    description: fn.description,
    params,
    required: requiredList,
    strict: fn.strict,
  };
}
