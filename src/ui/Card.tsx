import type { ReactNode, DragEventHandler } from "react";

type CardVariant = "default" | "agent" | "orchestrator" | "toolschema" | "server" | "servertool";

type CardProps = {
  title: string;
  dataId: string;
  dataContainer: string;
  children?: ReactNode;
  onClick?: () => void;

  // optional coloring
  variant?: CardVariant;

  // hover effects
  isHighlighted?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;

  // optional Drag & Drop (default: disabled)
  draggable?: boolean;
  onDragStart?: DragEventHandler<HTMLDivElement>;
  onDragOver?: DragEventHandler<HTMLDivElement>;
  onDrop?: DragEventHandler<HTMLDivElement>;
};

export function Card({
  title,
  dataId,
  dataContainer,
  children,
  onClick,
  variant = "default",
  // hover effects
  isHighlighted = false,
  onMouseEnter,
  onMouseLeave,
  // dragging
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop
}: CardProps) {
  return (
    <div
      className={`card ${isHighlighted ? "highlighted" : ""}`}
      data-variant={variant}
      data-id={dataId}
      data-container={dataContainer}
      onClick={onClick}
      title={title}
      role={onClick ? "button" : undefined}
      // highlighting
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-highlighted={isHighlighted ? "true" : "false"}
      // dragging
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="cardTitle">{title}</div>
      {children && <div className="cardBody">{children}</div>}
    </div>
  );
}
