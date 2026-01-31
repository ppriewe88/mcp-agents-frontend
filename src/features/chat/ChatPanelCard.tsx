import type { ReactNode } from "react";

type Props = {
  title?: string;
  children?: ReactNode;
};

export function ChatPanelCard({ title, children }: Props) {
  return (
    <div className="chatPanelCard">
      {title && <div className="chatPanelCardTitle">{title}</div>}
      {children}
    </div>
  );
}
