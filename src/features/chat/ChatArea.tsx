import type { ReactNode } from "react";
import { useEffect, useRef } from "react";

type Props = {
  children: ReactNode;
};

export function ChatArea({ children }: Props) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [children]);

  return (
    <div className="chatArea">
      {children}
      <div ref={endRef} />
    </div>
  );
}
