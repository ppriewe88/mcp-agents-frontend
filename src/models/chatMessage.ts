export type ChatRole = "user" | "ai";

export type ChatMessageModel = {
  id: string;
  role: ChatRole;
  content: string;
};
