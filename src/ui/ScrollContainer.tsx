import type { ReactNode } from "react";

type ScrollContainerProps = {
  children: ReactNode;
  title?: string;
};

export function ScrollContainer({ children, title }: ScrollContainerProps) {
  return (
    <div className="scrollContainerWrapper">
      {title && <div className="scrollContainerTitle">{title}</div>}
      <div className="scrollContainer">{children}</div>
    </div>
  );
}
