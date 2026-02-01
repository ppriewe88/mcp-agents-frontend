import type { ReactNode } from "react";
import { motion } from "motion/react";

type Props = {
  level: "outer_agent" | "inner_agent";
  children: ReactNode;
};

export function AgentThreadMessage({ level, children }: Props) {
  const fromLeft = level === "outer_agent";
  const startX = fromLeft ? 30 : -30;
  return (
    <motion.div
      animate={{
        opacity: [0, 0.1, 0.3, 1],
        transform: [
          `translateX(${startX}px)`,
          `translateX(${-startX / 2}px)`,
          `translateX(${startX / 4}px)`,
          "translateX(0px)" // final position
        ]
      }}
      transition={{
        duration: 1,
        ease: "easeInOut",
        times: [0, 0.2, 0.5, 1]
      }}
      className={`agentThreadMessage ${level === "outer_agent" ? "fromOuter" : "fromInner"}`}
    >
      {children}
    </motion.div>
  );
}