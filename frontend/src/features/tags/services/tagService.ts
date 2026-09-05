import { apiRequest } from "../../../shared/api/apiClient";
import type { BasePagedResponse } from "../../apartments/services/apartmentService";

/** Highest page_size the API accepts. */
const MAX_PAGE_SIZE = 50;

const DEFAULT_PAGE_SIZE = 10;

export type TagSearchParams = {
  page_number?: number;
  page_size?: number;
  name?: string;
};

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

function buildQuery(params: Record<string, string | number | undefined | null>) {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "") {
      return;
    }

    searchParams.set(key, String(value));
  });

  const queryString = searchParams.toString();

  return queryString ? `?${queryString}` : "";
}

export async function getTags(
  args?: TagSearchParams
): Promise<BasePagedResponse<TagDto>> {
  const pageSize = args?.page_size ?? DEFAULT_PAGE_SIZE;

  const query = buildQuery({
    page_number: args?.page_number ?? 1,
    page_size: pageSize,
    name: args?.name,
  });

  const response = await apiRequest<BasePagedResponse<unknown>>(
    `/tags${query}`,
    { method: "GET" }
  );

  return {
    ...response,
    items: (response.items ?? [])
      .map(normalizeTag)
      .filter((tag) => tag.id > 0 && tag.name),
  };
}

/** The apartment wizard offers every tag at once, so it walks through all pages. */
export async function getAllTags(): Promise<TagDto[]> {
  const tags: TagDto[] = [];

  let pageNumber = 1;

  for (;;) {
    const page = await getTags({
      page_number: pageNumber,
      page_size: MAX_PAGE_SIZE,
    });

    tags.push(...page.items);

    const pageCount = Math.ceil(page.total / MAX_PAGE_SIZE);

    if (pageNumber >= pageCount) {
      return tags;
    }

    pageNumber += 1;
  }
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
