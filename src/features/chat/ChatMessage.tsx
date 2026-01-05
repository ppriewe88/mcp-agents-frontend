import type { ReactNode } from "react";
import type { ChatRole } from "@/models/chatMessage";

type Props = {
  role: ChatRole;
  children: ReactNode;
};

export function ChatMessage({ role, children }: Props) {
  return (
    <div className={`chatMessage ${role === "user" ? "fromUser" : "fromAi"}`}>
      {children}
    </div>
  );
}
