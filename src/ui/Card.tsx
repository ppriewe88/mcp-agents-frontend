import type { ReactNode, DragEventHandler } from "react";

type CardProps = {
  title: string;
  dataId: string;
  dataContainer: string;
  children?: ReactNode;
  onClick?: () => void;

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
  draggable = false,
  onDragStart,
  onDragOver,
  onDrop,
}: CardProps) {
  return (
    <div
      className="card"
      data-id={dataId}
      data-container={dataContainer}
      onClick={onClick}
      role={onClick ? "button" : undefined}
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

// import { ReactNode } from "react";

// type CardProps = {
//   title: string;
//   dataId: string;
//   dataContainer: string;
//   children?: ReactNode;
//   onClick?: () => void;
//   draggable?: boolean;
// };

// export function Card({
//   title,
//   dataId,
//   dataContainer,
//   children,
//   onClick,
// }: CardProps) {
//   return (
//     <div
//       className="card"
//       data-id={dataId}
//       data-container={dataContainer}
//       onClick={onClick}
//       role={onClick ? "button" : undefined}
//     >
//       <div className="cardTitle">{title}</div>
//       {children && <div className="cardBody">{children}</div>}
//     </div>
//   );
// }
