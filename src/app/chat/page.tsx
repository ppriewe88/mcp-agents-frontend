"use client";

import { ListArea } from "@/ui/ListArea";
import { useState, useEffect } from "react";
import { loadAgents } from "@/features/agents/agents.storage";
import type { StoredItem } from "@/storage/storage";
import type { Agent } from "@/models/agent";
import { AgentBadgeList } from "@/features/chat/AgentBadgeList";
import { invokeAgent } from "@/features/chat/chat.invoke";

export default function ChatPage() {
  const [agents, setAgents] = useState<Array<StoredItem<Agent>>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<StoredItem<Agent> | null>(
    null
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      setLoadError(null);
      try {
        const agents = await loadAgents();
        if (!cancelled) setAgents(agents);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to load agents.";
        if (!cancelled) setLoadError(msg);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectAgent = (stored: StoredItem<Agent>) => {
    setSelectedAgent(stored);
  };

  return (
    <div className="container">
      <ListArea title="Available Agents" variant="compact">
        <AgentBadgeList
          agents={agents}
          isLoading={isLoading}
          loadError={loadError}
          onSelect={handleSelectAgent}
          selectedAgent={selectedAgent}
        />
      </ListArea>

      {/* ############################### minimal test invoke UI */}
      <div className="mt-4 space-y-2">
        <input
          type="text"
          value="Hello from ChatPage test message"
          readOnly
          className="w-full px-2 py-1 border rounded text-sm"
        />

        <button
          type="button"
          onClick={() => {
            if (!selectedAgent) return;
            invokeAgent(selectedAgent, "Hello from ChatPage test message");
          }}
          className="px-3 py-2 border rounded text-sm"
        >
          Invoke agent
        </button>
      </div>
    </div>
  );
}
