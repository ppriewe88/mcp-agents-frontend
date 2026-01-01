import type { Agent } from "@/models/agent";
import {
  saveItemToContainer,
  loadItems,
  type StoredItem,
} from "@/routing/storage";

const CONTAINER = "agents";

export function saveAgent(agent: Agent): Promise<StoredItem<Agent>> {
  return saveItemToContainer(CONTAINER, agent);
}

export function loadAgents(): Promise<Array<StoredItem<Agent>>> {
  return loadItems<Agent>(CONTAINER);
}
