import type { ReactNode } from "react";

type Props = {
  title?: string;
  children: ReactNode;
};

export function ListAreaHalf({ title, children }: Props) {
  return (
    <div className={"listAreaHalf"}>
      {title && <div className="listAreaTitle">{title}</div>}
      {children}
    </div>
  );
}
