import type { ToolSchema, ToolArg, EmptyDefault } from "@/models/toolSchema";

/**
 * Sanitizes an LLM tool name to satisfy backend validation:
 * Allowed characters: letters, digits, '_', '-', '.'
 * Whitespace is converted to '_' for readability.
 */
export function sanitizeToolNameForLlm(name: string): string {
  const cleaned = name
    .trim()
    .replace(/\s+/g, "_")
    .replace(/[^A-Za-z0-9_.-]/g, "")
    .replace(/_+/g, "_");

  return cleaned;
}

export function isEmptyDefault(v: unknown): v is EmptyDefault {
  return (
    typeof v === "object" &&
    v !== null &&
    "kind" in v &&
    (v as { kind?: unknown }).kind === "EmptyDefault"
  );
}

/**
 * Converts the ToolArg.default to a string for form editing.
 */
export function defaultToString(d: ToolArg["default"]): string {
  if (d === undefined || d === null) return "";
  if (typeof d === "string") return d;
  if (isEmptyDefault(d)) return "EmptyDefault";
  return JSON.stringify(d);
}

/**
 * Parses the "Default" input field back into the typed union.
 * MVP rule: treat any non-empty value as string, except explicit EmptyDefault marker.
 */
export function parseDefaultValue(raw: string): string | EmptyDefault | null {
  const v = raw.trim();
  if (!v) return null;

  // allow common user inputs for the marker
  if (v === "EmptyDefault" || v === '{"kind":"EmptyDefault"}') {
    return { kind: "EmptyDefault" };
  }

  return v;
}

function normalizeToolArg(arg: ToolArg): ToolArg {
  return {
    name_on_server: arg.name_on_server.trim(),
    // For args we keep the user's value, but you may also choose to sanitize here.
    name_for_llm: arg.name_for_llm.trim(),
    description_for_llm: arg.description_for_llm.trim(),
    type: arg.type?.trim() || "string",
    required: arg.required ?? true,
    // keep null vs undefined intentional; keep EmptyDefault object as-is
    default: isEmptyDefault(arg.default) ? arg.default : arg.default ?? null,
  };
}

/**
 * Normalizes a ToolSchema into a backend-aligned shape (client-side).
 * - trims strings
 * - sanitizes name_for_llm
 * - enforces args_schema.type="object" and additionalProperties=false
 * - normalizes ToolArg defaults/required/type/strings
 */
export function normalizeToolSchema(schema: ToolSchema): ToolSchema {
  return {
    server_url: schema.server_url.trim(),
    name_on_server: schema.name_on_server.trim(),
    name_for_llm: sanitizeToolNameForLlm(schema.name_for_llm),
    description_for_llm: schema.description_for_llm.trim(),
    args_schema: {
      type: "object",
      additionalProperties: false,
      properties: (schema.args_schema?.properties ?? []).map(normalizeToolArg),
    },
  };
}

/**
 * Validates a ToolSchema to prevent backend 422s and enforce sane data.
 */
export function validateToolSchema(schema: ToolSchema): void {
  const serverUrl = schema.server_url.trim();
  const nameOnServer = schema.name_on_server.trim();
  const nameForLlmRaw = schema.name_for_llm.trim();
  const desc = schema.description_for_llm.trim();

  if (serverUrl.length === 0) throw new Error("Server URL must not be empty.");
  if (nameOnServer.length === 0)
    throw new Error("Tool name_on_server must not be empty.");
  if (nameForLlmRaw.length === 0)
    throw new Error("Tool name_for_llm must not be empty.");
  if (desc.length === 0)
    throw new Error("Tool description_for_llm must not be empty.");

  // Ensure tool name is already sanitized (UI should enforce this)
  const sanitized = sanitizeToolNameForLlm(nameForLlmRaw);
  if (sanitized !== nameForLlmRaw) {
    throw new Error(
      "Tool name_for_llm contains invalid characters. Allowed: letters, digits, '_', '-', '.'. Whitespace is not allowed."
    );
  }

  if (!/^[A-Za-z0-9_.-]+$/.test(nameForLlmRaw)) {
    throw new Error(
      "Tool name_for_llm is invalid. Allowed characters: letters, digits, '_', '-', '.'."
    );
  }

  // args_schema checks
  if (!schema.args_schema || schema.args_schema.type !== "object") {
    throw new Error("args_schema.type must be 'object'.");
  }
  if (schema.args_schema.additionalProperties !== false) {
    throw new Error("args_schema.additionalProperties must be false.");
  }

  const props = schema.args_schema.properties ?? [];
  if (!Array.isArray(props)) {
    throw new Error("args_schema.properties must be a list.");
  }

  for (const arg of props) {
    const nServer = arg.name_on_server.trim();
    const nLlm = arg.name_for_llm.trim();
    const t = (arg.type ?? "string").trim();

    if (nServer.length === 0)
      throw new Error("ToolArg name_on_server must not be empty.");
    if (nLlm.length === 0)
      throw new Error("ToolArg name_for_llm must not be empty.");
    if (t.length === 0) throw new Error("ToolArg type must not be empty.");

    if (typeof (arg.required ?? true) !== "boolean") {
      throw new Error("ToolArg required must be a boolean.");
    }

    // Optional: enforce same charset for arg name_for_llm (keeps it consistent)
    if (!/^[A-Za-z0-9_.-]+$/.test(nLlm)) {
      throw new Error(
        "ToolArg name_for_llm is invalid. Allowed characters: letters, digits, '_', '-', '.'."
      );
    }

    const d = arg.default;
    const ok = d === null || typeof d === "string" || isEmptyDefault(d);
    if (!ok) {
      throw new Error("ToolArg default must be string, EmptyDefault, or null.");
    }
  }
}
