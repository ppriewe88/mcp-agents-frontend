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

export type StreamControlResult = { kind: "step"; text: string; level: "outer_agent" | "inner_agent" } | { kind: "outer_final"; text: string } | { kind: "inner_final"; text: string } | { kind: "ignore" };

export function streamControl(chunk: StreamChunk): StreamControlResult {
  if (chunk.type === "text_step") return { kind: "step", text: chunk.data, level: chunk.level };
  if (chunk.type === "tool_results") return { kind: "step", text: chunk.data, level: chunk.level };
  if (chunk.type === "text_final" && chunk.level === "outer_agent") return { kind: "outer_final", text: chunk.data };
  if (chunk.type === "text_final" && chunk.level === "inner_agent") return { kind: "inner_final", text: chunk.data };
  return { kind: "ignore" };
}
