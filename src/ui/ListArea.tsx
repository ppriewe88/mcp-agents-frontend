import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
  variant?: "default" | "compact";
};

export function ListArea({ title, children, variant = "default" }: Props) {
  const className = variant === "compact" ? "listArea compact" : "listArea";
  return (
    <div className={className}>
      {title && <div className="listAreaTitle">{title}</div>}
      {children}
    </div>
  );
}
