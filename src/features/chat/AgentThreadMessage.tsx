import type { ReactNode } from "react";

type Props = {
  level: "outer_agent" | "inner_agent";
  children: ReactNode;
};

export function AgentThreadMessage({ level, children }: Props) {
  return (
    <div className={`agentThreadMessage ${level === "outer_agent" ? "fromOuter" : "fromInner"}`}>
      {children}
    </div>
  );
}