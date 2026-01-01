/**
 * Marker type for "EmptyDefault" from backend.
 * Use this when a default is intentionally "empty" but explicitly set.
 */
export type EmptyDefault = {
  kind: "EmptyDefault";
};

/**
 * Contains info how input of a specific mcp tool looks on server.
 * Mirrors backend ToolArg.
 */
export type ToolArg = {
  name_on_server: string;
  name_for_llm: string;
  description_for_llm: string;
  type?: string; // backend default: "string"
  required?: boolean; // backend default: true
  default?: string | EmptyDefault | null; // backend: Optional[str | EmptyDefault]
};

/**
 * Type for parameters of mcp tools in openai format.
 * Mirrors backend ToolArgsSchema.
 */
export type ToolArgsSchema = {
  type: "object"; // backend Literal["object"] = "object"
  properties: ToolArg[]; // IMPORTANT: list, not record
  additionalProperties: false; // backend default: false
};

/**
 * Client-side schema definition for specific mcp tool.
 * Mirrors backend ToolSchema.
 */
export type ToolSchema = {
  name_on_server: string;
  name_for_llm: string;
  description_for_llm: string;
  args_schema: ToolArgsSchema;
};
