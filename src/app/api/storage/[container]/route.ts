import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  cosmosClient,
  COSMOS_DATABASE_ID,
  COSMOS_PARTITION_KEY_VALUE,
} from "@/storage/cosmos";

type Params = { container: string };
type Ctx = { params: Promise<Params> };

export async function POST(req: Request, ctx: Ctx) {
  const { container: containerId } = await ctx.params;

  const body = await req.json();

  const item = {
    id: randomUUID(),
    partitionKey: COSMOS_PARTITION_KEY_VALUE,
    container: containerId,
    ...body,
  };

  const container = cosmosClient
    .database(COSMOS_DATABASE_ID)
    .container(containerId);

  const { resource } = await container.items.create(item);

  return NextResponse.json(resource, { status: 201 });
}

export async function GET(_req: Request, ctx: Ctx) {
  const { container: containerId } = await ctx.params;

  const container = cosmosClient
    .database(COSMOS_DATABASE_ID)
    .container(containerId);

  const query = { query: "SELECT * FROM c" };
  const { resources } = await container.items
    .query(query, { partitionKey: COSMOS_PARTITION_KEY_VALUE })
    .fetchAll();

  return NextResponse.json(resources, { status: 200 });
}

export async function PUT(req: Request, ctx: Ctx) {
  const { container: containerId } = await ctx.params;

  const body = await req.json();

  if (!body?.id) {
    return NextResponse.json(
      { error: "Missing id for update." },
      { status: 400 }
    );
  }

  const item = {
    ...body,
    partitionKey: COSMOS_PARTITION_KEY_VALUE,
    container: containerId,
  };

  const container = cosmosClient
    .database(COSMOS_DATABASE_ID)
    .container(containerId);

  const { resource } = await container.items.upsert(item);

  return NextResponse.json(resource, { status: 200 });
}
