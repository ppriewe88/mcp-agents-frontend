import type { ToolSchema, ToolArg, EmptyDefault } from "@/models/toolSchema";

export function defaultToString(d: ToolArg["default"]): string {
  if (d === undefined || d === null) return "";
  if (typeof d === "string") return d;
  if (typeof d === "object" && (d as EmptyDefault)?.kind === "EmptyDefault")
    return "EmptyDefault";
  return JSON.stringify(d);
}

export function parseDefaultValue(raw: string): string | EmptyDefault | null {
  const v = raw.trim();
  if (!v) return null;

  if (v === "EmptyDefault" || v === '{"kind":"EmptyDefault"}') {
    return { kind: "EmptyDefault" };
  }
  return v;
}

export function normalizeToolSchema(schema: ToolSchema): ToolSchema {
  return {
    ...schema,
    server_url: schema.server_url?.trim() ?? "",
    name_on_server: schema.name_on_server?.trim() ?? "",
    name_for_llm: schema.name_for_llm?.trim() ?? "",
    description_for_llm: schema.description_for_llm?.trim() ?? "",
    args_schema: {
      type: "object",
      properties: Array.isArray(schema.args_schema?.properties)
        ? schema.args_schema.properties
        : [],
      additionalProperties: false,
    },
  };
}

/**
 * Minimal, local validation.
 * If you already have a shared validateToolSchema utility, replace this function + call site.
 */
export function validateToolSchema(schema: ToolSchema): void {
  if (!schema.server_url?.trim()) throw new Error("No server url provided.");
  if (!schema.name_on_server?.trim())
    throw new Error("Tool name (server) missing.");
  if (!schema.name_for_llm?.trim())
    throw new Error("Tool name (for llm) missing.");

  if (schema.args_schema?.type !== "object") {
    throw new Error("args_schema.type must be 'object'.");
  }
  if (!Array.isArray(schema.args_schema?.properties)) {
    throw new Error("args_schema.properties must be an array.");
  }
}
