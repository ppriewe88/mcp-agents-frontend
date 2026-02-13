"use client";

import { ChatPanelCard } from "@/features/chat/ChatPanelCard";
import { ChatSendoff } from "@/features/chat/ChatSendoff";
import { ChatArea } from "@/features/chat/ChatArea";
import { ChatMessage } from "@/features/chat/ChatMessage";
import { useState, useEffect } from "react";
import { loadToolSchemaByRef } from "@/features/tools/toolschemas.storage";
import { loadAgents, loadAgentByRef } from "@/features/agents/agents.storage";
import type { StoredItem } from "@/storage/operations";
import type { Agent, AgentRef } from "@/models/agent";
import { ChatMessageModel } from "@/models/chatMessage";
import { AgentBadgeList } from "@/features/chat/AgentBadgeList";
import { invokeAgent } from "@/features/chat/chat.invoke";
import { AgentThread } from "@/features/chat/AgentThread";
import type { StepItem, ResolvedAgent } from "@/features/chat/chat.invoke";

type ThreadItem = StepItem | { kind: "separator"; id: string };

export default function ChatPage() {
  const [agents, setAgents] = useState<Array<StoredItem<Agent>>>([]);
  const [messages, setMessages] = useState<Array<ChatMessageModel>>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [resolvedAgent, setResolvedAgent] = useState<ResolvedAgent | null>(null);
  const [resolvedSubagents, setResolvedSubagents] = useState<Array<ResolvedAgent> | null>(null);
  const [toolsLoading, setToolsLoading] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  const [threadItems, setThreadItems] = useState<ThreadItem[]>([]);

  // ############################################ USEEFFECT FOR AGENT LOADING
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

  // ############################################ HELPERS: RESOLVE TOOLS / SUBAGENTS
  const resolveTools = async (agent: StoredItem<Agent>) => {
    const refs = agent.toolSchemas ?? [];
    if (refs.length === 0) return [];
    const storedTools = await Promise.all(refs.map((r) => loadToolSchemaByRef(r)));
    return storedTools.map(({ id: _id, partitionKey: _pk, container: _c, ...tool }) => tool);
  };

  const resolveSubagent = async (ref: AgentRef): Promise<ResolvedAgent> => {
    const agent = await loadAgentByRef(ref);
    const toolSchemas = await resolveTools(agent);
    return { agent, toolSchemas };
  };

  // ############################################ SELECTION OF AGENT, LOADING OF ASSOCIATED TOOLS + SUBAGENTS
  const handleSelectAgent = async (stored: StoredItem<Agent>) => {
    setResolvedAgent({ agent: stored, toolSchemas: [] });
    setResolvedSubagents(null);
    setToolsLoading(true);
    setToolsError(null);

    try {
      const tools = await resolveTools(stored);
      setResolvedAgent({ agent: stored, toolSchemas: tools });

      const subRefs = stored.subAgents ?? [];
      const subagents = await Promise.all(subRefs.map(resolveSubagent));
      setResolvedSubagents(subagents);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load tools.";
      setToolsError(msg);
    } finally {
      setToolsLoading(false);
    }
  };

  // ############################################ SENDING MESSAGES [INVOKE AND STREAM]
  const sendMessage = async (text: string) => {
    if (!resolvedAgent) return;

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
        resolvedAgent: resolvedAgent,
        resolvedSubAgents: resolvedSubagents ?? undefined,
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
        <ChatPanelCard title="Available Agents">
          <AgentBadgeList agents={agents} isLoading={isLoading} loadError={loadError} onSelect={handleSelectAgent} selectedAgent={resolvedAgent?.agent ?? null} />
        </ChatPanelCard>

        <ChatArea>
          <ChatMessage role="ai">HALLO</ChatMessage>
          {messages.map((m) => (
            <ChatMessage key={m.id} role={m.role}>
              {m.content}
            </ChatMessage>
          ))}
        </ChatArea>

        <ChatPanelCard>
          <ChatSendoff disabled={!resolvedAgent || toolsLoading || !!toolsError} onSend={sendMessage} />
        </ChatPanelCard>
      </div>

      <div className="chatPageMain">
        <ChatPanelCard title="Tools & Subagents">T.B.D.</ChatPanelCard>
        <AgentThread items={threadItems} />
        <ChatPanelCard></ChatPanelCard>
      </div>
    </div>
  );
}