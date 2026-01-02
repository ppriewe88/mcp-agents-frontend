import { ReactNode } from "react";

type CardProps = {
  title: string;
  dataId: string;
  dataContainer: string;
  children?: ReactNode;
  onClick?: () => void;
};

export function Card({
  title,
  dataId,
  dataContainer,
  children,
  onClick,
}: CardProps) {
  return (
    <div
      className="card"
      data-id={dataId}
      data-container={dataContainer}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className="cardTitle">{title}</div>
      {children && <div className="cardBody">{children}</div>}
    </div>
  );
}
