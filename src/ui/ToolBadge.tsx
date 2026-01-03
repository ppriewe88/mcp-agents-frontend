import type { ToolSchemaRef } from "@/models/toolSchema";

type Props = {
  tool: ToolSchemaRef;
  onRemove?: (tool: ToolSchemaRef) => void; // optional
};

export function ToolBadge({ tool, onRemove }: Props) {
  return (
    <div
      className="toolBadge"
      title={`${tool.name_for_llm} @ ${tool.server_url}`}
    >
      <div className="toolBadgeText">
        <div className="toolBadgeName">{tool.name_for_llm}</div>
        <div className="toolBadgeMeta">{tool.server_url}</div>
      </div>

      {onRemove && (
        <button
          type="button"
          className="toolBadgeRemove"
          onClick={() => onRemove(tool)}
          aria-label="Remove tool"
        >
          ×
        </button>
      )}
    </div>
  );
}
