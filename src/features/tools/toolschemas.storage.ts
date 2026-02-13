import type { ToolSchema, ToolSchemaRef } from "@/models/toolSchema";
import { saveItemToContainer, loadItems, updateItemInContainer, loadItemById, type StoredItem } from "@/storage/operations";

const CONTAINER = "toolschemas";

export function saveToolSchema(schema: ToolSchema): Promise<StoredItem<ToolSchema>> {
  return saveItemToContainer(CONTAINER, schema);
}

export function loadToolSchemas(): Promise<Array<StoredItem<ToolSchema>>> {
  return loadItems<ToolSchema>(CONTAINER);
}

export function updateToolSchema(schema: StoredItem<ToolSchema>): Promise<StoredItem<ToolSchema>> {
  return updateItemInContainer(CONTAINER, schema);
}

export function loadToolSchemaByRef(ref: ToolSchemaRef): Promise<StoredItem<ToolSchema>> {
  return loadItemById<ToolSchema>(ref.container, ref.tool_id);
}

export function loadToolSchemaById(id: string): Promise<StoredItem<ToolSchema>> {
  return loadItemById<ToolSchema>(CONTAINER, id);
}
