export type StoredItem<T> = T & {
  id: string;
  partitionKey: string;
  container: string;
};

export async function saveItemToContainer<TSchema>(
  container: string,
  item: TSchema
): Promise<StoredItem<TSchema>> {
  const res = await fetch(`/api/storage/${container}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Save failed (${res.status}): ${msg || res.statusText}`);
  }

  return (await res.json()) as StoredItem<TSchema>;
}

export async function loadItems<TSchema>(
  container: string
): Promise<Array<StoredItem<TSchema>>> {
  const res = await fetch(`/api/storage/${container}`, {
    method: "GET",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Load failed (${res.status}): ${msg || res.statusText}`);
  }

  return (await res.json()) as Array<StoredItem<TSchema>>;
}

export async function updateItemInContainer<TSchema>(
  container: string,
  item: StoredItem<TSchema>
): Promise<StoredItem<TSchema>> {
  const res = await fetch(`/api/storage/${container}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(item),
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(`Update failed (${res.status}): ${msg || res.statusText}`);
  }

  return (await res.json()) as StoredItem<TSchema>;
}

export async function loadItemById<TSchema>(
  container: string,
  id: string
): Promise<StoredItem<TSchema>> {
  const res = await fetch(
    `/api/storage/${container}?id=${encodeURIComponent(id)}`,
    { method: "GET" }
  );

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(
      `Load by id failed (${res.status}): ${msg || res.statusText}`
    );
  }

  return (await res.json()) as StoredItem<TSchema>;
}
