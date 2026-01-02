import { CosmosClient } from "@azure/cosmos";

const endpoint = process.env.COSMOS_ENDPOINT;
const key = process.env.COSMOS_KEY;

if (!endpoint || !key) {
  throw new Error("Missing COSMOS_ENDPOINT or COSMOS_KEY in environment.");
}

export const cosmosClient = new CosmosClient({ endpoint, key });

export const COSMOS_DATABASE_ID =
  process.env.COSMOS_DATABASE_ID ?? "mcp-agents";
export const COSMOS_PARTITION_KEY_VALUE =
  process.env.COSMOS_PARTITION_KEY_VALUE ?? "default";
