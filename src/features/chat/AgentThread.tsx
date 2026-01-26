import { useEffect, useRef } from "react";
import { AgentThreadMessage } from "@/features/chat/AgentThreadMessage";
import type { StepItem } from "@/features/chat/chat.invoke";

type ThreadItem = StepItem | { kind: "separator"; id: string };

type Props = {
  items: ThreadItem[];
};

export function AgentThread({items}: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [items]);

  return (
    <aside className="agentThread">
      {items.map((item) => {
        if (item.kind === "separator") {
          return (
            <div key={item.id} className="agentThreadSeparator">
              ─────
            </div>
          );
        }
        return (
          <AgentThreadMessage key={item.id} level={item.level}>
            {item.text}
          </AgentThreadMessage>
        );
      })}
      <div ref={endRef} />
    </aside>
  );
}
