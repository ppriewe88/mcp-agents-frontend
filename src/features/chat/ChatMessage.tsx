import type { ReactNode } from "react";
import type { ChatRole } from "@/models/chatMessage";
import { motion } from "motion/react";

type Props = {
  role: ChatRole;
  children: ReactNode;
};

export function ChatMessage({ role, children }: Props) {
  const fromLeft = role === "ai";
  const startX = fromLeft ? 50 : -50;
  return (
    <motion.div
      animate={{
        opacity: [0, 0.3, 0.7, 1],
        transform: [
          `translateX(${startX}px)`,
          `translateX(${-startX / 2}px)`,
          `translateX(${startX / 4}px)`,
          "translateX(0px)" // final position
        ]
      }}
      transition={{
        duration: 1.5,
        ease: "easeInOut",
        times: [0, 0.4, 0.7, 1]
      }}
      className={`chatMessage ${role === "user" ? "fromUser" : "fromAi"}`}
    >
      {children}
    </motion.div>
  );
}
