import { useState } from "react";
import { useTranslation } from "react-i18next";

import { useAdminTags } from "../hooks/useAdminTags";
import TagForm from "../components/TagForm";
import TagIcon from "../../../tags/components/TagIcon";
import type { TagDto, TagPayload } from "../../../tags/services/tagService";

import "../styles/AdminTagsPage.css";

export default function AdminTagsPage() {
  const { t } = useTranslation();

  const { tags, isLoading, error, message, busyId, isSaving, save, remove, isEmpty } =
    useAdminTags();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editing, setEditing] = useState<TagDto | null>(null);

  function openCreate() {
    setEditing(null);
    setIsFormOpen(true);
  }

  function openEdit(tag: TagDto) {
    setEditing(tag);
    setIsFormOpen(true);
  }

  function closeForm() {
    setIsFormOpen(false);
    setEditing(null);
  }

  async function handleSubmit(payload: TagPayload) {
    const saved = await save(payload, editing ? editing.id : null);

    if (saved) {
      closeForm();
    }
  }

  function handleDelete(tag: TagDto) {
    const confirmed = window.confirm(
      t("admin.tags.confirmDelete", { name: tag.name })
    );

    if (confirmed) {
      remove(tag);
    }
  }

  function renderState() {
    if (isLoading) {
      return <p className="admin-tags__state">{t("admin.tags.loading")}</p>;
    }

    if (isEmpty) {
      return <p className="admin-tags__state">{t("admin.tags.empty")}</p>;
    }

    return null;
  }

  return (
    <main className="admin-tags">
      <header className="admin-tags__header">
        <div>
          <h1 className="admin-tags__title">{t("admin.tags.title")}</h1>
          <p className="admin-tags__subtitle">{t("admin.tags.subtitle")}</p>
        </div>

        {!isFormOpen ? (
          <button type="button" className="btn btn-primary" onClick={openCreate}>
            {t("admin.tags.addButton")}
          </button>
        ) : null}
      </header>

      {error ? (
        <p className="admin-tags__banner admin-tags__banner--error" role="alert">
          {error}
        </p>
      ) : null}

      {message ? (
        <p className="admin-tags__banner admin-tags__banner--success" role="status">
          {message}
        </p>
      ) : null}

      {isFormOpen ? (
        <TagForm
          editing={editing}
          isSaving={isSaving}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      ) : null}

      {renderState()}

      {tags.length > 0 ? (
        <div className="admin-tags__table-wrapper">
          <table className="admin-tags__table">
            <thead>
              <tr>
                <th scope="col">{t("admin.tags.table.icon")}</th>
                <th scope="col">{t("admin.tags.table.name")}</th>
                <th scope="col">{t("admin.tags.table.key")}</th>
                <th scope="col">{t("admin.tags.table.actions")}</th>
              </tr>
            </thead>

            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td>
                    <TagIcon svg={tag.svg_icon} label={tag.name} className="admin-tags__icon" />
                  </td>

                  <td className="admin-tags__name">{tag.name}</td>

                  <td>
                    <code className="admin-tags__key">{tag.icon_key}</code>
                  </td>

                  <td className="admin-tags__actions">
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => openEdit(tag)}
                      disabled={busyId !== null}
                    >
                      {t("admin.tags.table.edit")}
                    </button>

                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(tag)}
                      disabled={busyId !== null}
                    >
                      {t("admin.tags.table.delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </main>
  );
}
