import type { ToolSchemaRef } from "@/models/toolSchema";

type Props = {
  toolRef: ToolSchemaRef;
  onRemove?: (tool: ToolSchemaRef) => void; // optional
};

export function ToolBadge({ toolRef, onRemove }: Props) {
  return (
    <div
      className="toolBadge"
      title={`${toolRef.name_for_llm} @ ${toolRef.server_url}`}
    >
      <div className="toolBadgeText">
        <div className="toolBadgeName">{toolRef.name_for_llm}</div>
        <div className="toolBadgeMeta">{toolRef.server_url}</div>
      </div>

      {onRemove && (
        <button
          type="button"
          className="toolBadgeRemove"
          onClick={() => onRemove(toolRef)}
          aria-label="Remove tool"
        >
          ×
        </button>
      )}
    </div>
  );
}
