import { apiRequest } from "../../../shared/api/apiClient";

export type TagDto = {
  id: number;
  name: string;
};

function normalizeTag(tag: unknown): TagDto {
  const value = tag as {
    id?: number | string;
    name?: string;
  };

  return {
    id: Number(value?.id ?? 0),
    name: String(value?.name ?? ""),
  };
}

export async function getTags(): Promise<TagDto[]> {
  const tags = await apiRequest<unknown[]>("/tags", {
    method: "GET",
  });

  return tags.map(normalizeTag).filter((tag) => tag.id > 0 && tag.name);
}