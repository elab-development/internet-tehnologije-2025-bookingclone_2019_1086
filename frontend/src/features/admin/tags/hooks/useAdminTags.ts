import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import {
  createTag,
  deleteTag,
  getTags,
  updateTag,
  type TagDto,
  type TagPayload,
} from "../../../tags/services/tagService";

const PAGE_SIZE = 10;

export function useAdminTags() {
  const { t } = useTranslation();

  const [tags, setTags] = useState<TagDto[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getTags({
        page_number: page,
        page_size: PAGE_SIZE,
      });

      setTags(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(getMessage(loadError, t("admin.tags.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  }, [page, t]);

  useEffect(() => {
    load();
  }, [load]);

  function goToPage(nextPage: number) {
    setPage(nextPage);
  }

  function getMessage(value: unknown, fallback: string) {
    if (value instanceof Error) {
      return value.message;
    }

    return fallback;
  }

  async function save(payload: TagPayload, editingId: number | null) {
    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      if (editingId === null) {
        await createTag(payload);
        setMessage(t("admin.tags.created"));
      } else {
        await updateTag(editingId, payload);
        setMessage(t("admin.tags.updated"));
      }

      // Tags are sorted by name, so a saved tag can land on any page.
      await load();

      return true;
    } catch (saveError) {
      setError(getMessage(saveError, t("admin.tags.errors.saveFailed")));
      return false;
    } finally {
      setIsSaving(false);
    }
  }

  async function remove(tag: TagDto) {
    if (busyId !== null) {
      return;
    }

    setBusyId(tag.id);
    setError(null);
    setMessage(null);

    try {
      await deleteTag(tag.id);

      setMessage(t("admin.tags.deleted"));

      // Removing the last row of a page would leave it empty, so step back instead.
      if (tags.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        await load();
      }
    } catch (deleteError) {
      setError(getMessage(deleteError, t("admin.tags.errors.deleteFailed")));
    } finally {
      setBusyId(null);
    }
  }

  return {
    tags,
    page,
    pageSize: PAGE_SIZE,
    total,
    isLoading,
    error,
    message,
    busyId,
    isSaving,
    save,
    remove,
    goToPage,
    isEmpty: !isLoading && !error && tags.length === 0,
  };
}
