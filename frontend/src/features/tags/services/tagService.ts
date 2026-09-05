import { apiRequest } from "../../../shared/api/apiClient";

export type TagDto = {
  id: number;
  name: string;
  icon_key: string;
  svg_icon: string | null;
};

export type TagPayload = {
  name: string;
  icon_key: string;
  svg_icon: string | null;
};

function normalizeTag(tag: unknown): TagDto {
  const value = tag as {
    id?: number | string;
    name?: string;
    icon_key?: string;
    svg_icon?: string | null;
  };

  return {
    id: Number(value?.id ?? 0),
    name: String(value?.name ?? ""),
    icon_key: String(value?.icon_key ?? ""),
    svg_icon: value?.svg_icon ?? null,
  };
}

export async function getTags(): Promise<TagDto[]> {
  const tags = await apiRequest<unknown[]>("/tags", {
    method: "GET",
  });

  return tags.map(normalizeTag).filter((tag) => tag.id > 0 && tag.name);
}

export async function createTag(payload: TagPayload): Promise<TagDto> {
  const created = await apiRequest<unknown>("/tags", {
    method: "POST",
    auth: true,
    body: JSON.stringify(payload),
  });

  return normalizeTag(created);
}

export async function updateTag(
  tagId: number,
  payload: TagPayload
): Promise<TagDto> {
  const updated = await apiRequest<unknown>(`/tags/${tagId}`, {
    method: "PUT",
    auth: true,
    body: JSON.stringify(payload),
  });

  return normalizeTag(updated);
}

export async function deleteTag(tagId: number): Promise<void> {
  await apiRequest<void>(`/tags/${tagId}`, {
    method: "DELETE",
    auth: true,
  });
}
