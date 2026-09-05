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

export function useAdminTags() {
  const { t } = useTranslation();

  const [tags, setTags] = useState<TagDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      setTags(await getTags());
    } catch (loadError) {
      setError(getMessage(loadError, t("admin.tags.errors.loadFailed")));
    } finally {
      setIsLoading(false);
    }
  }, [t]);

  useEffect(() => {
    load();
  }, [load]);

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
        const created = await createTag(payload);
        setTags((current) => [...current, created]);
        setMessage(t("admin.tags.created"));
      } else {
        const updated = await updateTag(editingId, payload);

        setTags((current) => {
          return current.map((tag) => (tag.id === updated.id ? updated : tag));
        });

        setMessage(t("admin.tags.updated"));
      }

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

      setTags((current) => current.filter((item) => item.id !== tag.id));
      setMessage(t("admin.tags.deleted"));
    } catch (deleteError) {
      setError(getMessage(deleteError, t("admin.tags.errors.deleteFailed")));
    } finally {
      setBusyId(null);
    }
  }

  return {
    tags,
    isLoading,
    error,
    message,
    busyId,
    isSaving,
    save,
    remove,
    isEmpty: !isLoading && !error && tags.length === 0,
  };
}
