import { ReactNode } from "react";

type CardProps = {
  title: string;
  children?: ReactNode;
  onClick?: () => void;
};

export function Card({ title, children, onClick }: CardProps) {
  return (
    <div
      className="card"
      onClick={onClick}
      role={onClick ? "button" : undefined}
    >
      <div className="cardTitle">{title}</div>
      {children && <div className="cardBody">{children}</div>}
    </div>
  );
}
