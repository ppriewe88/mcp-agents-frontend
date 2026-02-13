import type { AgentRef } from "@/models/agent";

type Props = {
  agentRef: AgentRef;
  onClick?: (agentRef: AgentRef) => void;
  selected?: boolean;
  onRemove?: (agentRef: AgentRef) => void; // optional
};

export function AgentBadge({ agentRef, onClick, selected, onRemove }: Props) {
  const isClickable = Boolean(onClick);

  const className = selected ? "agentBadge agentBadge--selected" : "agentBadge";
  return (
    <div
      className={className}
      title={agentRef.name}
      role={isClickable ? "button" : undefined}
      tabIndex={isClickable ? 0 : undefined}
      onClick={isClickable ? () => onClick?.(agentRef) : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") onClick?.(agentRef);
            }
          : undefined
      }
    >
      <div className="agentBadgeText" title={agentRef.name}>
        <div className="agentBadgeName">{agentRef.name}</div>
      </div>

      {onRemove && (
        <button
          type="button"
          className="toolBadgeRemove"
          onClick={() => onRemove(agentRef)}
          aria-label="Remove agent"
        >
          ×
        </button>
      )}
    </div>
  );
}
