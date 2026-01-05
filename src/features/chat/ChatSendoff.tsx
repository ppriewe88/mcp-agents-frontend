"use client";

import { useState } from "react";
import { Button } from "@/ui/Button";

type Props = {
  onSend: (message: string) => void;
  disabled?: boolean;
};

export function ChatSendoff({ onSend, disabled }: Props) {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    onSend(trimmed);
    setMessage("");
  };

  return (
    <div className="chatSendoff">
      <div className="chatSendoffRow">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Type a message..."
          className="chatSendoffInput"
          disabled={disabled}
        />

        <Button
          label="Send"
          disabled={disabled || message.trim().length === 0}
          onClick={handleSend}
        />
      </div>
    </div>
  );
}
