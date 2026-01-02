import { ReactNode } from "react";

type CardProps = {
  title: string;
  dataId: string;
  children?: ReactNode;
  onClick?: () => void;
};

export function Card({ title, dataId, children, onClick }: CardProps) {
  return (
    <div
      className="card"
      data-id={dataId}
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className="cardTitle">{title}</div>
      {children && <div className="cardBody">{children}</div>}
    </div>
  );
}
