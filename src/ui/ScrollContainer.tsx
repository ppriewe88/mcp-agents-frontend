import type { ReactNode } from "react";

type ScrollContainerProps = {
  children: ReactNode;
};

export function ScrollContainer({ children }: ScrollContainerProps) {
  return <div className="scrollContainer">{children}</div>;
}
