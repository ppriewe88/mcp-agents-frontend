"use client";

import { ChatPanelCard } from "@/features/chat/ChatPanelCard";
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
import { AgentThread } from "@/features/chat/AgentThread";
import type { StepItem } from "@/features/chat/chat.invoke";

const BACKEND_AGENTS_MODE = false;

const FAKE_AGENT: StoredItem<Agent> = {
  id: "debug-agent",
  partitionKey: "debug-agent",
  container: "agents",
  name: "DebugAgent",
  description: "Debug agent (local dummy) to test backend streaming/invoke.",
  systemPrompt: "You are a helpful assistant for debugging. Respond succinctly.",
  directAnswerValidationPrompt: "Direct answer is always usable.",
  onlyOneModelCall: false,
  toolSchemas: []
};

type ThreadItem = StepItem | { kind: "separator"; id: string };

export default function ChatPage() {
  const [agents, setAgents] = useState<Array<StoredItem<Agent>>>([]);
  const [messages, setMessages] = useState<Array<ChatMessageModel>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<StoredItem<Agent> | null>(null);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [selectedToolSchemas, setSelectedToolSchemas] = useState<ToolSchema[]>([]);
  const [threadItems, setThreadItems] = useState<ThreadItem[]>([]);

  // ############################################ USEEFFECT FOR FAKE AGENT [REMOVE ENTIRELY LATER] ---------> LOAD FAKE AGENT
  useEffect(() => {
    if (!BACKEND_AGENTS_MODE) return;

    setSelectedAgent(FAKE_AGENT);
    setSelectedToolSchemas([]);
    setToolsError(null);
    setToolsLoading(false);
  }, []);

  // ############################################ USEEFFECT FOR AGENT LOADING
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

  // ############################################ SELECTION OF AGENT, LOADING OF ASSOCIATED TOOLS
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

  // ############################################ SENDING MESSAGES [INVOKE AND STREAM]
  const sendMessage = async (text: string) => {
    if (!selectedAgent) return;

    const userId = crypto.randomUUID();
    const aiId = crypto.randomUUID();

    const userMsg: ChatMessageModel = {
      id: userId,
      role: "user",
      content: text
    };
    const aiMsg: ChatMessageModel = { id: aiId, role: "ai", content: "" };
    const nextMessages = [...messages, userMsg, aiMsg];
    const sentMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setThreadItems((prev) => [...prev, { kind: "separator", id: crypto.randomUUID() }]);

    try {
      await invokeAgent({
        messages: sentMessages,
        agent: selectedAgent,
        toolSchemas: selectedToolSchemas,
        onFinalText: (appendText) => {
          setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: m.content + appendText } : m)));
        },
        onStep: (item) => {
          console.log("[STEP]", item.text);
          setThreadItems((prev) => [...prev, item]);
        }
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Stream failed.";
      setMessages((prev) => prev.map((m) => (m.id === aiId ? { ...m, content: `Error: ${msg}` } : m)));
    }
  };

  return (
    <div className="chatPageLayout">
      <div className="chatPageMain">
        {/* // ############################################ START FAKE STUFF */}
        {!BACKEND_AGENTS_MODE && (
          <ChatPanelCard title="Available Agents">
            <AgentBadgeList agents={agents} isLoading={isLoading} loadError={loadError} onSelect={handleSelectAgent} selectedAgent={selectedAgent} />
          </ChatPanelCard>
        )}
        {/* // ############################################ START FAKE STUFF */}

        <ChatArea>
          <ChatMessage role="ai">HALLO</ChatMessage>
          {messages.map((m) => (
            <ChatMessage key={m.id} role={m.role}>
              {m.content}
            </ChatMessage>
          ))}
        </ChatArea>

        {/* // ############################################ START FAKE STUFF */}
        <ChatPanelCard>
          <ChatSendoff disabled={BACKEND_AGENTS_MODE ? false : !selectedAgent || toolsLoading || !!toolsError} onSend={sendMessage} />
        </ChatPanelCard>
        {/* // ############################################ START FAKE STUFF */}
      </div>

      <div className="chatPageMain">
        <ChatPanelCard title="Tools & Subagents">T.B.D.</ChatPanelCard>
        <AgentThread items={threadItems} />
        <ChatPanelCard></ChatPanelCard>
      </div>
    </div>
  );
}
