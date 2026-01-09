"use client";

import { ListArea } from "@/ui/ListArea";
import { ChatSendoff } from "@/features/chat/ChatSendoff";
import { ChatArea } from "@/features/chat/ChatArea";
import { ChatMessage } from "@/features/chat/ChatMessage";
import { useState, useEffect } from "react";
import type { ToolSchema } from "@/models/toolSchema";
import { loadToolSchemaByRef } from "@/features/tools/toolschemas.storage";
import { loadAgents } from "@/features/agents/agents.storage";
import type { StoredItem } from "@/storage/operations";
import type { Agent } from "@/models/agent";
import { ChatMessageModel } from "@/models/chatMessage";
import { AgentBadgeList } from "@/features/chat/AgentBadgeList";
import { invokeAgent } from "@/features/chat/chat.invoke";


const BACKEND_AGENTS_MODE = true;

const FAKE_AGENT: StoredItem<Agent> = {
  id: "debug-agent",
  partitionKey: "debug-agent",
  container: "agents",
  name: "DebugAgent",
  description: "Debug agent (local dummy) to test backend streaming/invoke.",
  systemPrompt: "You are a helpful assistant for debugging. Respond succinctly.",
  directAnswerValidationPrompt: "Direct answer is always usable.",
  directAnswersAllowed: true,
  onlyOneModelCall: false,
  toolSchemas: [] // keep empty unless you want to test tool wiring
};

export default function ChatPage() {
  const [agents, setAgents] = useState<Array<StoredItem<Agent>>>([]);
  const [messages, setMessages] = useState<Array<ChatMessageModel>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<StoredItem<Agent> | null>(null);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [selectedToolSchemas, setSelectedToolSchemas] = useState<ToolSchema[]>([]);

  // ############################################ START FAKE STUFF
  useEffect(() => {
    if (!BACKEND_AGENTS_MODE) return;

    setSelectedAgent(FAKE_AGENT);
    setSelectedToolSchemas([]);
    setToolsError(null);
    setToolsLoading(false);
  }, []);
  // ############################################ END FAKE STUFF

  useEffect(() => {
    // ############################################ START FAKE STUFF
    if (BACKEND_AGENTS_MODE) return;
    // ############################################ END FAKE STUFF

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

  const handleSelectAgent = async (stored: StoredItem<Agent>) => {
    // ############################################ START FAKE STUFF
    if (BACKEND_AGENTS_MODE) return;
    // ############################################ END FAKE STUFF

    setSelectedAgent(stored);

    setToolsLoading(true);
    setToolsError(null);
    setSelectedToolSchemas([]);

    try {
      const refs = stored.toolSchemas ?? [];
      if (refs.length === 0) {
        setSelectedToolSchemas([]);
        return;
      }

      const storedTools = await Promise.all(refs.map((r) => loadToolSchemaByRef(r)));

      const tools = storedTools.map(({ id: _id, partitionKey: _pk, container: _c, ...tool }) => tool);

      setSelectedToolSchemas(tools);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load tools.";
      setToolsError(msg);
      setSelectedToolSchemas([]);
    } finally {
      setToolsLoading(false);
    }
  };

  const sendMessage = async (text: string) => {
    if (!selectedAgent) return;

    const userId = crypto.randomUUID();
    const aiId = crypto.randomUUID();

    setMessages((prev) => [...prev, { id: userId, role: "user", content: text }, { id: aiId, role: "ai", content: "" }]);

    try {
      await invokeAgent({
        message: text,
        agent: selectedAgent,
        toolSchemas: selectedToolSchemas,
        renderChunk: (appendText) => {
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: m.content + appendText } : m)));
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Stream failed.";
      setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: `Error: ${msg}` } : m)));
    }
  };

  return (
    <div className="container">
      {/* // ############################################ START FAKE STUFF */}
      {!BACKEND_AGENTS_MODE && (
        <ListArea title="Available Agents" variant="compact">
          <AgentBadgeList agents={agents} isLoading={isLoading} loadError={loadError} onSelect={handleSelectAgent} selectedAgent={selectedAgent} />
        </ListArea>
      )}
      {/* // ############################################ START FAKE STUFF */}

      <ChatArea>
        <ChatMessage role="ai">HALLO</ChatMessage>
        <ChatArea>
          {messages.map((m) => (
            <ChatMessage key={m.id} role={m.role}>
              {m.content}
            </ChatMessage>
          ))}
        </ChatArea>
      </ChatArea>

      {/* // ############################################ START FAKE STUFF */}
      <ChatSendoff disabled={BACKEND_AGENTS_MODE ? false : !selectedAgent || toolsLoading || !!toolsError} onSend={sendMessage} />
      {/* // ############################################ START FAKE STUFF */}
    </div>
  );
}
