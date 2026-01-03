import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
};

export function ListArea({ title, children }: Props) {
  return (
    <div className={"listArea"}>
      {title && <div className="listAreaTitle">{title}</div>}
      {children}
    </div>
  );
}
