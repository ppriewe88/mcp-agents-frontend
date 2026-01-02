import type { ToolSchema } from "@/models/toolSchema";
import {
  saveItemToContainer,
  loadItems,
  updateItemInContainer,
  type StoredItem,
} from "@/storage/storage";

const CONTAINER = "toolschemas";

export function saveToolSchema(
  schema: ToolSchema
): Promise<StoredItem<ToolSchema>> {
  return saveItemToContainer(CONTAINER, schema);
}

export function loadToolSchemas(): Promise<Array<StoredItem<ToolSchema>>> {
  return loadItems<ToolSchema>(CONTAINER);
}

export function updateToolSchema(
  schema: StoredItem<ToolSchema>
): Promise<StoredItem<ToolSchema>> {
  return updateItemInContainer(CONTAINER, schema);
}
