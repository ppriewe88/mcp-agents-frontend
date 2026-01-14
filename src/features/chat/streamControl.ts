export type StreamChunk =
  | { type: "text_step"; data: string }
  | { type: "text_final"; data: string };

export type StreamControlResult =
  | { kind: "step"; text: string }
  | { kind: "final"; text: string }
  | { kind: "ignore" };

export function streamControl(chunk: StreamChunk): StreamControlResult {
  if (chunk.type === "text_step") return { kind: "step", text: chunk.data };
  if (chunk.type === "text_final") return { kind: "final", text: chunk.data };
  return { kind: "ignore" };
}
