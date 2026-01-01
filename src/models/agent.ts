export type Agent = {
  name: string;
  description: string;
  systemPrompt: string;
  directAnswerValidationPrompt: string;
  directAnswersAllowed?: boolean;
};

export function normalizeAgent(agent: Agent): Agent {
  return {
    name: agent.name.trim(),
    description: agent.description.trim(),
    systemPrompt: agent.systemPrompt.trim(),
    directAnswersAllowed: agent.directAnswersAllowed ?? false,
    directAnswerValidationPrompt: agent.directAnswerValidationPrompt.trim(),
  };
}

export function validateAgent(agent: Agent): void {
  if (agent.name.trim().length === 0)
    throw new Error("Name must not be empty.");
  if (agent.description.trim().length === 0)
    throw new Error("Description must not be empty.");
  if (agent.description.trim().length === 0)
    throw new Error("System prompt must not be empty.");
  if (agent.directAnswerValidationPrompt.trim().length === 0)
    throw new Error("Direct answer validation prompt must not be empty.");
}
