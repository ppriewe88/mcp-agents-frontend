export type StreamChunk =
  | {
      level: "outer_agent" | "inner_agent";
      type: "text_step";
      data: string;
    }
  | {
      level: "outer_agent" | "inner_agent";
      type: "text_final";
      data: string;
    }
  | {
      level: "outer_agent" | "inner_agent";
      type: "tool_results";
      data: string;
    };

export type StreamControlResult =
  | { kind: "step"; text: string }
  | { kind: "final"; text: string }
  | { kind: "ignore" };

export function streamControl(chunk: StreamChunk): StreamControlResult {
  if (chunk.type === "text_step") return { kind: "step", text: chunk.data };
  if (chunk.type === "tool_results") return { kind: "step", text: chunk.data };
  if (chunk.type === "text_final" && chunk.level === "outer_agent")
    return { kind: "final", text: chunk.data };
  return { kind: "ignore" };
}
