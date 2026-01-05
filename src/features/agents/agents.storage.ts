import type { Agent } from "@/models/agent";
import {
  saveItemToContainer,
  loadItems,
  updateItemInContainer,
  type StoredItem,
} from "@/storage/operations";

const CONTAINER = "agents";

export function saveAgent(agent: Agent): Promise<StoredItem<Agent>> {
  return saveItemToContainer(CONTAINER, agent);
}

export function loadAgents(): Promise<Array<StoredItem<Agent>>> {
  return loadItems<Agent>(CONTAINER);
}

export function updateAgent(
  agent: StoredItem<Agent>
): Promise<StoredItem<Agent>> {
  return updateItemInContainer(CONTAINER, agent);
}
