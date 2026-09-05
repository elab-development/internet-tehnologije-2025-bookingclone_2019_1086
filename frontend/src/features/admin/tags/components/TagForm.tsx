import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { TagDto, TagPayload } from "../../../tags/services/tagService";
import TagIcon from "../../../tags/components/TagIcon";

type TagFormProps = {
  editing: TagDto | null;
  isSaving: boolean;
  onSubmit: (payload: TagPayload) => void;
  onCancel: () => void;
};

export default function TagForm({
  editing,
  isSaving,
  onSubmit,
  onCancel,
}: TagFormProps) {
  const { t } = useTranslation();

  const [name, setName] = useState("");
  const [iconKey, setIconKey] = useState("");
  const [svgIcon, setSvgIcon] = useState("");

  useEffect(() => {
    setName(editing?.name ?? "");
    setIconKey(editing?.icon_key ?? "");
    setSvgIcon(editing?.svg_icon ?? "");
  }, [editing]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    onSubmit({
      name: name.trim(),
      icon_key: iconKey.trim(),
      svg_icon: svgIcon.trim() ? svgIcon.trim() : null,
    });
  }

  function getTitle() {
    if (editing) {
      return t("admin.tags.form.editTitle", { name: editing.name });
    }

    return t("admin.tags.form.createTitle");
  }

  return (
    <form className="admin-tags__form" onSubmit={handleSubmit}>
      <h2 className="admin-tags__form-title">{getTitle()}</h2>

      <div className="admin-tags__form-row">
        <div className="admin-tags__field">
          <label className="admin-tags__label" htmlFor="tag-name">
            {t("admin.tags.form.name")}
          </label>

          <input
            id="tag-name"
            className="admin-tags__input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            required
            maxLength={100}
            disabled={isSaving}
            placeholder={t("admin.tags.form.namePlaceholder")}
          />
        </div>

        <div className="admin-tags__field">
          <label className="admin-tags__label" htmlFor="tag-key">
            {t("admin.tags.form.iconKey")}
          </label>

          <input
            id="tag-key"
            className="admin-tags__input"
            value={iconKey}
            onChange={(event) => setIconKey(event.target.value)}
            required
            maxLength={100}
            disabled={isSaving}
            placeholder="wifi"
          />
        </div>
      </div>

      <div className="admin-tags__field">
        <label className="admin-tags__label" htmlFor="tag-svg">
          {t("admin.tags.form.svg")}
        </label>

        <textarea
          id="tag-svg"
          className="admin-tags__input admin-tags__textarea"
          value={svgIcon}
          onChange={(event) => setSvgIcon(event.target.value)}
          rows={5}
          disabled={isSaving}
          placeholder="<svg ...>...</svg>"
        />

        <div className="admin-tags__preview">
          <span className="admin-tags__preview-label">
            {t("admin.tags.form.preview")}
          </span>

          <TagIcon svg={svgIcon} label={name || "preview"} className="admin-tags__icon" />
        </div>
      </div>

      <div className="admin-tags__form-actions">
        <button type="submit" className="btn btn-primary" disabled={isSaving}>
          {isSaving ? t("admin.tags.form.saving") : t("admin.tags.form.save")}
        </button>

        <button
          type="button"
          className="btn btn-outline-secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          {t("admin.tags.form.cancel")}
        </button>
      </div>
    </form>
  );
}
